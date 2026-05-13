"use client";
import { useState, useRef, useEffect } from "react";

type ScopeArguments = {
    name?: string;
    dropdownOptions: string[];
    onChange: (name: string | undefined) => void;
    type: "user" | "agent" | "app" | "run";
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
};

const TYPE_LABEL: Record<ScopeArguments["type"], string> = {
    user: "user_id",
    agent: "agent_id",
    app: "app_id",
    run: "run_id",
};

const ScopeSelection = ({ type, name, dropdownOptions, onChange, hasMore, loadingMore, onLoadMore }: ScopeArguments) => {
    const [openDropdown, setOpenDropdown] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (openDropdown) {
            setTimeout(() => searchRef.current?.focus(), 30);
        } else {
            setSearch("");
        }
    }, [openDropdown]);

    // Infinite scroll: load more when user scrolls near the bottom of the dropdown
    function handleListScroll(e: React.UIEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        if (hasMore && !loadingMore && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
            onLoadMore?.();
        }
    }

    const label = TYPE_LABEL[type];
    const displayValue = name ?? "all";
    const filtered = search.trim()
        ? dropdownOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()))
        : dropdownOptions;

    return (
        <div className='relative font-["Geist_Mono",ui-monospace,"JetBrains_Mono","SFMono-Regular",monospace]'
            ref={dropdownRef}>
            <button
                className="w-full flex items-center gap-2 h-7 px-2 rounded-md text-[#EDECF0] text-[12px] bg-[#0A0A0B] border border-[#2E2E38] cursor-pointer min-w-0"
                onClick={() => setOpenDropdown(!openDropdown)}
            >
                <span className="text-[#5C5A6A] shrink-0">{label}</span>
                <span
                    className="flex-1 min-w-0 text-left overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ color: name ? "#EDECF0" : "#5C5A6A" }}
                >
                    {displayValue}
                </span>
                <svg className="shrink-0 text-[#5C5A6A]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {openDropdown && (
                <div className="absolute left-0 top-full z-50 w-full mt-0.5 min-w-[180px]">
                    <div className="rounded-md border border-[#232329] bg-[#111113] shadow-2xl flex flex-col">
                        {/* search */}
                        <div className="px-2 pt-2 pb-1 border-b border-[#232329]">
                            <div className="flex items-center gap-1.5 h-6 px-2 bg-[#0A0A0B] border border-[#232329] rounded">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5C5A6A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
                                </svg>
                                <input
                                    ref={searchRef}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="filter…"
                                    className="flex-1 bg-transparent border-none outline-none text-[11px] text-[#EDECF0] placeholder-[#5C5A6A]"
                                />
                            </div>
                        </div>

                        {/* options list */}
                        <div
                            ref={listRef}
                            className="overflow-y-auto nice-scroll p-1"
                            style={{ maxHeight: 200 }}
                            onScroll={handleListScroll}
                        >
                            {/* "all" option */}
                            {!search.trim() && (
                                <button
                                    className="w-full flex items-center gap-2 h-7 px-2 rounded text-[12px] cursor-pointer transition-colors"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#18181C"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                                    onClick={() => { onChange(undefined); setOpenDropdown(false); }}
                                >
                                    <span className="text-[#5C5A6A] shrink-0">{label}</span>
                                    <span className="flex-1 min-w-0 text-left overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: !name ? "#7C6EF8" : "#5C5A6A" }}>
                                        all
                                    </span>
                                    {!name && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                            <path d="m5 12 5 5L20 7" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {filtered.length === 0 && search.trim() && (
                                <div className="px-2 py-1.5 text-[11px] text-[#5C5A6A] text-center">No matches</div>
                            )}

                            {filtered.map(option => (
                                <button
                                    key={option}
                                    className="w-full flex items-center gap-2 h-7 px-2 rounded text-[12px] cursor-pointer transition-colors"
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#18181C"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                                    onClick={() => { onChange(option); setOpenDropdown(false); }}
                                >
                                    <span className="text-[#5C5A6A] shrink-0">{label}</span>
                                    <span
                                        className="flex-1 min-w-0 text-left overflow-hidden text-ellipsis whitespace-nowrap"
                                        style={{ color: option === name ? "#EDECF0" : "#9896A4" }}
                                    >
                                        {option}
                                    </span>
                                    {option === name && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C6EF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                            <path d="m5 12 5 5L20 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}

                            {/* load-more spinner */}
                            {hasMore && (
                                <div className="flex items-center justify-center h-7 gap-1.5">
                                    {loadingMore ? (
                                        <span className="text-[11px] text-[#5C5A6A]">Loading…</span>
                                    ) : (
                                        <button
                                            onClick={onLoadMore}
                                            className="text-[11px] text-[#7C6EF8] hover:text-[#9182FA] bg-transparent border-none cursor-pointer"
                                        >
                                            Load more
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScopeSelection;
