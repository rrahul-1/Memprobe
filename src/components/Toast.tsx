"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

export type ToastType = "error" | "success" | "info";

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
    exiting: boolean;
}

interface ToastCtx {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

const COLORS: Record<ToastType, { border: string; icon: string; text: string }> = {
    error:   { border: "rgba(229,83,75,0.30)",    icon: "#E5534B", text: "#E5534B" },
    success: { border: "rgba(29,213,163,0.30)",   icon: "#1DD5A3", text: "#1DD5A3" },
    info:    { border: "rgba(124,110,248,0.30)",  icon: "#7C6EF8", text: "#9896A4" },
};

const ICONS: Record<ToastType, React.ReactNode> = {
    error: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
        </svg>
    ),
    success: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
        </svg>
    ),
    info: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
        </svg>
    ),
};

const DISMISS_DELAY = 4000;
const EXIT_DURATION = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const nextId = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, EXIT_DURATION);
    }, []);

    const toast = useCallback((message: string, type: ToastType = "error") => {
        const id = nextId.current++;
        setToasts(prev => [...prev, { id, message, type, exiting: false }]);
        const timer = setTimeout(() => dismiss(id), DISMISS_DELAY);
        return () => clearTimeout(timer);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div
                className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
                aria-live="polite"
            >
                {toasts.map(t => {
                    const c = COLORS[t.type];
                    return (
                        <div
                            key={t.id}
                            className="pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 rounded-xl max-w-[360px] min-w-[260px]"
                            style={{
                                background: "#18181C",
                                border: `1px solid ${c.border}`,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                animation: t.exiting
                                    ? `toastOut ${EXIT_DURATION}ms ease-in forwards`
                                    : "toastIn 180ms ease-out",
                            }}
                        >
                            <span style={{ color: c.icon, flexShrink: 0, paddingTop: 1 }}>
                                {ICONS[t.type]}
                            </span>
                            <span className="text-[13px] leading-snug flex-1" style={{ color: "#EDECF0" }}>
                                {t.message}
                            </span>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 bg-transparent border-none cursor-pointer p-px mt-px"
                                style={{ color: "#5C5A6A" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#9896A4"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#5C5A6A"}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 6l12 12M18 6 6 18" />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
