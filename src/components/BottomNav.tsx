"use client";

import { User, MessageCircle, Timer, FolderOpen, ClipboardList } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTimer } from "@/context/TimerContext";

const NAV_ITEMS = [
    { label: "ユーザー", icon: User, href: "/profile" },
    { label: "相談", icon: MessageCircle, href: "/chat" },
    { label: "タイマー", icon: Timer, href: "/" },
    { label: "管理", icon: FolderOpen, href: "/portfolio" },
    { label: "掲示板", icon: ClipboardList, href: "/feed" },
];

export function BottomNav() {
    const pathname = usePathname();
    const { isActive, seconds, formatTime } = useTimer();

    // ログイン画面ではナビを非表示
    if (pathname === "/login") return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black z-40">
            {/* タイマー作動中ミニバー */}
            {isActive && pathname !== "/" && (
                <div className="bg-orange-500 text-white text-center py-1 font-black text-xs animate-pulse">
                    🔥 計測中 {formatTime(seconds)}
                </div>
            )}
            <div className="max-w-md mx-auto flex justify-between items-center p-2 pb-6">
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center p-2 w-full gap-1 active:scale-95 transition-transform"
                        >
                            <item.icon
                                strokeWidth={3}
                                className={cn(
                                    "w-7 h-7",
                                    active ? "text-black" : "text-gray-400"
                                )}
                            />
                            <span className={cn(
                                "text-[10px] font-black tracking-tighter",
                                active ? "text-black" : "text-gray-400"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
