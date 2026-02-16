"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Flame, Sparkles, Heart, BicepsFlexed, Clock, User,
    Search, Plus, LayoutGrid, History, HelpCircle, Star, Users
} from "lucide-react";
import { cn } from "@/lib/utils";

// 型エラーを防ぐための定義
interface ProcessLog {
    id: string;
    user_id: string;
    created_at: string;
    duration_seconds: number;
    image_url: string | null;
    reactions: Record<string, number>;
    projects: { title: string; status: string } | null;
    effortScore?: number;
    user_streak?: number;
}

const REACTIONS = [
    { type: "fire", icon: Flame, color: "text-orange-500" },
    { type: "sparkle", icon: Sparkles, color: "text-yellow-500" },
    { type: "heart", icon: Heart, color: "text-pink-500" },
    { type: "muscle", icon: BicepsFlexed, color: "text-blue-500" },
];

const BOARD_MENU = [
    { label: "板一覧", icon: LayoutGrid },
    { label: "参加中", icon: Users },
    { label: "人気", icon: Star },
    { label: "初心者", icon: HelpCircle },
    { label: "相談", icon: MessageCircleSquare }, // 下で定義
    { label: "履歴", icon: History },
];

function MessageCircleSquare(props: any) {
    return <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...props} />
}

export default function FeedPage() {
    const [logs, setLogs] = useState<ProcessLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"popular" | "rookie" | "following">("popular");

    const calculateEffortScore = (log: ProcessLog, userPostCount: number) => {
        const durationScore = log.duration_seconds * 0.1;
        const streakScore = (log.user_streak || 0) * 100;
        const reactionScore = Object.values(log.reactions || {}).reduce((a, b) => a + Number(b), 0);
        let score = durationScore + streakScore + reactionScore;
        if (userPostCount < 5) score *= 1.5;
        return score;
    };

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("process_logs")
            .select(`*, projects (title, status)`);

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        const userPostCounts: Record<string, number> = {};
        data?.forEach((log: any) => {
            userPostCounts[log.user_id] = (userPostCounts[log.user_id] || 0) + 1;
        });

        // データがない場合のダミーデータ生成
        let displayData = (data as any[]) || [];
        if (displayData.length === 0) {
            displayData = Array(12).fill(null).map((_, i) => ({
                id: `mock-${i}`,
                user_id: `user-${i}`,
                created_at: new Date().toISOString(),
                duration_seconds: Math.floor(Math.random() * 7200),
                image_url: null,
                reactions: { fire: Math.floor(Math.random() * 20) },
                projects: { title: "練習中...", status: "ラフ" },
                user_streak: Math.floor(Math.random() * 10)
            }));
        }

        const scoredLogs = displayData.map(log => ({
            ...log,
            effortScore: calculateEffortScore(log, userPostCounts[log.user_id] || 0)
        })).sort((a, b) => (b.effortScore || 0) - (a.effortScore || 0));

        setLogs(scoredLogs);
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, []);

    const filteredLogs = activeTab === "popular" ? logs : [...logs].reverse();

    return (
        <div className="min-h-screen pb-32 bg-background">
            {/* 設計図再現：検索バー */}
            <div className="p-4 bg-white border-b-4 border-black sticky top-0 z-30 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="キーワードで検索"
                        className="w-full bg-gray-100 border-4 border-black p-2 pl-10 font-bold focus:outline-none"
                    />
                </div>

                {/* 設計図再現：アイコンメニュー (横スクロール) */}
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {BOARD_MENU.map((menu) => (
                        <div key={menu.label} className="flex flex-col items-center min-w-[60px] gap-1">
                            <div className="w-12 h-12 rounded-full border-4 border-black flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-0.5 transition-all">
                                <menu.icon className="w-6 h-6" strokeWidth={3} />
                            </div>
                            <span className="text-[10px] font-black">{menu.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* タブメニュー */}
            <div className="flex border-b-4 border-black bg-white sticky top-[138px] z-20">
                {["popular", "rookie", "following"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={cn(
                            "flex-1 p-3 font-black text-sm uppercase tracking-tighter transition-colors",
                            activeTab === tab ? "bg-black text-white" : "bg-white text-gray-400"
                        )}
                    >
                        {tab === "popular" ? "人気イラスト" : tab === "rookie" ? "ルーキー" : "フォロー中"}
                    </button>
                ))}
            </div>

            {/* 3列グリッドフィード */}
            <div className="p-1 grid grid-cols-3 gap-1">
                {filteredLogs.map((log, index) => (
                    <div key={log.id} className="aspect-square bg-white border-2 border-black relative group overflow-hidden">
                        {log.image_url ? (
                            <img src={log.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-2xl">🎨</div>
                        )}

                        {/* 努力値オーバーレイ */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-[8px] text-white font-black">
                                <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                                {Math.floor(log.effortScore || 0)}
                            </div>
                        </div>

                        {/* 順位バッジ (Top 3) */}
                        {activeTab === "popular" && index < 3 && (
                            <div className={cn(
                                "absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-black border-r-2 border-b-2 border-black",
                                index === 0 ? "bg-yellow-400" : index === 1 ? "bg-gray-200" : "bg-orange-400"
                            )}>
                                #{index + 1}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}