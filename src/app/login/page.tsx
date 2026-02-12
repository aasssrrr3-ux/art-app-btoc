"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 12) {
            return "パスワードは12文字以上である必要があります。";
        }
        return null;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Validation
        if (isSignUp) {
            const pwdError = validatePassword(password);
            if (pwdError) {
                setError(pwdError);
                setLoading(false);
                return;
            }
        }

        try {
            if (isSignUp) {
                // Sign Up
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                alert("登録確認メールを送信しました。メールを確認してください。");
            } else {
                // Login
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (loginError) throw loginError;
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "認証エラーが発生しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black">ART APP</h1>
                    <p className="font-bold">創作活動を記録しよう</p>
                </div>

                <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 rounded-xl">
                    <h2 className="text-2xl font-black text-center">
                        {isSignUp ? "アカウント作成" : "ログイン"}
                    </h2>

                    {error && (
                        <div className="bg-red-50 border-4 border-black p-4 flex items-center gap-3 animate-pulse">
                            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" strokeWidth={3} />
                            <p className="text-red-900 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block font-black">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                placeholder="painter@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block font-black">Password {isSignUp && "(12文字以上)"}</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={cn(
                                    "w-full p-3 border-4 border-black font-bold focus:outline-none focus:translate-x-1 focus:translate-y-1 focus:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all",
                                    error && isSignUp && password.length < 12 ? "bg-red-50" : ""
                                )}
                                placeholder="************"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white p-4 font-black text-lg border-4 border-transparent hover:bg-white hover:text-black hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? "登録する" : "ログイン")}
                        </button>
                    </form>

                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                        className="w-full text-center font-bold underline decoration-4 underline-offset-4 hover:text-gray-600"
                    >
                        {isSignUp ? "すでにアカウントをお持ちの方" : "アカウントを作成する"}
                    </button>
                </div>
            </div>
        </div>
    );
}
