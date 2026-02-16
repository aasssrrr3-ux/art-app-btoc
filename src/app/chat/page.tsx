"use client";

import { useState } from "react";
import { MessageCircle, Send, User, Clock, ThumbsUp, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Thread {
    id: string;
    title: string;
    author: string;
    replies: number;
    likes: number;
    time: string;
    pinned?: boolean;
    category: string;
}

const MOCK_THREADS: Thread[] = [
    { id: "1", title: "デッサンの影のつけ方がわかりません...", author: "初心者A", replies: 12, likes: 8, time: "2分前", pinned: true, category: "質問" },
    { id: "2", title: "おすすめのペンタブ教えてください！", author: "ペン探し中", replies: 24, likes: 15, time: "15分前", category: "相談" },
    { id: "3", title: "水彩風のデジタル塗りのコツ", author: "先輩B", replies: 7, likes: 32, time: "1時間前", category: "Tips" },
    { id: "4", title: "毎日30分の練習を続けた結果...", author: "努力家C", replies: 45, likes: 128, time: "3時間前", category: "報告" },
    { id: "5", title: "色塗りが苦手な人集まれ〜", author: "色弱D", replies: 18, likes: 22, time: "5時間前", category: "雑談" },
    { id: "6", title: "背景イラストのパース取り方", author: "建築好きE", replies: 9, likes: 41, time: "8時間前", category: "Tips" },
    { id: "7", title: "モチベーションが続かない時どうしてる？", author: "悩みF", replies: 31, likes: 56, time: "1日前", category: "相談" },
    { id: "8", title: "クロッキー会参加者募集！", author: "主催G", replies: 14, likes: 19, time: "1日前", pinned: true, category: "募集" },
];

const CATEGORIES = ["すべて", "質問", "相談", "Tips", "報告", "雑談", "募集"];

export default function ChatPage() {
    const [selectedCategory, setSelectedCategory] = useState("すべて");

    const filteredThreads = selectedCategory === "すべて"
        ? MOCK_THREADS
        : MOCK_THREADS.filter(t => t.category === selectedCategory);

    return (
        <div className="min-h-screen pb-32 bg-white font-sans">
            {/* ヘッダー */}
            <div className="bg-blue-400 border-b-4 border-black p-6 relative overflow-hidden">
                <h1 className="text-2xl font-black italic uppercase relative z-10">相談掲示板</h1>
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest relative z-10">みんなで上達しよう</p>
                <MessageCircle className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500 opacity-30" strokeWidth={1} />
            </div>

            <main className="max-w-md mx-auto">
                {/* カテゴリフィルター */}
                <div className="flex overflow-x-auto gap-2 p-4 border-b-4 border-black no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-black border-2 border-black whitespace-nowrap transition-all active:translate-y-0.5",
                                selectedCategory === cat
                                    ? "bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    : "bg-white text-black"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* 新規投稿ボタン */}
                <div className="p-4">
                    <button className="w-full border-4 border-black bg-blue-400 text-black p-3 font-black text-sm flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all">
                        <Send className="w-4 h-4" strokeWidth={3} />
                        新しいスレッドを作成
                    </button>
                </div>

                {/* スレッド一覧 */}
                <div className="divide-y-4 divide-black border-t-4 border-black">
                    {filteredThreads.map((thread) => (
                        <div key={thread.id} className="p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer active:bg-blue-50">
                            <div className="flex items-start gap-3">
                                {/* アバター */}
                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white text-sm font-black shrink-0">
                                    {thread.author[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        {thread.pinned && (
                                            <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 border border-black flex items-center gap-0.5">
                                                <Pin className="w-2.5 h-2.5" /> 固定
                                            </span>
                                        )}
                                        <span className="bg-blue-100 text-blue-800 text-[8px] font-black px-1.5 py-0.5 border border-black">
                                            {thread.category}
                                        </span>
                                    </div>
                                    <p className="font-black text-sm leading-snug truncate">{thread.title}</p>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-gray-400">
                                        <span className="flex items-center gap-0.5">
                                            <User className="w-3 h-3" /> {thread.author}
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <MessageCircle className="w-3 h-3" /> {thread.replies}
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <ThumbsUp className="w-3 h-3" /> {thread.likes}
                                        </span>
                                        <span className="flex items-center gap-0.5">
                                            <Clock className="w-3 h-3" /> {thread.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
