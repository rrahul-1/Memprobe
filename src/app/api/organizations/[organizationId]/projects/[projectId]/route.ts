import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

type Projects = {
    name: string;
    created_at: string;
    updated_at: string;
    description: string;
    project_id: string;
};

export async function GET(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    try {
        const response = await mem0Request(
            "/api/v1/orgs/organizations/", {
            apikey: apiKey!,
            method: "GET",
        })
        const data: Projects[] = await response.json();

        return NextResponse.json(
            {
                data: data.map((org) => {
                    return {
                        name: org.name,
                        id: org.project_id
                    }
                })

            },
            { status: 200 }
        );

    } catch (e) {
        console.log("Error while connecting to Mem0 to fetch projects");
        return NextResponse.json(
            { error: "Failed to fetch organizations" },
            { status: 500 }
        )
    }
}