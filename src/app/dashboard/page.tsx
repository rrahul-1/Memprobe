"use client";
import { storage } from "@/lib/storage"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardNavBar from "@/components/DashboardNavBar";


type Organization = {
  id: string;
  name: string;
};

type Project = {
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
    setLoadingOrganizations(true)
    const mem0ApiKey = storage.getApiKey();
    if (!mem0ApiKey) {
      console.log("Mem0 Apikey is not found.");
      router.push("/");
      return;
    }


    try {
      console.log("fetching Organizations");
      const fetchOrganizations = async () => {
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
      };

      fetchOrganizations();

    } catch (e) {
      console.log("Error while connecting with Mem0 server.", e);
    } finally {
      setLoadingOrganizations(false)
    }

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


    try {
      const fetchProjects = async () => {
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
      };

      fetchProjects();

    } catch (e) {
      console.log("Error while connecting with Mem0 server.", e);
    } finally {
      setLoadingProjects(false);
    }

  }, [selectedOrganization])


  return (
    <div className="h-screen w-5/6 mx-auto px-8 pt-24">
      <DashboardNavBar />
      Dashboard
      <p>{selectedOrganization?.name}</p>
      <p>{selectedProject?.name}</p>
    </div>
  )
}

export default Dashboard