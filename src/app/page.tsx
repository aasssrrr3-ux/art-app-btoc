"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Flame, Play, Square, Camera, Target, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/context/TimerContext";
import { NotificationBell } from "@/components/NotificationBell";
import { resizeImage } from "@/lib/resizeImage";

export default function HomePage() {
  const { seconds, isActive, start, stop, reset, formatTime } = useTimer();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOptimizing(true);
    try {
      const optimized = await resizeImage(file, 1200, 0.8);
      setImage(optimized);
      setPreviewUrl(URL.createObjectURL(optimized));
    } catch (err) {
      // フォールバック: リサイズ失敗時は元画像を使用
      console.error("Resize failed, using original:", err);
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-white font-sans">
      {/* ヘッダー */}
      <div className="p-6 border-b-4 border-black flex justify-between items-center bg-white sticky top-0 z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 fill-orange-500 text-orange-500" />
            <span className="font-black text-xl italic uppercase">今日も頑張ろう！</span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">前回：1日前 2時間</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 赤い回転バッジ */}
          <div className="bg-red-500 border-2 border-black px-2 py-1 -rotate-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden sm:block">
            <span className="text-white text-[10px] font-black uppercase">前回比 -10分</span>
          </div>
          {/* 通知ベル */}
          <NotificationBell />
        </div>
      </div>

      <main className="p-6 space-y-8 max-w-md mx-auto">
        {/* タイマー表示 */}
        <div className="text-center space-y-2">
          <p className={cn(
            "text-[10px] font-black tracking-[0.3em] uppercase",
            isActive ? "text-orange-500 animate-pulse" : "text-gray-400"
          )}>
            {isActive ? "● 計測中..." : "待機中"}
          </p>
          <div className="text-7xl font-black tabular-nums tracking-tighter border-y-4 border-black py-4">
            {formatTime(seconds)}
          </div>
        </div>

        {/* 巨大な炎アイコン */}
        <div className="flex flex-col items-center justify-center py-10 relative">
          <div className={cn(
            "transition-all duration-500 p-8 rounded-full border-8 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]",
            isActive ? "bg-orange-500 scale-110" : "bg-white"
          )}>
            <Flame className={cn(
              "w-24 h-24",
              isActive ? "text-white fill-white animate-bounce" : "text-black"
            )} />
          </div>
          {isActive && (
            <p className="mt-8 font-black text-sm animate-bounce">
              🔥 現在 <span className="text-orange-500">128人</span> が計測中！
            </p>
          )}
        </div>

        {/* 操作系 */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => isActive ? stop() : start()}
            className={cn(
              "flex flex-col items-center justify-center p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all",
              isActive ? "bg-black text-white" : "bg-white text-black"
            )}
          >
            {isActive ? <Square className="w-10 h-10 mb-2 fill-current" /> : <Play className="w-10 h-10 mb-2 fill-current" />}
            <span className="font-black text-xs uppercase">{isActive ? "STOP" : "START"}</span>
          </button>

          <button
            onClick={handleCameraClick}
            disabled={isOptimizing}
            className={cn(
              "flex flex-col items-center justify-center p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all",
              isOptimizing && "opacity-60 cursor-wait"
            )}
          >
            {isOptimizing ? (
              <>
                <Loader2 className="w-10 h-10 mb-2 animate-spin" strokeWidth={3} />
                <span className="font-black text-[9px] uppercase tracking-tight">OPTIMIZING...</span>
              </>
            ) : (
              <>
                <Camera className="w-10 h-10 mb-2" strokeWidth={3} />
                <span className="font-black text-xs uppercase">EVIDENCE</span>
              </>
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>

        {/* OPTIMIZING オーバーレイ */}
        {isOptimizing && (
          <div className="border-4 border-black p-4 bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" strokeWidth={3} />
            <p className="font-black text-xs uppercase">画像を最適化中...</p>
            <p className="text-[8px] font-bold text-black/60">1200px / JPEG 80%</p>
          </div>
        )}

        {/* 撮影済みプレビュー */}
        {previewUrl && !isOptimizing && (
          <div className="border-4 border-black p-2 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover grayscale border-2 border-black" />
            <div className="flex justify-between items-center mt-2 px-1">
              <p className="text-[10px] font-black uppercase">エビデンス画像をセット済み</p>
              {image && (
                <p className="text-[8px] font-bold text-gray-400">
                  {(image.size / 1024).toFixed(0)}KB
                </p>
              )}
            </div>
          </div>
        )}

        {/* ウィークリーミッション */}
        <section className="border-4 border-black p-4 bg-green-50 space-y-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 border-b-2 border-black pb-2">
            <Target className="w-5 h-5" />
            <h2 className="font-black text-sm uppercase">Weekly Mission</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "合計3時間計測する", progress: 65 },
              { label: "作品を2枚投稿する", progress: 50 },
              { label: "5日連続で記録する", progress: 80 },
            ].map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-black">
                  <span>{m.label}</span>
                  <span>{m.progress}%</span>
                </div>
                <div className="h-3 bg-gray-200 border-2 border-black overflow-hidden">
                  <div className="h-full bg-black" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}