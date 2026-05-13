"use client";
import { useState, useEffect } from "react";
import { Memory } from "@/app/api/memories/route";
import { RetrievalContext } from "./RetrievalView";
import { storage } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import { getCategoryColor } from "@/lib/categories";

type View = "memories" | "retrieval" | "timeline";

type Props = {
    memory: Memory | null;
    view: View;
    retrievalContext: RetrievalContext | null;
    onClose: () => void;
    onOpenTimeline: () => void;
    onMemoryUpdated?: (id: string, newText: string) => void;
    onMemoryDeleted?: (id: string) => void;
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

function CategoryPill({ cat }: { cat: string }) {
    const c = getCategoryColor(cat);
    return (
        <span className="inline-block text-[11px] px-[7px] py-px rounded-[4px] whitespace-nowrap"
            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
            {cat}
        </span>
    );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
    const [done, setDone] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 900); }}
            className="inline-flex items-center gap-1 bg-transparent border-none p-[2px] cursor-pointer"
            style={{ color: done ? "#1DD5A3" : "#5C5A6A" }}
        >
            {done ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                </svg>
            ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
            )}
            {label && <span className="text-[11px]">{label}</span>}
        </button>
    );
}

function Block({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="p-4 border-b border-[#232329]">
            <div className="flex items-center justify-between mb-2.5">
                <span className="mono text-[10px] text-[#5C5A6A] tracking-[1.4px] font-medium">{label}</span>
                {action}
            </div>
            {children}
        </div>
    );
}

function MetaRow({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
    return (
        <div className="grid py-[7px] text-[12px] items-center min-h-[26px]"
            style={{ gridTemplateColumns: "80px 1fr", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
            <span className="mono text-[#5C5A6A]">{k}</span>
            <span className="flex items-center gap-2 text-[#9896A4] min-w-0">{v}</span>
        </div>
    );
}

function scoreColor(s: number) {
    if (s >= 0.8) return "#1DD5A3";
    if (s >= 0.4) return "#F5A623";
    return "#E5534B";
}

function ScoreDisplay({ value }: { value: number }) {
    const pct = Math.max(0, Math.min(1, value));
    return (
        <span className="flex items-center gap-2">
            <span style={{ width: 80, height: 6, background: "#0A0A0B", borderRadius: 999, overflow: "hidden", border: "1px solid #232329", display: "inline-block", flexShrink: 0 }}>
                <span style={{ display: "block", height: "100%", width: `${pct * 100}%`, background: scoreColor(value), borderRadius: 999 }} />
            </span>
            <span className="mono text-[12px]" style={{ color: scoreColor(value) }}>{value.toFixed(2)}</span>
        </span>
    );
}

function DetailEmpty({ view }: { view: View }) {
    const hints: Partial<Record<View, string>> = {
        memories: "Click a memory to inspect its metadata and raw payload.",
        retrieval: "Run a search, then click a result to see its retrieval context.",
    };
    return (
        <aside className="w-[360px] shrink-0 border-l border-[#232329] bg-[#111113] flex items-center justify-center p-8"
            style={{ animation: "slideRight 180ms ease-out" }}>
            <div className="text-center max-w-[240px]">
                <div className="mono text-[11px] text-[#5C5A6A] tracking-[1.4px] mb-3">NO SELECTION</div>
                <div className="text-[14px] text-[#9896A4] leading-relaxed">
                    {hints[view] ?? hints.memories}
                </div>
            </div>
        </aside>
    );
}

const DetailsPanel = ({ memory, view, retrievalContext, onClose, onOpenTimeline, onMemoryUpdated, onMemoryDeleted }: Props) => {
    const { toast } = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [text, setText] = useState(memory?.memory ?? "");
    const [showJson, setShowJson] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setText(memory?.memory ?? "");
        setEditing(false);
    }, [memory?.id]);

    async function handleSave() {
        if (!memory) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/memories/${memory.id}`, {
                method: "PUT",
                headers: { "mem0-apiKey": storage.getApiKey()!, "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error(await res.text());
            setEditing(false);
            toast("Memory updated.", "success");
            onMemoryUpdated?.(memory.id, text);
        } catch {
            toast("Failed to update memory.", "error");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!memory) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/memories/${memory.id}`, {
                method: "DELETE",
                headers: { "mem0-apiKey": storage.getApiKey()! },
            });
            if (!res.ok) throw new Error(await res.text());
            toast("Memory deleted.", "success");
            onMemoryDeleted?.(memory.id);
        } catch {
            toast("Failed to delete memory.", "error");
        } finally {
            setDeleting(false);
        }
    }

    if (!memory) return <DetailEmpty view={view} />;

    const isMemories = view === "memories";
    const isRetrieval = view === "retrieval";

    const jsonPayload = JSON.stringify(
        isRetrieval && retrievalContext
            ? { ...memory, _retrieval: { query: retrievalContext.query, rank: retrievalContext.rank, score: retrievalContext.score } }
            : memory,
        null, 2
    );

    function handleCopyJson() {
        navigator.clipboard?.writeText(jsonPayload).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    return (
        <aside className="w-[360px] shrink-0 border-l border-[#232329] bg-[#111113] flex flex-col min-w-0"
            style={{ animation: "slideRight 180ms ease-out" }}>
            {/* header */}
            <div className="h-[52px] shrink-0 px-4 flex items-center justify-between border-b border-[#232329]">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] text-[#9896A4]">Memory</span>
                    <span className="mono text-[11px] text-[#A8B3CF] px-1.5 py-[2px] bg-[#0A0A0B] border border-[#232329] rounded overflow-hidden text-ellipsis whitespace-nowrap">
                        {memory.id.slice(0, 12)}…
                    </span>
                </div>
                <div className="flex gap-1">
                    <button
                        title="Copy ID"
                        onClick={() => navigator.clipboard?.writeText(memory.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border border-[#232329] text-[#9896A4] transition-all cursor-pointer"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2E2E38"; (e.currentTarget as HTMLElement).style.color = "#EDECF0"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#232329"; (e.currentTarget as HTMLElement).style.color = "#9896A4"; }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
                        </svg>
                    </button>
                    <button
                        title="Close"
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border border-[#232329] text-[#9896A4] transition-all cursor-pointer"
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2E2E38"; (e.currentTarget as HTMLElement).style.color = "#EDECF0"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#232329"; (e.currentTarget as HTMLElement).style.color = "#9896A4"; }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto nice-scroll flex flex-col">
                {/* Memory text */}
                <div className="p-4 border-b border-[#232329]">
                    {editing && isMemories ? (
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            autoFocus
                            className="w-full min-h-[90px] p-2.5 bg-[#0A0A0B] border border-[#2E2E38] rounded-lg text-[#EDECF0] text-[14px] leading-snug outline-none resize-y font-[inherit]"
                        />
                    ) : (
                        <div className="text-[14px] text-[#EDECF0] leading-relaxed">"{text}"</div>
                    )}
                    <div className="flex gap-2 mt-3">
                        {isMemories && (editing ? (
                            <>
                                <button onClick={handleSave} disabled={saving}
                                    className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] font-medium bg-[#7C6EF8] text-white rounded-md transition-all cursor-pointer disabled:opacity-60">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                                    {saving ? "Saving…" : "Save"}
                                </button>
                                <button onClick={() => { setText(memory.memory); setEditing(false); }} disabled={saving}
                                    className="h-7 px-2.5 text-[12px] text-[#9896A4] bg-transparent border-none cursor-pointer">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => setEditing(true)}
                                    className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] text-[#EDECF0] bg-transparent border border-[#2E2E38] rounded-md transition-all cursor-pointer"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#18181C"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                    </svg>
                                    Edit
                                </button>
                                <button onClick={onOpenTimeline}
                                    className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] text-[#9896A4] bg-transparent border-none cursor-pointer"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EDECF0"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9896A4"}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="8" r="2" />
                                        <path d="M6 8v8M18 10v2a3 3 0 0 1-3 3H8" />
                                    </svg>
                                    Timeline
                                </button>
                            </>
                        ))}
                        {isRetrieval && (
                            <button onClick={onOpenTimeline}
                                className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] text-[#9896A4] bg-transparent border-none cursor-pointer"
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EDECF0"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9896A4"}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="8" r="2" />
                                    <path d="M6 8v8M18 10v2a3 3 0 0 1-3 3H8" />
                                </svg>
                                Timeline
                            </button>
                        )}
                    </div>
                </div>

                {/* RETRIEVAL CONTEXT — only in retrieval view */}
                {isRetrieval && retrievalContext && (
                    <Block label="RETRIEVAL CONTEXT">
                        <div className="p-2 bg-[#0A0A0B] border border-[#232329] rounded-md mb-2.5 text-[12px] text-[#9896A4] leading-snug">
                            <span className="mono text-[10px] text-[#5C5A6A] mr-1.5">query</span>
                            "{retrievalContext.query}"
                        </div>
                        <MetaRow k="rank" v={
                            <span className="mono text-[13px] text-[#EDECF0]">#{retrievalContext.rank}</span>
                        } />
                        <MetaRow k="score" v={<ScoreDisplay value={retrievalContext.score} />} last />
                    </Block>
                )}

                {/* METADATA */}
                <Block label="METADATA">
                    <MetaRow k="id" v={
                        <span className="flex items-center gap-1.5">
                            <span className="mono text-[11px] text-[#A8B3CF] overflow-hidden text-ellipsis whitespace-nowrap">{memory.id}</span>
                            <CopyBtn text={memory.id} />
                        </span>
                    } />
                    <MetaRow k="category" v={
                        <span className="flex items-center gap-1 flex-wrap">
                            {(memory.categories ?? []).length > 0
                                ? (memory.categories ?? []).map(c => <CategoryPill key={c} cat={c} />)
                                : <span className="text-[#5C5A6A]">—</span>}
                        </span>
                    } />
                    {[
                        ["user_id", memory.user_id],
                        ["agent_id", memory.agent_id],
                        ["app_id", memory.app_id],
                        ["run_id", memory.run_id],
                    ].map(([k, v]) => (
                        <MetaRow key={k} k={k!} v={
                            v
                                ? <span className="mono text-[#EDECF0]">{v}</span>
                                : <span className="text-[#5C5A6A]">—</span>
                        } />
                    ))}
                    <MetaRow k="created" v={
                        <span className="flex flex-col">
                            <span className="text-[#EDECF0] text-[12px]">{relTime(memory.created_at)}</span>
                            <span className="mono text-[#5C5A6A] text-[10.5px]">{fullTime(memory.created_at)}</span>
                        </span>
                    } />
                    <MetaRow k="updated" v={
                        <span className="flex flex-col">
                            <span className="text-[#EDECF0] text-[12px]">{relTime(memory.updated_at)}</span>
                            <span className="mono text-[#5C5A6A] text-[10.5px]">{fullTime(memory.updated_at)}</span>
                        </span>
                    } last />
                </Block>

                {/* RAW JSON */}
                <Block label="RAW" action={
                    <button
                        onClick={() => setShowJson(v => !v)}
                        className="text-[11px] text-[#9896A4] bg-transparent border-none px-1 cursor-pointer"
                    >
                        {showJson ? "hide" : "show"}
                    </button>
                }>
                    {showJson && (
                        <pre className="mono nice-scroll text-[11px] leading-relaxed text-[#A8B3CF] p-3 bg-[#0A0A0B] border border-[#232329] rounded-lg overflow-auto max-h-[220px] m-0">
                            {jsonPayload}
                        </pre>
                    )}
                </Block>
            </div>

            {/* footer */}
            <div className="p-3 border-t border-[#232329] flex gap-2 justify-between">
                <button
                    onClick={handleCopyJson}
                    className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] text-[#9896A4] bg-transparent border-none cursor-pointer transition-colors"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EDECF0"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9896A4"}
                >
                    {copied ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1DD5A3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m5 12 5 5L20 7" />
                            </svg>
                            <span style={{ color: "#1DD5A3" }}>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
                            </svg>
                            Copy as JSON
                        </>
                    )}
                </button>
                {isMemories && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="h-7 px-2.5 flex items-center gap-1.5 text-[12px] text-[#E5534B] bg-transparent border border-[rgba(229,83,75,0.30)] rounded-md transition-all cursor-pointer disabled:opacity-60"
                        onMouseEnter={e => { if (!deleting) (e.currentTarget as HTMLElement).style.background = "rgba(229,83,75,0.12)"; }}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {deleting ? "Deleting…" : "Delete"}
                    </button>
                )}
            </div>
        </aside>
    );
};

export default DetailsPanel;
