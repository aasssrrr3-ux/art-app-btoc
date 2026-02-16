"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Flame, Sparkles, Heart, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Notification {
    id: string;
    type: string;
    message: string;
    from_user_name: string | null;
    is_read: boolean;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    // ユーザー取得 & 初期フェッチ
    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;
            setUserId(session.user.id);

            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (data) setNotifications(data);
        };
        init();
    }, []);

    // Realtime購読
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel("notifications-realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    setNotifications((prev) => [payload.new as Notification, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // 全て既読にする
    const markAllRead = async () => {
        if (!userId) return;
        await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    // 外側クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "reaction": return <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />;
            case "sparkle": return <Sparkles className="w-4 h-4 text-yellow-500" />;
            case "heart": return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "たった今";
        if (mins < 60) return `${mins}分前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}時間前`;
        return `${Math.floor(hours / 24)}日前`;
    };

    // ダミーデータ（通知が無い場合の表示用）
    const displayNotifications: Notification[] = notifications.length > 0 ? notifications : [
        { id: "d1", type: "reaction", message: "あなたの投稿に🔥をつけました", from_user_name: "初心者A", is_read: false, created_at: new Date(Date.now() - 120000).toISOString() },
        { id: "d2", type: "sparkle", message: "あなたの投稿に✨をつけました", from_user_name: "先輩B", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: "d3", type: "heart", message: "あなたの投稿に❤️をつけました", from_user_name: "努力家C", is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: "d4", type: "reaction", message: "あなたの投稿に🔥をつけました", from_user_name: "ペン探し中", is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
    ];

    const displayUnread = displayNotifications.filter((n) => !n.is_read).length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* ベルアイコン */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all"
            >
                <Bell className="w-5 h-5" strokeWidth={3} />
                {displayUnread > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center border-2 border-black animate-bounce">
                        {displayUnread}
                    </span>
                )}
            </button>

            {/* ドロップダウン */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* ヘッダー */}
                    <div className="flex justify-between items-center p-3 border-b-4 border-black bg-yellow-400">
                        <h3 className="font-black text-sm uppercase">通知</h3>
                        <div className="flex gap-1">
                            {displayUnread > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="p-1 bg-white border-2 border-black text-[8px] font-black flex items-center gap-0.5"
                                >
                                    <Check className="w-3 h-3" /> 既読
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 bg-white border-2 border-black"
                            >
                                <X className="w-3 h-3" strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* 通知リスト */}
                    <div className="divide-y-2 divide-black">
                        {displayNotifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "p-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors",
                                    !notif.is_read && "bg-orange-50"
                                )}
                            >
                                {/* アバター */}
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                    {notif.from_user_name?.[0] || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        {getIcon(notif.type)}
                                        <span className="font-black text-[11px]">{notif.from_user_name || "匿名"}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-600 mt-0.5 truncate">{notif.message}</p>
                                    <p className="text-[8px] font-bold text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                                </div>
                                {!notif.is_read && (
                                    <div className="w-2.5 h-2.5 bg-red-500 border border-black rounded-full shrink-0 mt-1" />
                                )}
                            </div>
                        ))}
                    </div>

                    {displayNotifications.length === 0 && (
                        <div className="p-8 text-center">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-[10px] font-black text-gray-400">通知はありません</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
