"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Flame, Trophy, Clock, Calendar, TrendingUp, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({ totalHours: 0, totalPosts: 0, streak: 0, rank: "ルーキー" });

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                const { data: logs } = await supabase
                    .from("process_logs")
                    .select("*")
                    .eq("user_id", session.user.id);
                if (logs) {
                    const totalSec = logs.reduce((a: number, l: any) => a + (l.duration_seconds || 0), 0);
                    const hours = Math.floor(totalSec / 3600);
                    const days = new Set(logs.map((l: any) => new Date(l.created_at).toDateString())).size;
                    setStats({
                        totalHours: hours,
                        totalPosts: logs.length,
                        streak: days,
                        rank: hours >= 100 ? "マスター" : hours >= 30 ? "中級者" : "ルーキー",
                    });
                }
            }
        };
        fetchUser();
    }, []);

    const statCards = [
        { label: "総計測時間", value: `${stats.totalHours}h`, icon: Clock, color: "bg-orange-100" },
        { label: "投稿数", value: stats.totalPosts, icon: Star, color: "bg-blue-100" },
        { label: "連続記録", value: `${stats.streak}日`, icon: Flame, color: "bg-red-100" },
        { label: "ランク", value: stats.rank, icon: Trophy, color: "bg-yellow-100" },
    ];

    return (
        <div className="min-h-screen pb-32 bg-white font-sans">
            {/* ヘッダー */}
            <div className="bg-yellow-400 border-b-4 border-black p-6 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                    <h1 className="text-2xl font-black italic uppercase">プロフィール</h1>
                    <Link href="/settings" className="p-2 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all">
                        <Settings className="w-5 h-5" strokeWidth={3} />
                    </Link>
                </div>
                {/* 背景デコレーション */}
                <Trophy className="absolute -bottom-4 -right-4 w-32 h-32 text-yellow-500 opacity-30" strokeWidth={1} />
            </div>

            <main className="p-6 space-y-6 max-w-md mx-auto">
                {/* アバターカード */}
                <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 -mt-8 relative z-10">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white text-2xl font-black shrink-0">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0">
                        <p className="font-black text-lg truncate">{user?.email || "ゲスト"}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MEMBER SINCE 2026</p>
                    </div>
                </div>

                {/* 統計グリッド */}
                <div className="grid grid-cols-2 gap-3">
                    {statCards.map((s, i) => (
                        <div key={i} className={cn(
                            "border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                            s.color
                        )}>
                            <s.icon className="w-6 h-6 mb-2" strokeWidth={3} />
                            <p className="text-3xl font-black">{s.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* 週間グラフ（モック） */}
                <section className="border-4 border-black p-4 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3">
                    <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                        <TrendingUp className="w-5 h-5" strokeWidth={3} />
                        <h2 className="font-black text-sm uppercase">週間アクティビティ</h2>
                    </div>
                    <div className="flex items-end justify-between gap-2 h-24 pt-2">
                        {["月", "火", "水", "木", "金", "土", "日"].map((day, i) => {
                            const h = [40, 70, 30, 90, 60, 100, 20][i];
                            return (
                                <div key={day} className="flex flex-col items-center gap-1 flex-1">
                                    <div
                                        className="w-full bg-black border-2 border-black min-h-[4px]"
                                        style={{ height: `${h}%` }}
                                    />
                                    <span className="text-[9px] font-black">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 実績バッジ（モック） */}
                <section className="border-4 border-black p-4 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-3">
                    <h2 className="font-black text-sm uppercase border-b-2 border-black pb-2">🏅 実績バッジ</h2>
                    <div className="flex gap-3 flex-wrap">
                        {["初投稿", "3日連続", "10時間達成", "???"].map((badge, i) => (
                            <div key={i} className={cn(
                                "px-3 py-2 border-2 border-black text-[10px] font-black",
                                i < 3 ? "bg-yellow-400" : "bg-gray-200 text-gray-400"
                            )}>
                                {badge}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
