"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Flame, Zap, Play, Square, Clock, ArrowUpRight, LogOut, Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Timer States
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [streak, setStreak] = useState(0);
  const [exp, setExp] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // Weekly Stats
  const [weeklyStats, setWeeklyStats] = useState<number[]>(new Array(7).fill(0));

  // Project Data
  const [currentProject, setCurrentProject] = useState<any>(null);

  // Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Calculate Streak & EXP & Total Duration & Weekly Stats
  const calculateStats = (logs: any[]) => {
    if (!logs || logs.length === 0) {
      setStreak(0);
      setExp(0);
      setTotalDuration(0);
      setWeeklyStats(new Array(7).fill(0));
      return;
    }

    // 1. Total Duration
    const totalSec = logs.reduce((acc, log) => acc + log.duration_seconds, 0);
    setTotalDuration(totalSec);

    // 2. EXP (1 min = 10 EXP)
    const totalMinutes = Math.floor(totalSec / 60);
    setExp(totalMinutes * 10);

    // 3. Streak
    const dates = logs.map(log => new Date(log.created_at).toISOString().split('T')[0]);
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      let checkDate = new Date();
      if (!uniqueDates.includes(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
    setStreak(currentStreak);

    // 4. Weekly Stats (Last 7 days, Mon-Sun or just last 7 days from today?)
    // Requirement says "Weekly Graph". Let's do last 7 days relative to today for simplicity in "Portfolio",
    // or fixed Mon-Sun. Let's do fixed Mon-Sun or closest 7 days mapping.
    // Let's implement Last 7 Days (Today is index 6, 6 days ago is index 0) OR Mon-Sun.
    // The previous mock was Mon-Sun. Let's try to map to Mon-Sun.

    const dayStats = new Array(7).fill(0);
    // 0=Sun, 1=Mon ... 6=Sat in JS getDay().
    // We want Mon=0 ... Sun=6

    // Filter to this week/recent data? 
    // Portfolio "Trace of Effort" usually implies recent history. 
    // Let's take logs from last 7 days.
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      if (logDate > oneWeekAgo) {
        // Map to day of week. 
        // 0=Sun, 1=Mon...6=Sat.
        // Map to array index: Mon(0) -> Sun(6).
        // JS Day: 0(Sun), 1(Mon), 2(Tue)...
        // Target: 0(Mon), 1(Tue)... 6(Sun)
        let dayIndex = logDate.getDay() - 1;
        if (dayIndex < 0) dayIndex = 6; // Sunday

        dayStats[dayIndex] += Math.floor(log.duration_seconds / 60); // Minutes
      }
    });
    setWeeklyStats(dayStats);
  };

  const fetchData = async (userId: string) => {
    // Fetch Project
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (projects && projects.length > 0) {
      setCurrentProject(projects[0]);
    } else {
      // Auto-create Demo Project
      const { data: newProject } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          title: "マイ・プロジェクト",
          status: "ラフ"
        })
        .select()
        .single();
      setCurrentProject(newProject);
    }

    // Fetch Logs for Stats
    const { data: logs } = await supabase
      .from('process_logs')
      .select('*')
      .eq('user_id', userId);

    if (logs) calculateStats(logs);
  };

  // Auth & Initial Data Fetch
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      fetchData(session.user.id);
    };
    checkUser();
  }, [router]);

  // Robust Timer Logic (Date.now delta)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setSeconds(Math.floor((now - startTime) / 1000));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording, startTime]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('process-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload failed", uploadError);
      return null;
    }

    const { data } = supabase.storage.from('process-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // STOP recording
      if (!user || !currentProject) return;

      setIsSaving(true);
      const recordedSeconds = seconds;

      try {
        let imageUrl = null;
        // Upload Image if selected
        if (selectedFile) {
          imageUrl = await uploadImage(selectedFile, user.id);
        }

        const { error } = await supabase.from("process_logs").insert({
          user_id: user.id,
          project_id: currentProject.id,
          duration_seconds: recordedSeconds,
          image_url: imageUrl,
        });

        if (error) throw error;

        // Refresh Data
        await fetchData(user.id);

        // Success Feedback
        const earnedExp = Math.floor(recordedSeconds / 60) * 10 + 50;

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000); // Hide success after 3s
        setSeconds(0);
        setStartTime(null);
        setExp(prev => prev + earnedExp);

        // Reset file
        setSelectedFile(null);
        setPreviewUrl(null);

      } catch (err) {
        console.error("Save failed:", err);
        alert("保存に失敗しました");
        return;
      } finally {
        setIsSaving(false);
        setIsRecording(false);
      }
    } else {
      // START recording
      setStartTime(Date.now());
      setIsRecording(true);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTotalTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}時間${m}分`;
  };

  return (
    <div className="min-h-screen pb-32 space-y-8 p-4 max-w-md mx-auto relative bg-background">
      {/* Header: Duolingo-style Persistence */}
      <header className="flex justify-between items-center bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl relative">
        <div className="flex items-center gap-2 text-orange-500">
          <Flame className="w-6 h-6 fill-current" strokeWidth={4} />
          <span className="text-xl font-black">{streak}日連続</span>
        </div>
        <div className="flex items-center gap-2 text-yellow-500">
          <Zap className="w-6 h-6 fill-current" strokeWidth={4} />
          <span className="text-xl font-black">{exp} XP</span>
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="absolute -top-3 -right-3 bg-red-50 p-1 border-4 border-black rounded-full hover:bg-red-200"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content: Instagram-style Record */}
      <main className="space-y-6">
        <h2 className="text-2xl font-black px-2">現在のプロジェクト</h2>

        {/* Project Card */}
        <div className="bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div
            className="bg-gray-100 aspect-square flex items-center justify-center border-b-4 border-black relative group cursor-pointer"
            onClick={() => !isRecording && fileInputRef.current?.click()}
          >
            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isRecording}
            />

            {/* Image Preview or Placeholder */}
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center space-y-2 pointer-events-none">
                <span className="text-4xl text-gray-300">
                  <ImagePlus strokeWidth={3} className="w-12 h-12 mx-auto" />
                </span>
                <p className="font-black text-gray-400">
                  {isRecording ? "記録中..." : "タップして画像を選択"}
                </p>
              </div>
            )}

            {/* Overlay improvement badge (Mock for now, logic can be added later) */}
            <div className="absolute top-4 right-4 bg-red-50 text-black border-4 border-black px-3 py-1 rounded-full flex items-center gap-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-2">
              <ArrowUpRight strokeWidth={4} className="w-4 h-4" />
              <span className="text-sm font-black">前回比 -10分</span>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black">{currentProject ? currentProject.title : "ロード中..."}</h3>
                <p className="text-gray-500 font-bold">工程: {currentProject ? currentProject.status : "..."}</p>
              </div>
              <div className="bg-black text-white px-3 py-1 rounded-lg font-black text-sm">
                In Progress
              </div>
            </div>

            <div className="flex items-center gap-3 text-xl font-black border-t-4 border-black pt-4">
              <Clock strokeWidth={4} className="w-6 h-6" />
              <span>累計: {formatTotalTime(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        <h2 className="text-2xl font-black px-2 pt-4">マイ・ポートフォリオ (過去7日間)</h2>
        <div className="bg-white border-4 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <h3 className="font-bold text-gray-500">週間エフォート</h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {weeklyStats.map((minutes, i) => {
              // Normalize height: find max or set fixed max (e.g. 180 min)
              const max = Math.max(...weeklyStats, 60);
              const heightPercent = minutes > 0 ? (minutes / max) * 100 : 5; // min 5%

              return (
                <div key={i} className="w-full bg-black rounded-t-md relative group transition-all duration-500" style={{ height: `${heightPercent}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    {minutes}分
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </main>


      {/* Footer / Action functionality */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none flex justify-center z-50">
        <button
          onClick={handleToggleRecording}
          disabled={!user || isSaving}
          className={cn(
            "pointer-events-auto",
            "w-24 h-24 rounded-full border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all",
            isRecording
              ? "bg-red-500 text-white animate-pulse shadow-none translate-y-2"
              : "bg-white text-black hover:-translate-y-1 active:translate-y-2 active:shadow-none",
            isSaving && "opacity-50 cursor-wait bg-gray-200"
          )}
        >
          {isSaving ? (
            <Loader2 strokeWidth={4} className="w-10 h-10 animate-spin" />
          ) : isRecording ? (
            <Square strokeWidth={4} className="w-8 h-8 fill-current" />
          ) : (
            <Camera strokeWidth={4} className="w-10 h-10" />
          )}
        </button>

        {isRecording && !isSaving && (
          <div className="absolute bottom-32 bg-black text-white px-6 py-2 rounded-xl text-3xl font-black border-4 border-white shadow-xl animate-bounce">
            {formatTime(seconds)}
          </div>
        )}

        {/* Success Feedback Overlay */}
        {saveSuccess && (
          <div className="absolute bottom-32 bg-yellow-400 text-black px-8 py-4 rounded-2xl text-2xl font-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-2">
            <CheckCircle2 strokeWidth={4} className="w-8 h-8" />
            <span>記録完了! +{Math.floor(isRecording ? 0 : (seconds / 60 * 10) || 10)} EXP</span>
          </div>
        )}
      </div>
    </div>
  );
}
