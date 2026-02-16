"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

interface TimerContextType {
    seconds: number;
    isActive: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
    formatTime: (sec: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    const start = () => setIsActive(true);
    const stop = () => setIsActive(false);
    const reset = () => {
        setIsActive(false);
        setSeconds(0);
    };

    const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <TimerContext.Provider value={{ seconds, isActive, start, stop, reset, formatTime }}>
            {children}
        </TimerContext.Provider>
    );
}

export function useTimer() {
    const context = useContext(TimerContext);
    if (!context) throw new Error("useTimer must be used within TimerProvider");
    return context;
}
