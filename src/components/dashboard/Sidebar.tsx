"use client";
import { View } from '@/app/dashboard/DashboardClient';
import ScopeSelection from './leftPanel/ScopeSelection';
import { Memory } from '@/app/api/memories/route';

type Props = {
    users: string[];
    agents: string[];
    apps: string[];
    runs: string[];
    selectedUser: string | undefined;
    selectedAgent: string | undefined;
    selectedApp: string | undefined;
    selectedRun: string | undefined;
    filterOperator: "AND" | "OR";
    entityHasMore: boolean;
    entityLoading: boolean;
    view: View;
    memories: Memory[];
    categoryFilter: string;
    setselectedUser: (user: string | undefined) => void;
    setSelectedAgent: (agent: string | undefined) => void;
    setSelectedApp: (app: string | undefined) => void;
    setSelectedRun: (run: string | undefined) => void;
    setFilterOperator: (op: "AND" | "OR") => void;
    onLoadMoreEntities: () => void;
    setSelectedView: (view: View) => void;
    setCategoryFilter: (cat: string) => void;
};

function getNumberOfSelectedFilters(
    selectedUser: string | undefined,
    selectedAgent: string | undefined,
    selectedApp: string | undefined,
    selectedRun: string | undefined
): number {
    return [selectedUser, selectedAgent, selectedApp, selectedRun].filter(Boolean).length;
}

function relTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 86400 * 30) return `${Math.round(diff / 86400)}d ago`;
    return `${Math.round(diff / (86400 * 30))}mo ago`;
}

const NavBtn = ({
    active,
    onClick,
    icon,
    label,
    badge,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        className={`group relative flex items-center gap-2.5 h-8 w-full px-2.5 rounded-md transition-colors cursor-pointer
      ${active ? 'text-[#EDECF0]' : 'text-[#9896A4] hover:text-[#EDECF0]'}`}
    >
        {active && (
            <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-[#7C6EF8] rounded-full" />
        )}
        <span
            className={`shrink-0 transition-colors ${active
                ? 'stroke-[#7C6EF8] text-[#7C6EF8]'
                : 'stroke-[#9896A4] text-[#9896A4] group-hover:stroke-[#EDECF0] group-hover:text-[#EDECF0]'
                }`}
        >
            {icon}
        </span>
        <span className="text-[13px]">{label}</span>
        {badge && <span className="ml-auto">{badge}</span>}
    </button>
);

const SideBar = ({
    users, agents, apps, runs,
    selectedUser, selectedAgent, selectedApp, selectedRun,
    filterOperator, entityHasMore, entityLoading,
    setselectedUser, setSelectedAgent, setSelectedApp, setSelectedRun,
    setFilterOperator, onLoadMoreEntities,
    view, setSelectedView,
    memories, categoryFilter, setCategoryFilter,
}: Props) => {
    const filterCount = getNumberOfSelectedFilters(selectedUser, selectedAgent, selectedApp, selectedRun);

    // Derive categories from memories
    const catMap: Record<string, number> = {};
    memories.forEach(m => {
        (m.categories ?? []).forEach(c => {
            catMap[c] = (catMap[c] || 0) + 1;
        });
    });
    const categoryList = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const maxCatCount = categoryList[0]?.[1] || 1;

    return (
        <div className="h-full w-58 border-r border-r-[#232329] p-4 flex flex-col gap-5 overflow-y-auto nice-scroll bg-[#111113] shrink-0">
            {/* SCOPE */}
            <div className="flex flex-col gap-2 text-[#9e9bbb]">
                <div className="flex justify-between text-[10px]">
                    <div className="tracking-[1.4px] font-medium text-[#5C5A6A]">SCOPE</div>
                    <span className="flex gap-1 items-center">
                        <span className="bg-[#7C6EF8] rounded-full w-1.5 h-1.5" />
                        <span className="text-[#9896A4]">{filterCount}</span>
                    </span>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                    <ScopeSelection type="user" name={selectedUser} onChange={setselectedUser} dropdownOptions={users} hasMore={entityHasMore} loadingMore={entityLoading} onLoadMore={onLoadMoreEntities} />
                    <ScopeSelection type="agent" name={selectedAgent} onChange={setSelectedAgent} dropdownOptions={agents} hasMore={entityHasMore} loadingMore={entityLoading} onLoadMore={onLoadMoreEntities} />
                    <ScopeSelection type="app" name={selectedApp} onChange={setSelectedApp} dropdownOptions={apps} hasMore={entityHasMore} loadingMore={entityLoading} onLoadMore={onLoadMoreEntities} />
                    <ScopeSelection type="run" name={selectedRun} onChange={setSelectedRun} dropdownOptions={runs} hasMore={entityHasMore} loadingMore={entityLoading} onLoadMore={onLoadMoreEntities} />
                </div>

                {/* AND / OR operator toggle */}
                <div className="flex items-center justify-between mt-0.5">
                    <span className="mono text-[10px] text-[#5C5A6A]">match</span>
                    <div className="flex items-center overflow-hidden border border-[#232329] rounded-md h-5 text-[10px] mono">
                        {(["AND", "OR"] as const).map(op => (
                            <button
                                key={op}
                                onClick={() => setFilterOperator(op)}
                                className="px-2 h-full cursor-pointer transition-colors"
                                style={{
                                    background: filterOperator === op ? "#18181C" : "transparent",
                                    color: filterOperator === op ? "#EDECF0" : "#5C5A6A",
                                    borderRight: op === "AND" ? "1px solid #232329" : "none",
                                }}
                            >
                                {op === "AND" ? "all" : "any"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* VIEWS */}
            <div className="flex flex-col gap-0.5">
                <div className="text-[10px] tracking-[1.4px] font-medium text-[#5C5A6A] mb-1">VIEWS</div>

                <NavBtn
                    active={view === "memories"}
                    onClick={() => setSelectedView("memories")}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M3 12h18M3 18h12" />
                        </svg>
                    }
                    label="All Memories"
                    badge={
                        <span className="text-[11px] py-px px-1.5 bg-[#0A0A0B] border border-[#303030] rounded-sm mono">
                            {memories.length}
                        </span>
                    }
                />

                <NavBtn
                    active={view === "retrieval"}
                    onClick={() => setSelectedView("retrieval")}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    }
                    label="Retrieval Tester"
                />

                <NavBtn
                    active={view === "timeline"}
                    onClick={() => setSelectedView("timeline")}
                    icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="2" />
                            <circle cx="6" cy="18" r="2" />
                            <circle cx="18" cy="8" r="2" />
                            <path d="M6 8v8M18 10v2a3 3 0 0 1-3 3H8" />
                        </svg>
                    }
                    label="Timeline"
                />
            </div>

            {/* STATS */}
            {memories.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="text-[10px] tracking-[1.4px] font-medium text-[#5C5A6A]">STATS</div>
                    <div className="flex flex-col">
                        <StatRow label="Total" value={String(memories.length)} />
                        <StatRow label="Categories" value={String(categoryList.length)} />
                    </div>
                </div>
            )}

            {/* CATEGORIES */}
            {categoryList.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] tracking-[1.4px] font-medium text-[#5C5A6A]">CATEGORIES</div>
                        {categoryFilter !== "all" && (
                            <button
                                onClick={() => setCategoryFilter("all")}
                                className="text-[10px] text-[#5C5A6A] hover:text-[#9896A4] underline cursor-pointer bg-transparent border-none"
                            >
                                clear
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        {categoryList.map(([name, count]) => {
                            const active = categoryFilter === name && view === "memories";
                            const barW = Math.round((count / maxCatCount) * 100);
                            return (
                                <button
                                    key={name}
                                    onClick={() => { setCategoryFilter(name); setSelectedView("memories"); }}
                                    style={{
                                        background: active ? 'rgba(124,110,248,0.10)' : 'transparent',
                                        border: active ? '1px solid rgba(124,110,248,0.40)' : '1px solid transparent',
                                    }}
                                    className="flex items-center justify-between text-[12px] px-1.5 py-1 rounded-md mx-[-6px] cursor-pointer transition-all"
                                >
                                    <span className="flex items-center gap-2 flex-1 min-w-0">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ background: active ? '#7C6EF8' : '#5C5A6A' }}
                                        />
                                        <span style={{ color: active ? '#EDECF0' : '#9896A4' }}>{name}</span>
                                        <span className="flex-1 h-0.5 rounded-full overflow-hidden bg-[#232329] max-w-8">
                                            <span
                                                className="block h-full rounded-full"
                                                style={{
                                                    width: `${barW}%`,
                                                    background: active ? '#7C6EF8' : '#2E2E38',
                                                }}
                                            />
                                        </span>
                                    </span>
                                    <span
                                        className="mono text-[11px] shrink-0"
                                        style={{ color: active ? '#7C6EF8' : '#5C5A6A' }}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center text-[12px] py-[3px]">
            <span className="text-[#5C5A6A]">{label}</span>
            <span className="mono text-[#EDECF0]">{value}</span>
        </div>
    );
}

export default SideBar;
