import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

type Projects = {
    name: string;
    created_at: string;
    updated_at: string;
    description: string;
    project_id: string;
};

type Params = {
    params: Promise<{
        organizationId: string;
    }>;
}

export async function GET(
    req: Request,
    { params }: Params
) {
    const apiKey = req.headers.get("mem0-apiKey");
    const { organizationId } = await params;

    try {
        const response = await mem0Request(
            `/api/v1/orgs/organizations/${organizationId}/projects`, {
            apikey: apiKey!,
            method: "GET",
        })
        const data: Projects[] = await response.json();
        console.log("data:", data);


        return NextResponse.json(
            {
                data: data.map((project) => {
                    return {
                        name: project.name,
                        id: project.project_id
                    }
                })

            },
            { status: 200 }
        );

    } catch (e) {
        console.log("Error while connecting to Mem0 to fetch projects", e);
        return NextResponse.json(
            { error: "Failed to fetch projects" },
            { status: 500 }
        )
    }
}