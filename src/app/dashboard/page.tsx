"use client";
import { storage } from "@/lib/storage"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNavBar from "@/components/DashboardNavBar";


export type Organization = {
  id: string;
  name: string;
};

export type Project = {
  id: string;
  name: string;
}

const Dashboard = () => {
  const router = useRouter();

  const [projectName, setProjectName] = useState("");
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  let mem0ProjectName: string | null;

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

  useEffect(() => {
    setLoadingProjects(true);
    console.log("fetching projects");
    console.log("selectedOrganization:", selectedOrganization);
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
  return (
    <div className="h-screen w-5/6 mx-auto px-8 pt-24">
      <DashboardNavBar
        organizations={organizations}
        projects={projects}
        selectedOrganization={selectedOrganization}
        selectedProject={selectedProject}
        onOrganizationChange={setSelectedOrganization}
        onProjectChange={setSelectedProject}
      />
      Dashboard
      <p>{selectedOrganization?.name}</p>
      <p>{selectedProject?.name}</p>
    </div>
  )
}

export default Dashboard