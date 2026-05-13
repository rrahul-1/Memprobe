"use client";
import { useState } from "react";
import { storage } from "@/lib/storage";

type Message = { role: "user" | "assistant"; content: string };
type MetaEntry = { key: string; value: string };

type Props = {
    selectedUser: string | undefined;
    selectedAgent: string | undefined;
    selectedApp: string | undefined;
    selectedRun: string | undefined;
    onClose: () => void;
    onAdded: () => void;
};

const AddMemoryPanel = ({
    selectedUser,
    selectedAgent,
    selectedApp,
    selectedRun,
    onClose,
    onAdded,
}: Props) => {
    const [messages, setMessages] = useState<Message[]>([{ role: "user", content: "" }]);
    const [userId, setUserId] = useState(selectedUser ?? "");
    const [agentId, setAgentId] = useState(selectedAgent ?? "");
    const [appId, setAppId] = useState(selectedApp ?? "");
    const [runId, setRunId] = useState(selectedRun ?? "");
    const [infer, setInfer] = useState(true);
    const [metaEntries, setMetaEntries] = useState<MetaEntry[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function addMessage() {
        setMessages(prev => [...prev, { role: "user", content: "" }]);
    }

    function removeMessage(i: number) {
        setMessages(prev => prev.filter((_, idx) => idx !== i));
    }

    function updateMessage(i: number, field: keyof Message, value: string) {
        setMessages(prev => prev.map((m, idx) =>
            idx === i ? { ...m, [field]: value } : m
        ));
    }

    function addMetaEntry() {
        setMetaEntries(prev => [...prev, { key: "", value: "" }]);
    }

    function removeMetaEntry(i: number) {
        setMetaEntries(prev => prev.filter((_, idx) => idx !== i));
    }

    function updateMetaEntry(i: number, field: keyof MetaEntry, value: string) {
        setMetaEntries(prev => prev.map((e, idx) =>
            idx === i ? { ...e, [field]: value } : e
        ));
    }

    const hasContent = messages.some(m => m.content.trim().length > 0);

    async function handleSubmit() {
        if (!hasContent) return;
        const apiKey = storage.getApiKey();
        if (!apiKey) return;

        const body: Record<string, unknown> = {
            messages: messages.filter(m => m.content.trim()),
            infer,
        };

        if (userId.trim()) body.user_id = userId.trim();
        if (agentId.trim()) body.agent_id = agentId.trim();
        if (appId.trim()) body.app_id = appId.trim();
        if (runId.trim()) body.run_id = runId.trim();

        const validMeta = metaEntries.filter(e => e.key.trim() && e.value.trim());
        if (validMeta.length > 0) {
            body.metadata = Object.fromEntries(validMeta.map(e => [e.key.trim(), e.value.trim()]));
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/memories/add", {
                method: "POST",
                headers: {
                    "mem0-apiKey": apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const json = await res.json();
                setError(json.error ?? "Failed to add memory.");
                return;
            }

            onAdded();
        } catch {
            setError("Network error. Check your connection.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <aside
            className="w-[360px] shrink-0 border-l border-[#232329] bg-[#111113] flex flex-col min-w-0"
            style={{ animation: "slideRight 180ms ease-out" }}
        >
            {/* header */}
            <div className="h-[52px] shrink-0 px-4 flex items-center justify-between border-b border-[#232329]">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#EDECF0]">Add Memory</span>
                    <span className="mono text-[11px] text-[#5C5A6A]">POST /v3/memories/add/</span>
                </div>
                <button
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

            <div className="flex-1 overflow-y-auto nice-scroll flex flex-col">

                {/* MESSAGES */}
                <Section label="MESSAGES" required>
                    <div className="flex flex-col gap-2">
                        {messages.map((msg, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    {/* role toggle */}
                                    <div className="flex items-center overflow-hidden border border-[#232329] rounded-md h-6 text-[11px]">
                                        {(["user", "assistant"] as const).map(r => (
                                            <button
                                                key={r}
                                                onClick={() => updateMessage(i, "role", r)}
                                                className="px-2 h-full mono transition-colors cursor-pointer"
                                                style={{
                                                    background: msg.role === r ? "#18181C" : "transparent",
                                                    color: msg.role === r ? "#EDECF0" : "#5C5A6A",
                                                    borderRight: r === "user" ? "1px solid #232329" : "none",
                                                }}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                    {messages.length > 1 && (
                                        <button
                                            onClick={() => removeMessage(i)}
                                            className="ml-auto text-[#5C5A6A] hover:text-[#E5534B] bg-transparent border-none cursor-pointer transition-colors"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 6l12 12M18 6 6 18" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={msg.content}
                                    onChange={e => updateMessage(i, "content", e.target.value)}
                                    placeholder={msg.role === "user" ? "User message…" : "Assistant response…"}
                                    rows={3}
                                    className="w-full p-2.5 bg-[#0A0A0B] border border-[#232329] rounded-lg text-[#EDECF0] text-[13px] leading-snug outline-none resize-y font-[inherit] placeholder-[#5C5A6A] transition-colors"
                                    onFocus={e => (e.target as HTMLElement).style.borderColor = "#2E2E38"}
                                    onBlur={e => (e.target as HTMLElement).style.borderColor = "#232329"}
                                />
                            </div>
                        ))}

                        <button
                            onClick={addMessage}
                            className="flex items-center gap-1.5 text-[12px] text-[#9896A4] hover:text-[#EDECF0] bg-transparent border border-[#232329] hover:border-[#2E2E38] rounded-md h-7 px-2.5 transition-all cursor-pointer w-full justify-center"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add turn
                        </button>
                    </div>
                </Section>

                {/* SCOPE */}
                <Section label="SCOPE">
                    <div className="flex flex-col gap-1.5">
                        <ScopeField label="user_id" value={userId} onChange={setUserId} placeholder="e.g. alice" />
                        <ScopeField label="agent_id" value={agentId} onChange={setAgentId} placeholder="e.g. copilot" />
                        <ScopeField label="app_id" value={appId} onChange={setAppId} placeholder="optional" />
                        <ScopeField label="run_id" value={runId} onChange={setRunId} placeholder="optional" />
                    </div>
                </Section>

                {/* OPTIONS */}
                <Section label="OPTIONS">
                    <div className="flex items-center justify-between py-1">
                        <div>
                            <span className="mono text-[12px] text-[#9896A4]">infer</span>
                            <p className="text-[11px] text-[#5C5A6A] mt-0.5">Extract memories automatically from messages</p>
                        </div>
                        <Toggle value={infer} onChange={setInfer} />
                    </div>
                </Section>

                {/* METADATA */}
                <Section label="METADATA">
                    <div className="flex flex-col gap-1.5">
                        {metaEntries.map((entry, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <input
                                    value={entry.key}
                                    onChange={e => updateMetaEntry(i, "key", e.target.value)}
                                    placeholder="key"
                                    className="flex-1 h-7 px-2 bg-[#0A0A0B] border border-[#232329] rounded-md mono text-[12px] text-[#EDECF0] placeholder-[#5C5A6A] outline-none transition-colors"
                                    onFocus={e => (e.target as HTMLElement).style.borderColor = "#2E2E38"}
                                    onBlur={e => (e.target as HTMLElement).style.borderColor = "#232329"}
                                />
                                <input
                                    value={entry.value}
                                    onChange={e => updateMetaEntry(i, "value", e.target.value)}
                                    placeholder="value"
                                    className="flex-1 h-7 px-2 bg-[#0A0A0B] border border-[#232329] rounded-md text-[12px] text-[#EDECF0] placeholder-[#5C5A6A] outline-none transition-colors"
                                    onFocus={e => (e.target as HTMLElement).style.borderColor = "#2E2E38"}
                                    onBlur={e => (e.target as HTMLElement).style.borderColor = "#232329"}
                                />
                                <button
                                    onClick={() => removeMetaEntry(i)}
                                    className="shrink-0 text-[#5C5A6A] hover:text-[#E5534B] bg-transparent border-none cursor-pointer transition-colors"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 6l12 12M18 6 6 18" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addMetaEntry}
                            className="flex items-center gap-1.5 text-[12px] text-[#9896A4] hover:text-[#EDECF0] bg-transparent border border-[#232329] hover:border-[#2E2E38] rounded-md h-7 px-2.5 transition-all cursor-pointer w-full justify-center"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add field
                        </button>
                    </div>
                </Section>

                {error && (
                    <div className="mx-4 mb-2 p-3 bg-[#0A0A0B] border border-[rgba(229,83,75,0.30)] rounded-lg text-[12px] text-[#E5534B]">
                        {error}
                    </div>
                )}
            </div>

            {/* footer */}
            <div className="p-3 border-t border-[#232329] flex gap-2 justify-end">
                <button
                    onClick={onClose}
                    className="h-8 px-3 text-[13px] text-[#9896A4] bg-transparent border-none cursor-pointer transition-colors hover:text-[#EDECF0]"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!hasContent || submitting}
                    className="h-8 px-3 flex items-center gap-1.5 text-[13px] font-medium bg-[#7C6EF8] text-white rounded-md transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    onMouseEnter={e => { if (!submitting && hasContent) (e.currentTarget as HTMLElement).style.background = "#9182FA"; }}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#7C6EF8"}
                >
                    {submitting ? (
                        "Adding…"
                    ) : (
                        <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add memory
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
};

function Section({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="p-4 border-b border-[#232329]">
            <div className="flex items-center gap-1.5 mb-3">
                <span className="mono text-[10px] text-[#5C5A6A] tracking-[1.4px] font-medium">{label}</span>
                {required && <span className="text-[10px] text-[#E5534B]">*</span>}
            </div>
            {children}
        </div>
    );
}

function ScopeField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="flex items-center gap-2 h-7">
            <span className="mono text-[11px] text-[#5C5A6A] w-16 shrink-0">{label}</span>
            <input
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 h-full px-2 bg-[#0A0A0B] border border-[#232329] rounded-md text-[12px] text-[#EDECF0] placeholder-[#5C5A6A] outline-none transition-colors"
                onFocus={e => (e.target as HTMLElement).style.borderColor = "#2E2E38"}
                onBlur={e => (e.target as HTMLElement).style.borderColor = "#232329"}
            />
        </div>
    );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className="relative w-[28px] h-4 border-none rounded-full p-0 cursor-pointer transition-colors shrink-0"
            style={{ background: value ? "#7C6EF8" : "#2E2E38" }}
        >
            <span
                className="absolute top-[2px] w-3 h-3 bg-white rounded-full transition-all"
                style={{ left: value ? 14 : 2 }}
            />
        </button>
    );
}

export default AddMemoryPanel;
