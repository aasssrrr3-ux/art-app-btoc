"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FolderOpen, Image, Clock, Sparkles, Plus, MoreVertical, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    title: string;
    status: string;
    imageCount: number;
    totalSeconds: number;
    lastImage?: string | null;
}

const MOCK_PROJECTS: Project[] = [
    { id: "m1", title: "キャラデザ練習", status: "WIP", imageCount: 8, totalSeconds: 14400 },
    { id: "m2", title: "背景スケッチ", status: "WIP", imageCount: 5, totalSeconds: 7200 },
    { id: "m3", title: "デッサン100体", status: "WIP", imageCount: 32, totalSeconds: 36000 },
    { id: "m4", title: "色彩研究", status: "完了", imageCount: 12, totalSeconds: 10800 },
    { id: "m5", title: "模写チャレンジ", status: "WIP", imageCount: 15, totalSeconds: 21600 },
    { id: "m6", title: "コミッション用", status: "下書き", imageCount: 3, totalSeconds: 5400 },
];

export default function PortfolioPage() {
    const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data } = await supabase
                .from("projects")
                .select("id, title, status")
                .eq("user_id", session.user.id);

            if (data && data.length > 0) {
                const enriched = await Promise.all(
                    data.map(async (p: any) => {
                        const { data: logs } = await supabase
                            .from("process_logs")
                            .select("duration_seconds, image_url")
                            .eq("project_id", p.id);
                        const totalSec = logs?.reduce((a: number, l: any) => a + (l.duration_seconds || 0), 0) || 0;
                        const lastLog = logs?.find((l: any) => l.image_url);
                        return {
                            ...p,
                            imageCount: logs?.filter((l: any) => l.image_url).length || 0,
                            totalSeconds: totalSec,
                            lastImage: lastLog?.image_url || null,
                        };
                    })
                );
                setProjects(enriched);
            }
        };
        fetchProjects();
    }, []);

    const formatHours = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
        <div className="min-h-screen pb-32 bg-white font-sans">
            {/* ヘッダー */}
            <div className="bg-white border-b-4 border-black p-6 relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <h1 className="text-2xl font-black italic uppercase">管理</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ポートフォリオ & プロジェクト</p>
                    </div>
                    <button className="p-2 bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-1 transition-all">
                        <Plus className="w-5 h-5" strokeWidth={3} />
                    </button>
                </div>
                <FolderOpen className="absolute -bottom-4 -right-4 w-32 h-32 text-gray-200" strokeWidth={1} />
            </div>

            <main className="p-4 max-w-md mx-auto space-y-4">
                {/* AI分析ボタン */}
                <button className="w-full border-4 border-black bg-purple-100 p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500 border-2 border-black flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-white" strokeWidth={3} />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-sm">AIに分析してもらう</p>
                        <p className="text-[10px] font-bold text-gray-500">あなたの制作傾向をAIが診断します</p>
                    </div>
                    <Sparkles className="w-5 h-5 ml-auto text-purple-500" strokeWidth={3} />
                </button>

                {/* プロジェクト3列グリッド */}
                <div className="grid grid-cols-3 gap-2">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden cursor-pointer group hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                        >
                            {/* サムネイル */}
                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                {project.lastImage ? (
                                    <img src={project.lastImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FolderOpen className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                                {/* ステータスバッジ */}
                                <div className={cn(
                                    "absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-black border-l-2 border-b-2 border-black",
                                    project.status === "完了" ? "bg-green-400" : project.status === "下書き" ? "bg-gray-300" : "bg-yellow-400"
                                )}>
                                    {project.status}
                                </div>
                            </div>
                            {/* 情報 */}
                            <div className="p-2 border-t-2 border-black space-y-0.5">
                                <p className="font-black text-[10px] leading-tight truncate">{project.title}</p>
                                <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400">
                                    <Image className="w-2.5 h-2.5" /> {project.imageCount}
                                    <span className="mx-0.5">·</span>
                                    <Clock className="w-2.5 h-2.5" /> {formatHours(project.totalSeconds)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 合計統計 */}
                <div className="border-4 border-black bg-black text-white p-4 shadow-[8px_8px_0px_0px_rgba(100,100,100,0.3)]">
                    <div className="grid grid-cols-3 text-center divide-x-2 divide-gray-600">
                        <div>
                            <p className="text-xl font-black">{projects.length}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Projects</p>
                        </div>
                        <div>
                            <p className="text-xl font-black">{projects.reduce((a, p) => a + p.imageCount, 0)}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Images</p>
                        </div>
                        <div>
                            <p className="text-xl font-black">{formatHours(projects.reduce((a, p) => a + p.totalSeconds, 0))}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Total Time</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
