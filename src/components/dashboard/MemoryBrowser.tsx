"use client";
import { useState, useRef, useEffect } from "react";
import { Memory } from "@/app/api/memories/route";

type Props = {
    memories: Memory[];
    loading: boolean;
    query: string;
    setQuery: (q: string) => void;
    sort: "recent" | "oldest";
    setSort: (s: "recent" | "oldest") => void;
    categoryFilter: string;
    setCategoryFilter: (c: string) => void;
    selectedMemoryId: string | null;
    onSelectMemory: (m: Memory) => void;
    onAddMemory: () => void;
    onRefresh: () => void;
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
};

function relTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.round(diff / 86400)}d ago`;
    return `${Math.round(diff / (86400 * 30))}mo ago`;
}

const CATEGORIES = ["all", "preferences", "work", "personal", "code", "location", "tools", "schedule", "health", "reading"];

function CategoryPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block text-[11px] px-[7px] py-px rounded-[4px] whitespace-nowrap"
            style={{
                background: "rgba(124,110,248,0.10)",
                color: "#A8B3CF",
                border: "1px solid rgba(124,110,248,0.18)",
            }}>
            {children}
        </span>
    );
}

function MemoryCard({ m, active, onClick }: { m: Memory; active: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="relative p-3.5 rounded-[10px] flex flex-col gap-2 cursor-pointer transition-all"
            style={{
                background: active ? "#18181C" : "#111113",
                border: `1px solid ${active ? "rgba(124,110,248,0.40)" : "#232329"}`,
            }}
            onMouseEnter={e => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "#18181C";
                    (e.currentTarget as HTMLElement).style.borderColor = "#2E2E38";
                }
            }}
            onMouseLeave={e => {
                if (!active) {
                    (e.currentTarget as HTMLElement).style.background = "#111113";
                    (e.currentTarget as HTMLElement).style.borderColor = "#232329";
                }
            }}
        >
            {active && (
                <span className="absolute left-[-1px] top-[10px] bottom-[10px] w-0.5 bg-[#7C6EF8] rounded-full" />
            )}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {(m.categories ?? []).slice(0, 3).map(c => (
                        <CategoryPill key={c}>{c}</CategoryPill>
                    ))}
                </div>
                <span className="text-[11px] text-[#5C5A6A] shrink-0 mono">{relTime(m.updated_at)}</span>
            </div>
            <div className="text-[14px] text-[#EDECF0] leading-snug">{m.memory}</div>
            <div className="flex items-center justify-end gap-2">
                <span className="mono text-[11px] text-[#5C5A6A]">{m.user_id}</span>
                <span className="text-[#2E2E38]">·</span>
                <span className="mono text-[11px] text-[#5C5A6A]">{m.id.slice(0, 8)}…</span>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="p-3.5 rounded-[10px] bg-[#111113] border border-[#232329] flex flex-col gap-2"
            style={{ animation: "skel 1.5s ease-in-out infinite" }}>
            <div className="h-3 w-1/3 bg-[#18181C] rounded" />
            <div className="h-4 w-4/5 bg-[#18181C] rounded" />
            <div className="h-3 w-1/4 bg-[#18181C] rounded self-end" />
        </div>
    );
}

function SortDropdown({ value, onChange }: { value: string; onChange: (v: "recent" | "oldest") => void }) {
    const [open, setOpen] = useState(false);
    const options: { value: "recent" | "oldest"; label: string }[] = [
        { value: "recent", label: "most recent" },
        { value: "oldest", label: "oldest" },
    ];
    const label = options.find(o => o.value === value)?.label ?? value;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-[12px] text-[#9896A4] transition-all cursor-pointer"
                style={{
                    background: open ? "#18181C" : "transparent",
                    border: `1px solid ${open ? "#2E2E38" : "#232329"}`,
                }}
            >
                <span className="text-[#5C5A6A]">sort:</span>
                <span>{label}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} className="fixed inset-0 z-[5]" />
                    <div className="absolute top-9 left-0 z-[6] min-w-[160px] rounded-lg border border-[#2E2E38] bg-[#18181C] p-1 shadow-2xl"
                        style={{ animation: "fadeIn 120ms ease-out" }}>
                        {options.map(o => (
                            <div
                                key={o.value}
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                className="h-7 px-2 rounded flex items-center justify-between text-[12px] cursor-pointer"
                                style={{ color: o.value === value ? "#EDECF0" : "#9896A4" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#111113"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                            >
                                <span>{o.label}</span>
                                {o.value === value && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m5 12 5 5L20 7" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function CategoryDropdown({ value, onChange, categories }: { value: string; onChange: (v: string) => void; categories: string[] }) {
    const [open, setOpen] = useState(false);
    const allOptions = ["all", ...categories.filter(c => c !== "all")];

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-[12px] text-[#9896A4] transition-all cursor-pointer"
                style={{
                    background: open ? "#18181C" : "transparent",
                    border: `1px solid ${open ? "#2E2E38" : "#232329"}`,
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5h18l-7 9v5l-4 2v-7L3 5z" />
                </svg>
                <span className="text-[#5C5A6A]">category:</span>
                <span>{value}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {open && (
                <>
                    <div onClick={() => setOpen(false)} className="fixed inset-0 z-[5]" />
                    <div className="absolute top-9 left-0 z-[6] min-w-[180px] rounded-lg border border-[#2E2E38] bg-[#18181C] p-1 shadow-2xl"
                        style={{ animation: "fadeIn 120ms ease-out" }}>
                        {allOptions.map(cat => (
                            <div
                                key={cat}
                                onClick={() => { onChange(cat); setOpen(false); }}
                                className="h-7 px-2 rounded flex items-center justify-between text-[12px] cursor-pointer"
                                style={{ color: cat === value ? "#EDECF0" : "#9896A4" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#111113"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                            >
                                <span>{cat}</span>
                                {cat === value && (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m5 12 5 5L20 7" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

const MemoryBrowser = ({ memories, loading, query, setQuery, sort, setSort, categoryFilter, setCategoryFilter, selectedMemoryId, onSelectMemory, onAddMemory, onRefresh, hasMore, loadingMore, onLoadMore }: Props) => {
    const sentinelRef = useRef<HTMLDivElement>(null);

    // Infinite scroll: trigger onLoadMore when sentinel enters viewport
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasMore) return;
        const observer = new IntersectionObserver(
            entries => { if (entries[0].isIntersecting && !loadingMore) onLoadMore(); },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, onLoadMore]);
    // Collect unique categories from memories
    const allCategories = Array.from(new Set(memories.flatMap(m => m.categories ?? [])));

    // Filter and sort
    let filtered = memories;
    if (categoryFilter !== "all") {
        filtered = filtered.filter(m => (m.categories ?? []).includes(categoryFilter));
    }
    if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(m =>
            m.memory.toLowerCase().includes(q) ||
            m.id.toLowerCase().includes(q) ||
            (m.categories ?? []).some(c => c.toLowerCase().includes(q))
        );
    }
    filtered = [...filtered];
    if (sort === "recent") {
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else {
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return (
        <main className="flex-1 min-w-0 flex flex-col bg-[#0A0A0B]">
            {/* sub-header */}
            <div className="h-14 shrink-0 px-5 flex items-center gap-2.5 border-b border-[#232329]">
                <div className="flex-1 h-8 flex items-center gap-2 px-2.5 bg-[#111113] border border-[#232329] rounded-md text-[#5C5A6A] text-[13px] max-w-[480px] transition-all"
                    onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "#2E2E38"}
                    onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = "#232329"}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                    </svg>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search memories, IDs, categories…"
                        className="flex-1 h-full bg-transparent border-none outline-none text-[13px] text-[#EDECF0] placeholder-[#5C5A6A]"
                    />
                    <span className="mono text-[10px] text-[#5C5A6A] px-[5px] border border-[#232329] rounded">⌘K</span>
                </div>

                <CategoryDropdown value={categoryFilter} onChange={setCategoryFilter} categories={allCategories} />
                <SortDropdown value={sort} onChange={setSort} />

                <span className="ml-auto text-[12px] text-[#5C5A6A] whitespace-nowrap">
                    <span className="mono text-[#EDECF0]">{filtered.length}</span> of {memories.length}
                </span>

                <button
                    onClick={onRefresh}
                    title="Refresh memories"
                    className="h-8 w-8 flex items-center justify-center rounded-md text-[#5C5A6A] hover:text-[#EDECF0] bg-transparent border border-[#232329] hover:border-[#2E2E38] transition-all cursor-pointer shrink-0"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                    </svg>
                </button>

                <button
                    onClick={onAddMemory}
                    className="h-8 px-3 flex items-center gap-1.5 text-[12px] font-medium bg-[#7C6EF8] text-white rounded-md transition-all cursor-pointer shrink-0"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#9182FA"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#7C6EF8"}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Memory
                </button>
            </div>

            {/* list */}
            <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4 flex flex-col gap-2">
                {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

                {!loading && filtered.length === 0 && (
                    <div className="m-auto p-8 max-w-sm text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#111113] border border-[#232329] flex items-center justify-center text-[#5C5A6A]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                            </svg>
                        </div>
                        <div className="text-[15px] text-[#EDECF0]">No memories found.</div>
                        <div className="text-[13px] text-[#9896A4]">
                            {query
                                ? <>Nothing matched <span className="mono text-[#EDECF0]">"{query}"</span>. Try a broader query or change the scope.</>
                                : "This scope has no memories yet."}
                        </div>
                    </div>
                )}

                {!loading && filtered.map(m => (
                    <MemoryCard
                        key={m.id}
                        m={m}
                        active={m.id === selectedMemoryId}
                        onClick={() => onSelectMemory(m)}
                    />
                ))}

                {/* infinite scroll sentinel */}
                {!loading && hasMore && (
                    <div ref={sentinelRef} className="py-3 flex items-center justify-center gap-2">
                        {loadingMore ? (
                            <span className="mono text-[11px] text-[#5C5A6A]">Loading more…</span>
                        ) : (
                            <span className="mono text-[11px] text-[#2E2E38]">· · ·</span>
                        )}
                    </div>
                )}

                {!loading && !hasMore && filtered.length > 0 && (
                    <div className="py-4 text-center flex items-center gap-2 justify-center">
                        <span className="flex-1 h-px bg-[#232329]" />
                        <span className="mono text-[11px] text-[#5C5A6A]">end of results · {filtered.length} memories</span>
                        <span className="flex-1 h-px bg-[#232329]" />
                    </div>
                )}
            </div>
        </main>
    );
};

export default MemoryBrowser;
