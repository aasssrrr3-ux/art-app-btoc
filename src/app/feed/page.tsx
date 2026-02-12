"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Flame, Sparkles, Heart, BicepsFlexed, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const REACTIONS = [
    { type: "fire", icon: Flame, color: "text-orange-500", label: "かっこいい" },
    { type: "sparkle", icon: Sparkles, color: "text-yellow-500", label: "すてき" },
    { type: "heart", icon: Heart, color: "text-pink-500", label: "かわいい" },
    { type: "muscle", icon: BicepsFlexed, color: "text-blue-500", label: "がんばった" },
];

// 型エラーを消すために定義を整理
interface ProcessLog {
    id: string;
    user_id: string;
    created_at: string;
    duration_seconds: number;
    image_url: string | null;
    reactions: any; // Record<string, number> ではなく any で柔軟に
    projects: any;  // Joinデータは any で受けるのがエラー解消の近道
    effortScore?: number;
    user_streak?: number;
}

export default function FeedPage() {
    const [logs, setLogs] = useState<ProcessLog[]>([]);
    const [loading, setLoading] = useState(true);

    const calculateEffortScore = (log: ProcessLog, userPostCount: number) => {
        const durationScore = log.duration_seconds * 0.1;
        const streakScore = (log.user_streak || 0) * 100;
        // any キャストで reduce のエラーを回避
        const reactionScore = Object.values(log.reactions || {}).reduce((a: any, b: any) => a + parseInt(b || "0"), 0);

        let score = (durationScore + streakScore + Number(reactionScore));
        if (userPostCount < 5) score *= 1.5;
        return score;
    };

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from("process_logs")
            .select(`*, projects (title, status, is_public)`);

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        const userPostCounts: Record<string, number> = {};
        (data as any[])?.forEach(log => {
            userPostCounts[log.user_id] = (userPostCounts[log.user_id] || 0) + 1;
        });

        const scoredLogs = (data as any[])?.map(log => ({
            ...log,
            effortScore: calculateEffortScore(log, userPostCounts[log.user_id] || 0)
        })).sort((a, b) => (b.effortScore || 0) - (a.effortScore || 0));

        setLogs(scoredLogs);
        setLoading(false);
    };

    useEffect(() => {
        fetchLogs();
        const channel = supabase
            .channel("feed-reactions")
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "process_logs" }, (payload: any) => {
                // ペイロードを any で受けることで .new へのアクセスエラーを解消 [cite: 2025-08-14]
                const newReactions = payload.new.reactions;
                setLogs((currentLogs) => currentLogs.map((log) =>
                    log.id === payload.new.id ? { ...log, reactions: newReactions } : log
                ));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleReaction = async (logId: string, type: string) => {
        setLogs((currentLogs) => currentLogs.map((log) => {
            if (log.id === logId) {
                const reactions = log.reactions ? { ...log.reactions } : {};
                reactions[type] = (parseInt(reactions[type] || "0")) + 1;
                return { ...log, reactions };
            }
            return log;
        }));
        await supabase.rpc("increment_reaction", { log_id: logId, reaction_type: type });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center font-black">Loading...</div>;

    return (
        <div className="min-h-screen pb-32 p-4 max-w-md mx-auto space-y-8 bg-background">
            <h1 className="text-4xl font-black text-center border-b-4 border-black pb-4 italic">EFFORT RANKING</h1>

            {logs.map((log, index) => {
                const isTop3 = index < 3;
                const project = log.projects as any;

                return (
                    <div key={log.id} className={cn(
                        "bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative",
                        isTop3 ? "border-yellow-500 ring-4 ring-yellow-300 ring-offset-4 ring-offset-black" : ""
                    )}>
                        <div className={cn(
                            "absolute top-0 left-0 z-10 p-3 font-black text-xl border-r-4 border-b-4 border-black rounded-br-xl",
                            isTop3 ? "bg-yellow-400 text-black" : "bg-black text-white"
                        )}>#{index + 1}</div>

                        <div className={cn("p-4 border-b-4 border-black flex justify-between items-center pl-16", isTop3 ? "bg-yellow-50" : "bg-gray-50")}>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full border-4 border-black bg-white flex items-center justify-center">
                                    <User strokeWidth={3} className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-lg leading-none">{project?.title || "Unknown Project"}</p>
                                    <span className="text-xs font-bold text-gray-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="bg-black text-white px-2 py-1 text-xs font-black rounded">{project?.status || "Work"}</div>
                        </div>

                        <div className="aspect-square bg-gray-100 flex items-center justify-center border-b-4 border-black">
                            {log.image_url ? (
                                <img src={log.image_url} alt="Log" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-gray-400 font-black">
                                    <span className="text-4xl block mb-2">📷</span>No Image
                                </div>
                            )}
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2 font-black text-xl">
                                <Clock strokeWidth={4} className="w-6 h-6" />
                                <span>{Math.floor(log.duration_seconds / 60)} min</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {REACTIONS.map(({ type, icon: Icon, color }) => (
                                    <button
                                        key={type}
                                        onClick={() => handleReaction(log.id, type)}
                                        className="aspect-square flex flex-col items-center justify-center border-4 border-black rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
                                    >
                                        <Icon className={cn("w-6 h-6 mb-1", color)} strokeWidth={4} />
                                        <span className="font-black text-xs">{log.reactions?.[type] || 0}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
