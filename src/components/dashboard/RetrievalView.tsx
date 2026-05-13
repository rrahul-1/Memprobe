"use client";
import { useState } from "react";
import { storage } from "@/lib/storage";
import { FilterItem } from "@/app/dashboard/DashboardClient";

export type SearchResult = {
    id: string;
    memory: string;
    score: number;
    user_id?: string;
    agent_id?: string;
    categories?: string[];
    created_at?: string;
    updated_at?: string;
    metadata?: any;
};

export type RetrievalContext = {
    query: string;
    rank: number;
    score: number;
};

type Props = {
    selectedUser: string | undefined;
    selectedAgent: string | undefined;
    selectedApp: string | undefined;
    selectedRun: string | undefined;
    filterOperator: "AND" | "OR";
    selectedResultId: string | null;
    onSelectResult: (result: SearchResult, context: RetrievalContext) => void;
    onRefreshEntities?: () => void;
};

const QUICK_QUERIES = [
    "What does this user prefer for coding?",
    "Where does the user live?",
    "What is the user working on?",
];

function scoreColor(s: number) {
    if (s >= 0.8) return "#1DD5A3";
    if (s >= 0.4) return "#F5A623";
    return "#E5534B";
}

function CategoryPill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-block text-[11px] px-1.75 py-px rounded-sm whitespace-nowrap"
            style={{ background: "rgba(124,110,248,0.10)", color: "#A8B3CF", border: "1px solid rgba(124,110,248,0.18)" }}>
            {children}
        </span>
    );
}

function ScoreBar({ value, width = 100 }: { value: number; width?: number }) {
    const pct = Math.max(0, Math.min(1, value));
    return (
        <div style={{ width, height: 6, background: "#0A0A0B", borderRadius: 999, overflow: "hidden", border: "1px solid #232329", flexShrink: 0 }}>
            <div style={{ height: "100%", width: `${pct * 100}%`, background: scoreColor(value), borderRadius: 999 }} />
        </div>
    );
}

function ResultCard({ r, rank, active, onClick }: { r: SearchResult; rank: number; active: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="relative p-3.5 pl-4.5 rounded-[10px] flex flex-col gap-2 cursor-pointer transition-all"
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
            <span className="absolute -left-px top-2.5 bottom-2.5 w-0.5 rounded-full"
                style={{ background: active ? "#7C6EF8" : "transparent" }} />
            <div className="flex items-center gap-3 flex-wrap">
                <span className="mono text-[12px] text-[#5C5A6A] w-6 shrink-0">#{rank}</span>
                <span className="flex items-center gap-1.5">
                    <span className="mono text-[10px] text-[#5C5A6A]">score</span>
                    <ScoreBar value={r.score} width={90} />
                    <span className="mono text-[12px] min-w-9" style={{ color: scoreColor(r.score) }}>
                        {r.score.toFixed(2)}
                    </span>
                </span>
            </div>
            <div className="text-[14px] text-[#EDECF0] leading-snug">{r.memory}</div>
            <div className="flex items-center gap-1.5 flex-wrap">
                {(r.categories ?? []).map(c => <CategoryPill key={c}>{c}</CategoryPill>)}
                <span className="mono text-[11px] text-[#5C5A6A] ml-auto">{r.id.slice(0, 8)}…</span>
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
            <div className="h-3 w-1/4 bg-[#18181C] rounded" />
        </div>
    );
}

const RetrievalView = ({ selectedUser, selectedAgent, selectedApp, selectedRun, filterOperator, selectedResultId, onSelectResult, onRefreshEntities }: Props) => {
    const [query, setQuery] = useState("");
    const [topK, setTopK] = useState(10);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [latency, setLatency] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showRequest, setShowRequest] = useState(false);

    async function run() {
        if (!query.trim()) return;
        const apiKey = storage.getApiKey();
        if (!apiKey) return;

        setRunning(true);
        setResults([]);
        setError(null);
        const start = Date.now();


        const filters: FilterItem[] = [];

        if (selectedUser) {
            filters.push({
                user_id: selectedUser
            })
        }
        if (selectedAgent) {
            filters.push({
                agent_id: selectedAgent
            })
        }
        if (selectedApp) {
            filters.push({
                app_id: selectedApp
            })
        }
        if (selectedRun) {
            filters.push({
                run_id: selectedRun
            })
        }
        const body = {
            "filters": {
                [filterOperator]: filters
            },
            query,
            top_k: topK
        }

        try {
            const res = await fetch("/api/memories/search", {
                method: "POST",
                headers: {
                    "mem0-apiKey": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const elapsed = Date.now() - start;
            setLatency(elapsed);

            if (!res.ok) {
                const { error: err } = await res.json();
                setError(err ?? "Search failed.");
                return;
            }

            const json = await res.json();
            setResults((json.data ?? []));
        } catch (e) {
            setError("Network error. Check your API key and scope.");
        } finally {
            setRunning(false);
        }
    }

    const scopeLabel = [
        selectedUser && `user: ${selectedUser}`,
        selectedAgent && `agent: ${selectedAgent}`,
        selectedApp && `app: ${selectedApp}`,
        selectedRun && `run: ${selectedRun}`,
    ].filter(Boolean).join(" / ") || "no scope set";

    // API request preview for display
    const apiRequestPreview = JSON.stringify({
        query: query || "<query>",
        output_format: "v1.1",
        ...(selectedUser && { user_id: selectedUser }),
        ...(selectedAgent && { agent_id: selectedAgent }),
        ...(selectedApp && { app_id: selectedApp }),
        ...(selectedRun && { run_id: selectedRun }),
    }, null, 2);

    return (
        <main className="flex-1 min-w-0 flex flex-col bg-[#0A0A0B]">
            {/* header */}
            <div className="h-14 shrink-0 px-5 flex items-center justify-between border-b border-[#232329]">
                <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span className="text-[14px] text-[#EDECF0]">Retrieval Tester</span>
                    <span className="text-[#5C5A6A] text-[12px]">·</span>
                    <span className="mono text-[12px] text-[#5C5A6A]">POST /v3/memories/search/</span>
                </div>
                <div className="flex items-center gap-2.5">
                    {latency !== null && results.length > 0 && (
                        <span className="mono text-[11px] text-[#5C5A6A]">{latency}ms · {results.length} results</span>
                    )}
                    {results.length > 0 && (
                        <button
                            onClick={() => { run(); onRefreshEntities?.(); }}
                            disabled={running || !query.trim()}
                            title="Refresh results"
                            className="h-7 w-7 flex items-center justify-center rounded-md text-[#5C5A6A] hover:text-[#EDECF0] bg-transparent border border-[#232329] hover:border-[#2E2E38] transition-all cursor-pointer disabled:opacity-40"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                            </svg>
                        </button>
                    )}
                    {/* <button
                        onClick={() => setShowRequest(!showRequest)}
                        className="h-[26px] px-2.5 flex items-center gap-1.5 text-[11px] rounded-md transition-all cursor-pointer"
                        style={{
                            background: showRequest ? "#18181C" : "transparent",
                            border: `1px solid ${showRequest ? "#2E2E38" : "#232329"}`,
                            color: "#9896A4",
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                        </svg>
                        {showRequest ? "hide" : "API"} request
                    </button> */}
                </div>
            </div>

            {/* controls */}
            <div className="px-5 py-3.5 border-b border-[#232329] flex flex-col gap-2.5">
                <div className="flex items-stretch gap-2">
                    <div className="flex-1 h-10 flex items-center gap-2 px-3 bg-[#111113] border border-[#2E2E38] rounded-lg text-[#5C5A6A]">
                        <span className="mono text-[12px] text-[#7C6EF8] shrink-0">q ›</span>
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && run()}
                            placeholder="Ask anything you'd ask the agent…"
                            className="flex-1 h-full bg-transparent border-none outline-none text-[14px] text-[#EDECF0] placeholder-[#5C5A6A]"
                        />
                    </div>
                    <button
                        onClick={run}
                        disabled={running || !query.trim()}
                        className="h-10 px-3 flex items-center gap-1.5 bg-[#7C6EF8] text-white text-[13px] font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#9182FA"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#7C6EF8"}
                    >
                        {running ? "Searching…" : (
                            <>
                                Search
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14" /><path d="m13 5 7 7-7 7" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>

                {/* quick suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="mono text-[10px] text-[#5C5A6A] shrink-0">try:</span>
                    {QUICK_QUERIES.map(q => (
                        <button
                            key={q}
                            onClick={() => setQuery(q)}
                            className="text-[11px] px-2 py-0.75 rounded-md transition-all cursor-pointer whitespace-nowrap"
                            style={{
                                background: query === q ? "rgba(124,110,248,0.10)" : "#111113",
                                border: `1px solid ${query === q ? "rgba(124,110,248,0.40)" : "#232329"}`,
                                color: query === q ? "#EDECF0" : "#5C5A6A",
                            }}
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {/* options */}
                <div className="flex items-center gap-4 text-[12px] text-[#9896A4]">
                    <span className="flex items-center gap-2">
                        <span className="text-[#5C5A6A]">top_k</span>
                        <span className="flex items-center overflow-hidden border border-[#232329] rounded-md h-6">
                            <button onClick={() => setTopK(k => Math.max(1, k - 1))}
                                className="w-5.5 h-full bg-transparent border-none text-[#9896A4] text-[13px] cursor-pointer flex items-center justify-center">−</button>
                            <span className="mono text-[12px] text-[#EDECF0] w-7 text-center h-full flex items-center justify-center border-x border-[#232329]">{topK}</span>
                            <button onClick={() => setTopK(k => Math.min(50, k + 1))}
                                className="w-5.5 h-full bg-transparent border-none text-[#9896A4] text-[13px] cursor-pointer flex items-center justify-center">+</button>
                        </span>
                    </span>
                    <span className="text-[#5C5A6A]">·</span>
                    <span className="text-[12px] text-[#5C5A6A]">
                        scope: <span className="mono text-[#9896A4]">{scopeLabel}</span>
                    </span>
                </div>

                {showRequest && (
                    <div className="bg-[#111113] border border-[#232329] rounded-lg overflow-hidden"
                        style={{ animation: "fadeIn 150ms ease-out" }}>
                        <div className="flex items-center border-b border-[#232329] px-3 py-1.5">
                            <span className="mono text-[11px] text-[#EDECF0]">Request</span>
                            <span className="ml-auto mono text-[10px] text-[#5C5A6A]">POST api.mem0.ai/v3/memories/search/</span>
                        </div>
                        <pre className="mono nice-scroll text-[11px] leading-relaxed text-[#A8B3CF] p-3 overflow-auto max-h-35">
                            {apiRequestPreview}
                        </pre>
                    </div>
                )}
            </div>

            {/* results */}
            <div className="flex-1 overflow-y-auto nice-scroll px-5 py-4">
                {running && (
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                )}

                {!running && error && (
                    <div className="p-4 bg-[#111113] border border-[rgba(229,83,75,0.3)] rounded-lg text-[13px] text-[#E5534B]">
                        {error}
                    </div>
                )}

                {!running && !error && results.length > 0 && (
                    <>
                        <div className="flex items-center gap-2 text-[13px] text-[#9896A4] mb-3">
                            <span className="mono text-[#EDECF0]">{results.length}</span>
                            <span>memories matched</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {results.map((r, i) => (
                                <ResultCard
                                    key={r.id}
                                    r={r}
                                    rank={i + 1}
                                    active={r.id === selectedResultId}
                                    onClick={() => onSelectResult(r, { query, rank: i + 1, score: r.score })}
                                />
                            ))}
                        </div>
                    </>
                )}

                {!running && !error && results.length === 0 && query && (
                    <div className="m-auto p-8 max-w-sm text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#111113] border border-[#232329] flex items-center justify-center text-[#5C5A6A]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div className="text-[15px] text-[#EDECF0]">No results.</div>
                        <div className="text-[13px] text-[#9896A4]">Try rephrasing or adjusting the scope.</div>
                    </div>
                )}

                {!running && !error && results.length === 0 && !query && (
                    <div className="m-auto p-8 max-w-sm text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#111113] border border-[#232329] flex items-center justify-center text-[#5C5A6A]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                        <div className="text-[15px] text-[#EDECF0]">Run a search.</div>
                        <div className="text-[13px] text-[#9896A4]">Enter a query above and press Search to test memory retrieval.</div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default RetrievalView;
