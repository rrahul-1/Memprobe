"use client";
import { useState, useEffect, useRef } from "react";
import { Memory } from "@/app/api/memories/route";
import { storage } from "@/lib/storage";
import { HistoryEvent } from "@/app/api/memories/[id]/history/route";

type Props = {
    memories: Memory[];
    initialMemoryId?: string | null;
    selectedUser?: string;
    selectedAgent?: string;
    selectedApp?: string;
    selectedRun?: string;
    onRefreshEntities?: () => void;
};

function relTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.round(diff / 86400)}d ago`;
    return `${Math.round(diff / (86400 * 30))}mo ago`;
}

function fullTime(iso: string) {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const EVENT_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
    ADD:    { color: "#1DD5A3", bg: "rgba(29,213,163,0.13)",  border: "rgba(29,213,163,0.20)",  label: "CREATED" },
    UPDATE: { color: "#F5A623", bg: "rgba(245,166,35,0.10)",  border: "rgba(245,166,35,0.25)",  label: "UPDATED" },
    DELETE: { color: "#E5534B", bg: "rgba(229,83,75,0.12)",   border: "rgba(229,83,75,0.30)",   label: "DELETED" },
    NOOP:   { color: "#9896A4", bg: "rgba(152,150,164,0.10)", border: "rgba(152,150,164,0.20)", label: "NO-OP" },
};

function TimelineEventCard({ e }: { e: HistoryEvent }) {
    const style = EVENT_STYLES[e.event] ?? EVENT_STYLES.NOOP;

    return (
        <div className="relative pb-5 ml-[-28px] pl-7">
            <span className="absolute left-[1.5px] top-2 w-3 h-3 rounded-full"
                style={{ background: style.color, boxShadow: `0 0 0 3px #0A0A0B, 0 0 12px ${style.color}` }} />
            <div className="flex items-center gap-2 mb-2">
                <span className="mono text-[10px] tracking-[1.4px] px-[7px] py-[2px] rounded"
                    style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                    {style.label}
                </span>
                <span className="text-[12px] text-[#EDECF0]">{relTime(e.updated_at)}</span>
                <span className="mono text-[11px] text-[#5C5A6A]">· {fullTime(e.updated_at)}</span>
            </div>
            <div className="bg-[#111113] border border-[#232329] rounded-[10px] p-3.5 flex flex-col gap-2.5">
                {e.event === "UPDATE" && e.old_memory ? (
                    <div className="grid text-[13px] gap-1" style={{ gridTemplateColumns: "52px 1fr" }}>
                        <span className="mono text-[11px] text-[#5C5A6A] pt-[2px]">was</span>
                        <span className="text-[#5C5A6A] line-through">"{e.old_memory}"</span>
                        <span className="mono text-[11px] text-[#5C5A6A] pt-[2px]">now</span>
                        <span className="text-[#EDECF0]">"{e.new_memory}"</span>
                    </div>
                ) : (
                    <div className="text-[14px] text-[#EDECF0] leading-snug">
                        "{e.new_memory ?? e.old_memory ?? "—"}"
                    </div>
                )}
                {(e.categories ?? []).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {(e.categories ?? []).map(c => (
                            <span key={c} className="inline-block text-[11px] px-[7px] py-px rounded-[4px]"
                                style={{ background: "rgba(124,110,248,0.10)", color: "#A8B3CF", border: "1px solid rgba(124,110,248,0.18)" }}>
                                {c}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const TimelineView = ({ memories, initialMemoryId, selectedUser, selectedAgent, selectedApp, selectedRun, onRefreshEntities }: Props) => {
    const firstId = initialMemoryId ?? memories[0]?.id ?? null;
    const [pickedId, setPickedId] = useState<string | null>(firstId);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    // Track previous scope to detect real changes (ref survives strict-mode double-invoke)
    const prevScopeKey = useRef(`${selectedUser}|${selectedAgent}|${selectedApp}|${selectedRun}`);

    useEffect(() => {
        if (initialMemoryId) setPickedId(initialMemoryId);
    }, [initialMemoryId]);

    // Clear timeline only when scope actually changes (not on initial mount / strict-mode re-run)
    useEffect(() => {
        const key = `${selectedUser}|${selectedAgent}|${selectedApp}|${selectedRun}`;
        if (prevScopeKey.current === key) return;
        prevScopeKey.current = key;
        setPickedId(null);
        setHistory([]);
        setError(null);
    }, [selectedUser, selectedAgent, selectedApp, selectedRun]);

    // Fetch history when picked memory changes or refresh is triggered
    useEffect(() => {
        if (!pickedId) return;
        const apiKey = storage.getApiKey();
        if (!apiKey) return;

        setLoading(true);
        setError(null);
        setHistory([]);

        fetch(`/api/memories/${pickedId}/history`, {
            headers: { "mem0-apiKey": apiKey },
        })
            .then(r => r.json())
            .then(json => {
                if (json.error) throw new Error(json.error);
                setHistory(json.data ?? []);
            })
            .catch(e => setError(e.message ?? "Failed to load history."))
            .finally(() => setLoading(false));
    }, [pickedId, historyRefresh]);

    const pickedMemory = memories.find(m => m.id === pickedId) ?? null;

    // Group history events by date bucket
    const now = Date.now();
    const D = 86400 * 1000;
    const today    = history.filter(e => (now - new Date(e.updated_at).getTime()) < D);
    const thisWeek = history.filter(e => { const d = now - new Date(e.updated_at).getTime(); return d >= D && d < 7 * D; });
    const older    = history.filter(e => (now - new Date(e.updated_at).getTime()) >= 7 * D);
    const groups = [
        { label: "TODAY",     events: today },
        { label: "THIS WEEK", events: thisWeek },
        { label: "EARLIER",   events: older },
    ].filter(g => g.events.length > 0);

    return (
        <main className="flex-1 min-w-0 flex flex-col bg-[#0A0A0B]">
            {/* header with memory picker */}
            <div className="h-14 shrink-0 px-5 flex items-center justify-between gap-4 border-b border-[#232329]">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="8" r="2" />
                        <path d="M6 8v8M18 10v2a3 3 0 0 1-3 3H8" />
                    </svg>
                    <span className="text-[14px] text-[#EDECF0] shrink-0">Timeline</span>
                    <span className="mono text-[12px] text-[#5C5A6A] shrink-0">·</span>

                    {/* memory picker */}
                    <div className="relative min-w-0 flex-1 max-w-[480px]">
                        <button
                            onClick={() => setPickerOpen(!pickerOpen)}
                            className="w-full flex items-center gap-2 h-[30px] px-2.5 rounded-md text-[12px] transition-all cursor-pointer"
                            style={{
                                background: pickerOpen ? "#18181C" : "#111113",
                                border: `1px solid ${pickerOpen ? "#2E2E38" : "#232329"}`,
                                color: "#EDECF0",
                            }}
                        >
                            {pickedMemory ? (
                                <>
                                    <span className="mono text-[10px] text-[#A8B3CF] px-[5px] py-[1px] bg-[#0A0A0B] border border-[#232329] rounded-sm shrink-0">
                                        {pickedMemory.id.slice(0, 8)}…
                                    </span>
                                    <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[#9896A4] flex-1 text-left">
                                        "{pickedMemory.memory.length > 60 ? pickedMemory.memory.slice(0, 60) + "…" : pickedMemory.memory}"
                                    </span>
                                </>
                            ) : (
                                <span className="text-[#5C5A6A]">Select a memory…</span>
                            )}
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5C5A6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>

                        {pickerOpen && (
                            <>
                                <div onClick={() => setPickerOpen(false)} className="fixed inset-0 z-[5]" />
                                <div className="absolute top-9 left-0 z-[6] w-full min-w-[400px] bg-[#18181C] border border-[#2E2E38] rounded-lg p-1 shadow-2xl max-h-80 overflow-y-auto nice-scroll"
                                    style={{ animation: "fadeIn 120ms ease-out" }}>
                                    {memories.length === 0 && (
                                        <div className="px-2.5 py-2 text-[12px] text-[#5C5A6A] text-center">No memories loaded. Set a scope first.</div>
                                    )}
                                    {memories.map(m => (
                                        <div
                                            key={m.id}
                                            onClick={() => { setPickedId(m.id); setPickerOpen(false); }}
                                            className="px-2.5 py-2 rounded flex items-start gap-2.5 cursor-pointer transition-all"
                                            style={{
                                                background: m.id === pickedId ? "rgba(124,110,248,0.10)" : "transparent",
                                                border: m.id === pickedId ? "1px solid rgba(124,110,248,0.40)" : "1px solid transparent",
                                            }}
                                            onMouseEnter={e => { if (m.id !== pickedId) (e.currentTarget as HTMLElement).style.background = "#111113"; }}
                                            onMouseLeave={e => { if (m.id !== pickedId) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                        >
                                            <span className="mono text-[10px] px-[5px] py-[2px] bg-[#0A0A0B] border border-[#232329] rounded-sm shrink-0 mt-[1px]"
                                                style={{ color: m.id === pickedId ? "#7C6EF8" : "#5C5A6A" }}>
                                                {m.id.slice(0, 8)}…
                                            </span>
                                            <div className="min-w-0">
                                                <div className="text-[12px] text-[#EDECF0] leading-snug mb-[3px]">
                                                    {m.memory.length > 80 ? m.memory.slice(0, 80) + "…" : m.memory}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {(m.categories ?? []).slice(0, 2).map(c => (
                                                        <span key={c} className="text-[10px] px-[6px] py-px rounded"
                                                            style={{ background: "rgba(124,110,248,0.10)", color: "#A8B3CF", border: "1px solid rgba(124,110,248,0.18)" }}>
                                                            {c}
                                                        </span>
                                                    ))}
                                                    <span className="mono text-[10px] text-[#5C5A6A]">{relTime(m.updated_at)}</span>
                                                </div>
                                            </div>
                                            {m.id === pickedId && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 ml-auto">
                                                    <path d="m5 12 5 5L20 7" />
                                                </svg>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* refresh */}
                {pickedId && (
                    <button
                        onClick={() => { setHistoryRefresh(n => n + 1); onRefreshEntities?.(); }}
                        disabled={loading}
                        title="Refresh timeline"
                        className="h-7 w-7 flex items-center justify-center rounded-md text-[#5C5A6A] hover:text-[#EDECF0] bg-transparent border border-[#232329] hover:border-[#2E2E38] transition-all cursor-pointer disabled:opacity-40 shrink-0"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                        </svg>
                    </button>
                )}

                {/* legend */}
                <div className="flex items-center gap-3 shrink-0">
                    {[
                        { c: "#1DD5A3", l: "created" },
                        { c: "#F5A623", l: "updated" },
                        { c: "#E5534B", l: "deleted" },
                    ].map(({ c, l }) => (
                        <span key={l} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                            <span className="mono text-[11px] text-[#9896A4]">{l}</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* timeline content */}
            <div className="flex-1 overflow-y-auto nice-scroll px-8 py-6">
                {!pickedId && (
                    <div className="m-auto p-8 max-w-sm text-center flex flex-col items-center gap-3">
                        <div className="text-[15px] text-[#EDECF0]">Select a memory.</div>
                        <div className="text-[13px] text-[#9896A4]">Choose a memory from the picker above to view its history.</div>
                    </div>
                )}

                {pickedId && loading && (
                    <div className="flex flex-col gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-20 bg-[#111113] border border-[#232329] rounded-[10px]"
                                style={{ animation: "skel 1.5s ease-in-out infinite", animationDelay: `${i * 100}ms` }} />
                        ))}
                    </div>
                )}

                {pickedId && !loading && error && (
                    <div className="p-4 bg-[#111113] border border-[rgba(229,83,75,0.3)] rounded-lg text-[13px] text-[#E5534B]">
                        {error}
                    </div>
                )}

                {pickedId && !loading && !error && history.length === 0 && (
                    <div className="m-auto p-8 max-w-sm text-center">
                        <div className="text-[15px] text-[#EDECF0] mb-2">No history found.</div>
                        <div className="text-[13px] text-[#9896A4]">This memory has no recorded events.</div>
                    </div>
                )}

                {pickedId && !loading && !error && groups.map((g, gi) => (
                    <div key={g.label}>
                        <div className="flex items-center gap-3 mb-5 ml-3" style={{ marginTop: gi === 0 ? 0 : 24 }}>
                            <span className="mono text-[10px] text-[#5C5A6A] tracking-[1.4px] shrink-0">
                                {g.label} · {g.events.length} EVENT{g.events.length !== 1 ? "S" : ""}
                            </span>
                            <span className="flex-1 h-px bg-[#232329]" />
                        </div>
                        <div className="relative pl-7">
                            <span className="absolute left-[7px] top-1 bottom-1 w-px bg-[#232329]" />
                            {g.events.map((e, i) => <TimelineEventCard key={e.id ?? i} e={e} />)}
                        </div>
                    </div>
                ))}

                {pickedId && !loading && !error && history.length > 0 && (
                    <div className="relative pl-10 mt-0">
                        <span className="absolute left-[35px] top-2 w-[7px] h-[7px] border border-[#2E2E38] rounded-full bg-[#0A0A0B]" />
                        <div className="text-[12px] text-[#5C5A6A] py-1.5">
                            <span className="mono">— end of trail · {history.length} event{history.length !== 1 ? "s" : ""} total</span>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default TimelineView;
