"use client";
import { storage } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import DashboardNavBar from "@/components/dashboard/DashboardNavBar";
import SideBar from "@/components/dashboard/Sidebar";
import MemoryBrowser from "@/components/dashboard/MemoryBrowser";
import RetrievalView, { RetrievalContext, SearchResult } from "@/components/dashboard/RetrievalView";
import TimelineView from "@/components/dashboard/TimelineView";
import DetailsPanel from "@/components/dashboard/DetailsPanel";
import AddMemoryPanel from "@/components/dashboard/AddMemoryPanel";
import { Memory } from "@/app/api/memories/route";

export type Organization = { id: string; name: string };
export type Project = { id: string; name: string };
export type Entity = { id: string; name: string; owner: string; metadata: any; type: string };

export type FilterItem =
    | { user_id: string }
    | { agent_id: string }
    | { app_id: string }
    | { run_id: string };

export type View = "memories" | "retrieval" | "timeline";

// ─── module-level helpers ───────────────────────────────────────────────────

async function fetchEntities(
    mem0ApiKey: string,
    organizationId: string,
    projectId: string,
    page = 1,
): Promise<{ entities: Entity[]; hasMore: boolean }> {
    const response = await fetch(
        `/api/entities/?org_id=${organizationId}&project_id=${projectId}&page=${page}`,
        { headers: { "mem0-apiKey": mem0ApiKey } },
    );
    const rawData = await response.json();
    return {
        entities: rawData.data ?? [],
        hasMore: rawData.has_more ?? false,
    };
}

function distributeEntities(entities: Entity[]) {
    const rawUsers: string[] = [];
    const rawAgents: string[] = [];
    const rawApps: string[] = [];
    const rawRuns: string[] = [];
    entities.forEach(e => {
        if (e.type === "user") rawUsers.push(e.name);
        else if (e.type === "agent") rawAgents.push(e.name);
        else if (e.type === "app") rawApps.push(e.name);
        else if (e.type === "run") rawRuns.push(e.name);
    });
    return { rawUsers, rawAgents, rawApps, rawRuns };
}

async function fetchMemoriesForScope(
    mem0ApiKey: string,
    filterOperator: "AND" | "OR",
    userId?: string,
    agentId?: string,
    appId?: string,
    runId?: string,
    page = 1,
): Promise<{ data: Memory[]; hasMore: boolean }> {
    const filters: FilterItem[] = [];
    if (userId) filters.push({ user_id: userId });
    if (agentId) filters.push({ agent_id: agentId });
    if (appId) filters.push({ app_id: appId });
    if (runId) filters.push({ run_id: runId });

    const response = await fetch(`/api/memories?page=${page}`, {
        method: "POST",
        headers: { "mem0-apiKey": mem0ApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ filters: { [filterOperator]: filters } }),
    });

    if (!response.ok) return { data: [], hasMore: false };
    const json = await response.json();
    return {
        data: json.data ?? [],
        hasMore: json.next != null,
    };
}

// ─── component ───────────────────────────────────────────────────────────────

const Dashboard = () => {
    const router = useRouter();
    const { toast } = useToast();

    // Org / project
    const [loadingOrganizations, setLoadingOrganizations] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    // Entities
    const [users, setUsers] = useState<string[]>([]);
    const [agents, setAgents] = useState<string[]>([]);
    const [runs, setRuns] = useState<string[]>([]);
    const [apps, setApps] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
    const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
    const [selectedApp, setSelectedApp] = useState<string | undefined>(undefined);
    const [selectedRun, setSelectedRun] = useState<string | undefined>(undefined);
    const [entityPage, setEntityPage] = useState(1);
    const [entityHasMore, setEntityHasMore] = useState(false);
    const [entityLoading, setEntityLoading] = useState(false);
    const [entityRefreshTrigger, setEntityRefreshTrigger] = useState(0);

    // View
    const [view, setView] = useState<View>("memories");

    // Memories
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loadingMemories, setLoadingMemories] = useState(false);
    const [memoriesPage, setMemoriesPage] = useState(1);
    const [memoriesHasMore, setMemoriesHasMore] = useState(false);
    const [loadingMoreMemories, setLoadingMoreMemories] = useState(false);

    // Selection & UI state
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [memorySort, setMemorySort] = useState<"recent" | "oldest">("recent");
    const [memoryQuery, setMemoryQuery] = useState("");
    const [retrievalContext, setRetrievalContext] = useState<RetrievalContext | null>(null);
    const [filterOperator, setFilterOperator] = useState<"AND" | "OR">("AND");
    const [showAddPanel, setShowAddPanel] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // ── Organizations ────────────────────────────────────────────────────────
    useEffect(() => {
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey) { router.push("/"); return; }
        const run = async () => {
            try {
                setLoadingOrganizations(true);
                const res = await fetch("/api/organizations", { headers: { "mem0-apiKey": mem0ApiKey } });
                const rawData = await res.json();
                const data = rawData.data;
                setOrganizations(data);
                if (data.length > 0) setSelectedOrganization(data[0]);
            } catch (e) {
                toast("Failed to load organizations. Check your API key.", "error");
            } finally {
                setLoadingOrganizations(false);
            }
        };
        run();
    }, []);

    // ── Projects ─────────────────────────────────────────────────────────────
    useEffect(() => {
        setLoadingProjects(true);
        setProjects([]);
        setSelectedProject(null);
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !selectedOrganization) return;
        const run = async () => {
            try {
                const res = await fetch(`/api/organizations/${selectedOrganization.id}/projects`, {
                    headers: { "mem0-apiKey": mem0ApiKey },
                });
                const rawData = await res.json();
                const data = rawData.data;
                setProjects(data);
                if (data.length > 0) setSelectedProject(data[0]);
            } catch (e) {
                toast("Failed to load projects.", "error");
            } finally {
                setLoadingProjects(false);
            }
        };
        run();
    }, [selectedOrganization]);

    // ── Entities + UI: reset everything when project changes ─────────────────
    useEffect(() => {
        setUsers([]);
        setAgents([]);
        setApps([]);
        setRuns([]);
        setSelectedUser(undefined);
        setSelectedAgent(undefined);
        setSelectedApp(undefined);
        setSelectedRun(undefined);
        setEntityPage(1);
        setEntityHasMore(false);
        // clear derived/UI state so stale data from the previous project doesn't show
        setMemories([]);
        setSelectedMemory(null);
        setRetrievalContext(null);
        setMemoriesPage(1);
        setMemoriesHasMore(false);
        setCategoryFilter("all");
        setMemoryQuery("");
        setShowAddPanel(false);
    }, [selectedProject]);

    // ── Entities: fetch page 1 on project change (with auto-select) ──────────
    useEffect(() => {
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !selectedOrganization || !selectedProject) return;

        let cancelled = false;
        const run = async () => {
            setEntityLoading(true);
            try {
                const { entities, hasMore } = await fetchEntities(mem0ApiKey, selectedOrganization.id, selectedProject.id, 1);
                if (cancelled) return;
                const { rawUsers, rawAgents, rawApps, rawRuns } = distributeEntities(entities);
                setUsers(rawUsers);
                setAgents(rawAgents);
                setApps(rawApps);
                setRuns(rawRuns);
                setEntityHasMore(hasMore);
                setEntityPage(1);
                if (rawUsers.length > 0) setSelectedUser(rawUsers[0]);
            } catch (e) {
                toast("Failed to load entities.", "error");
            } finally {
                if (!cancelled) setEntityLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [selectedProject]);

    // ── Entities: re-fetch on refresh trigger (keep selections) ──────────────
    useEffect(() => {
        if (entityRefreshTrigger === 0) return;
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !selectedOrganization || !selectedProject) return;

        let cancelled = false;
        const run = async () => {
            setUsers([]);
            setAgents([]);
            setApps([]);
            setRuns([]);
            setEntityPage(1);
            setEntityHasMore(false);
            setEntityLoading(true);
            try {
                const { entities, hasMore } = await fetchEntities(mem0ApiKey, selectedOrganization.id, selectedProject.id, 1);
                if (cancelled) return;
                const { rawUsers, rawAgents, rawApps, rawRuns } = distributeEntities(entities);
                setUsers(rawUsers);
                setAgents(rawAgents);
                setApps(rawApps);
                setRuns(rawRuns);
                setEntityHasMore(hasMore);
                setEntityPage(1);
                // deliberately not resetting selections
            } catch (e) {
                toast("Failed to refresh entities.", "error");
            } finally {
                if (!cancelled) setEntityLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [entityRefreshTrigger]);

    // ── Memories: fetch page 1 on scope/operator/refresh change ─────────────
    useEffect(() => {
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey) return;
        if (!selectedUser && !selectedAgent && !selectedApp && !selectedRun) return;

        let cancelled = false;
        setLoadingMemories(true);
        setMemories([]);
        setSelectedMemory(null);
        setRetrievalContext(null);
        setMemoriesPage(1);
        setMemoriesHasMore(false);

        fetchMemoriesForScope(mem0ApiKey, filterOperator, selectedUser, selectedAgent, selectedApp, selectedRun, 1)
            .then(({ data, hasMore }) => {
                if (cancelled) return;
                setMemories(data);
                setMemoriesHasMore(hasMore);
            })
            .catch(() => toast("Failed to load memories.", "error"))
            .finally(() => { if (!cancelled) setLoadingMemories(false); });

        return () => { cancelled = true; };
    }, [selectedUser, selectedAgent, selectedApp, selectedRun, filterOperator, refreshTrigger]);

    // ── View effects ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (view !== "retrieval") setRetrievalContext(null);
    }, [view]);

    useEffect(() => {
        if (view !== "memories") setShowAddPanel(false);
    }, [view]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleRefresh() {
        setEntityRefreshTrigger(t => t + 1);
        setRefreshTrigger(t => t + 1);
    }

    async function handleLoadMoreEntities() {
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !selectedOrganization || !selectedProject || !entityHasMore || entityLoading) return;
        const nextPage = entityPage + 1;
        setEntityLoading(true);
        try {
            const { entities, hasMore } = await fetchEntities(mem0ApiKey, selectedOrganization.id, selectedProject.id, nextPage);
            const { rawUsers, rawAgents, rawApps, rawRuns } = distributeEntities(entities);
            if (rawUsers.length) setUsers(prev => [...prev, ...rawUsers]);
            if (rawAgents.length) setAgents(prev => [...prev, ...rawAgents]);
            if (rawApps.length) setApps(prev => [...prev, ...rawApps]);
            if (rawRuns.length) setRuns(prev => [...prev, ...rawRuns]);
            setEntityHasMore(hasMore);
            setEntityPage(nextPage);
        } catch (e) {
            toast("Failed to load more entities.", "error");
        } finally {
            setEntityLoading(false);
        }
    }

    async function handleLoadMoreMemories() {
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !memoriesHasMore || loadingMoreMemories) return;
        const nextPage = memoriesPage + 1;
        setLoadingMoreMemories(true);
        try {
            const { data, hasMore } = await fetchMemoriesForScope(
                mem0ApiKey, filterOperator, selectedUser, selectedAgent, selectedApp, selectedRun, nextPage
            );
            setMemories(prev => [...prev, ...data]);
            setMemoriesHasMore(hasMore);
            setMemoriesPage(nextPage);
        } catch (e) {
            toast("Failed to load more memories.", "error");
        } finally {
            setLoadingMoreMemories(false);
        }
    }

    function handleSelectMemory(m: Memory) {
        setSelectedMemory(m);
    }

    function handleSelectResult(result: SearchResult, context: RetrievalContext) {
        const m: Memory = {
            id: result.id,
            memory: result.memory,
            user_id: result.user_id ?? selectedUser ?? "",
            metadata: result.metadata ?? {},
            type: "text",
            categories: result.categories ?? [],
            created_at: result.created_at ?? new Date().toISOString(),
            updated_at: result.updated_at ?? new Date().toISOString(),
            expiration_date: null,
            structured_attributes: {} as any,
        };
        setSelectedMemory(m);
        setRetrievalContext(context);
    }

    const showRightPanel = view === "memories" || view === "retrieval";

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loadingOrganizations || loadingProjects) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] text-[#EDECF0]">
                <DashboardNavBar
                    organizations={organizations} projects={projects}
                    selectedOrganization={selectedOrganization} selectedProject={selectedProject}
                    onOrganizationChange={setSelectedOrganization} onProjectChange={setSelectedProject}
                />
                <div className="w-5/6 mx-auto px-8 pt-32">
                    <div className="animate-pulse space-y-8">
                        <div className="space-y-3">
                            <div className="h-8 w-64 rounded-xl bg-[#18181C]" />
                            <div className="h-4 w-96 rounded-lg bg-[#111113]" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            {[1, 2, 3].map(item => (
                                <div key={item} className="rounded-2xl border border-[#232329] bg-[#111113]/50 p-6">
                                    <div className="space-y-4">
                                        <div className="h-5 w-32 rounded bg-[#18181C]" />
                                        <div className="h-4 w-full rounded bg-[#232329]" />
                                        <div className="h-4 w-5/6 rounded bg-[#232329]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0A0A0B] overflow-hidden">
            <DashboardNavBar
                organizations={organizations} projects={projects}
                selectedOrganization={selectedOrganization} selectedProject={selectedProject}
                onOrganizationChange={setSelectedOrganization} onProjectChange={setSelectedProject}
            />

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <SideBar
                    users={users} agents={agents} apps={apps} runs={runs}
                    selectedUser={selectedUser} selectedAgent={selectedAgent}
                    selectedApp={selectedApp} selectedRun={selectedRun}
                    filterOperator={filterOperator} setFilterOperator={setFilterOperator}
                    setselectedUser={setSelectedUser} setSelectedAgent={setSelectedAgent}
                    setSelectedApp={setSelectedApp} setSelectedRun={setSelectedRun}
                    entityHasMore={entityHasMore} entityLoading={entityLoading}
                    onLoadMoreEntities={handleLoadMoreEntities}
                    view={view} setSelectedView={setView}
                    memories={memories}
                    categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                />

                {view === "memories" && (
                    <MemoryBrowser
                        memories={memories}
                        loading={loadingMemories}
                        hasMore={memoriesHasMore}
                        loadingMore={loadingMoreMemories}
                        onLoadMore={handleLoadMoreMemories}
                        query={memoryQuery} setQuery={setMemoryQuery}
                        sort={memorySort} setSort={setMemorySort}
                        categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
                        selectedMemoryId={selectedMemory?.id ?? null}
                        onSelectMemory={m => { setShowAddPanel(false); handleSelectMemory(m); }}
                        onAddMemory={() => { setSelectedMemory(null); setShowAddPanel(true); }}
                        onRefresh={handleRefresh}
                    />
                )}

                {view === "retrieval" && (
                    <RetrievalView
                        key={`${selectedOrganization?.id}-${selectedProject?.id}`}
                        selectedUser={selectedUser}
                        selectedAgent={selectedAgent}
                        selectedApp={selectedApp}
                        selectedRun={selectedRun}
                        filterOperator={filterOperator}
                        selectedResultId={selectedMemory?.id ?? null}
                        onSelectResult={handleSelectResult}
                        onRefreshEntities={() => setEntityRefreshTrigger(t => t + 1)}
                    />
                )}

                {view === "timeline" && (
                    <TimelineView
                        key={`${selectedOrganization?.id}-${selectedProject?.id}`}
                        memories={memories}
                        initialMemoryId={selectedMemory?.id ?? null}
                        selectedUser={selectedUser}
                        selectedAgent={selectedAgent}
                        selectedApp={selectedApp}
                        selectedRun={selectedRun}
                        onRefreshEntities={() => setEntityRefreshTrigger(t => t + 1)}
                    />
                )}

                {showRightPanel && showAddPanel && view === "memories" && (
                    <AddMemoryPanel
                        selectedUser={selectedUser}
                        selectedAgent={selectedAgent}
                        selectedApp={selectedApp}
                        selectedRun={selectedRun}
                        onClose={() => setShowAddPanel(false)}
                        onAdded={() => { setShowAddPanel(false); setRefreshTrigger(t => t + 1); }}
                    />
                )}

                {showRightPanel && !showAddPanel && (
                    <DetailsPanel
                        memory={selectedMemory}
                        view={view}
                        retrievalContext={retrievalContext}
                        onClose={() => setSelectedMemory(null)}
                        onOpenTimeline={() => setView("timeline")}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
