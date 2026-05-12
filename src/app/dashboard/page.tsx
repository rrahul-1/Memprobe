import type { Metadata } from "next";
import DashboardClient from "./DashboardClient"


export const metadata: Metadata = {
  title: "Dashboard | Memprobe",
  description: "Manage organizations and projects in Memprobe.",
};

export default function Dashboard() {
  return (
    <DashboardClient />
  )
}