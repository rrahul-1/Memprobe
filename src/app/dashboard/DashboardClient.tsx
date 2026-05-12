"use client";
import { storage } from "@/lib/storage"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNavBar from "@/components/dashboard/DashboardNavBar";
import SideBar from "@/components/dashboard/Sidebar";

export type Organization = {
    id: string;
    name: string;
};

export type Project = {
    id: string;
    name: string;
}
export type SelectedFilters = {
    userId?: string
    agentId?: string
    appId?: string
    runIds?: string
}

export type Entity = {
    id: string;
    name: string;
    owner: string;
    metadata: any;
    type: string
}

export type View = "memories" | "retrieval" | "timeline";

async function fetchEntities(mem0ApiKey: string, organizationId: string, projectId: string) {
    const response = await fetch(`/api/entities/?org_id=${organizationId}&project_id=${projectId}`, {
        headers: {
            "mem0-apiKey": mem0ApiKey!,
        },
    }
    );
    const rawData = await response.json();
    const data: Entity[] = rawData.data
    return data;
}


const Dashboard = () => {
    const router = useRouter();

    const [loadingOrganizations, setLoadingOrganizations] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingEntities, setLoadingEnities] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [users, setUsers] = useState<string[]>([]);
    const [agents, setAgents] = useState<string[]>([]);
    const [runs, setRuns] = useState<string[]>([]);
    const [apps, setApps] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
    const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
    const [selectedApp, setSelectedApp] = useState<string | undefined>(undefined);
    const [selectedRun, setSelectedRun] = useState<string | undefined>(undefined);

    const [view, setView] = useState<View>("memories");


    let mem0ProjectName: string | null;
    //Organization
    useEffect(() => {
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey) {
            console.log("Mem0 Apikey is not found.");
            router.push("/");
            return;
        }

        const fetchOrganizations = async () => {
            try {
                setLoadingOrganizations(true)
                console.log("fetching Organizations");

                const response = await fetch("/api/organizations", {
                    headers: {
                        "mem0-apiKey": mem0ApiKey!,
                    },
                }
                );
                const rawData = await response.json();
                const data = rawData.data
                console.log(data);
                setOrganizations(data);

                // Auto select first organization
                if (data.length > 0) {
                    setSelectedOrganization(data[0]);
                }
            } catch (e) {
                console.log("Error while connecting with Mem0 server.", e);
            } finally {
                setLoadingOrganizations(false)
            }
        }
        fetchOrganizations();
    }, [])
    //Projects
    useEffect(() => {
        setLoadingProjects(true);
        setProjects([])
        setSelectedProject(null);
        console.log("fetching projects");
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !selectedOrganization) {
            console.log("No orgs");
            return;
        }

        const fetchProjects = async () => {
            try {

                const response = await fetch(`/api/organizations/${selectedOrganization.id}/projects`, {
                    headers: {
                        "mem0-apiKey": mem0ApiKey!,
                    },
                }
                );
                const rawData = await response.json();
                const data = rawData.data
                console.log(data);
                setProjects(data);

                // Auto select first organization
                if (data.length > 0) {
                    setSelectedProject(data[0]);
                }
            } catch (e) {
                console.log("Error while connecting with Mem0 server.", e);
            } finally {
                setLoadingProjects(false);
            }
        };
        fetchProjects();
    }, [selectedOrganization])

    //Entities
    useEffect(() => {
        setLoadingEnities(true);
        setUsers([])
        setAgents([]);
        setApps([]);
        setRuns([]);
        setSelectedUser(undefined);
        setSelectedAgent(undefined);
        setSelectedApp(undefined);
        setSelectedUser(undefined);

        console.log("fetching entities");
        const mem0ApiKey = storage.getApiKey();
        if (!mem0ApiKey || !selectedOrganization || !selectedProject) {
            console.log("No orgs");
            return;
        }

        const fetchProjects = async () => {
            try {
                const data = await fetchEntities(mem0ApiKey, selectedOrganization.id, selectedProject.id)

                const rawUsers: string[] = [];
                const rawAgents: string[] = [];
                const rawApps: string[] = [];
                const rawRuns: string[] = [];
                data.forEach((entity) => {
                    if (entity.type == "user") {
                        rawUsers.push(entity.name)
                    } else if (entity.type == "agent") {
                        rawAgents.push(entity.name)
                    } else if (entity.type == "app") {
                        rawApps.push(entity.name)
                    } else if (entity.type == "run") {
                        rawRuns.push(entity.name)
                    }
                })
                setUsers(rawUsers);
                setAgents(rawAgents);
                setApps(rawApps);
                setRuns(rawRuns);
                // Auto select first organization
                if (rawUsers.length > 0) {
                    setSelectedUser(rawUsers[0]);
                }
            } catch (e) {
                console.log("Error while connecting with Mem0 server.", e);
            } finally {
                setLoadingEnities(false);
            }
        };
        fetchProjects();

    }, [selectedProject])

    if (loadingOrganizations || loadingProjects) {
        return (
            <div className="min-h-screen bg-black text-white">
                <DashboardNavBar
                    organizations={organizations}
                    projects={projects}
                    selectedOrganization={selectedOrganization}
                    selectedProject={selectedProject}
                    onOrganizationChange={setSelectedOrganization}
                    onProjectChange={setSelectedProject}
                />

                <div className="w-5/6 mx-auto px-8 pt-32">
                    <div className="animate-pulse space-y-8">

                        <div className="space-y-3">
                            <div className="h-8 w-64 rounded-xl bg-zinc-800" />
                            <div className="h-4 w-96 rounded-lg bg-zinc-900" />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
                                >
                                    <div className="space-y-4">
                                        <div className="h-5 w-32 rounded bg-zinc-700" />
                                        <div className="h-4 w-full rounded bg-zinc-800" />
                                        <div className="h-4 w-5/6 rounded bg-zinc-800" />
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    const selectedFilters = {
        userId: undefined,
        agentId: undefined,
        appId: undefined,
        runIds: undefined,
    }

    return (
        <div className="h-screen">
            <div className=" mx-auto">
                <DashboardNavBar
                    organizations={organizations}
                    projects={projects}
                    selectedOrganization={selectedOrganization}
                    selectedProject={selectedProject}
                    onOrganizationChange={setSelectedOrganization}
                    onProjectChange={setSelectedProject}
                />
            </div>
            <div className="h-[calc(100vh-52px)]">
                <SideBar users={users} agents={agents} apps={apps} runs={runs}
                    selectedUser={selectedUser} selectedAgent={selectedAgent} selectedApp={selectedApp} selectedRun={selectedRun}
                    setselectedUser={setSelectedUser} setSelectedAgent={setSelectedAgent} setSelectedApp={setSelectedApp} setSelectedRun={setSelectedRun}
                    view={view} setSelectedView={setView} />
            </div>


        </div>
    )
}

export default Dashboard