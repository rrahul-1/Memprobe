import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

type Member = {
    username: string;
    role: "OWNER" | "MEMBER" | string;
    email: string;
};

type Organization = {
    name: string;
    created_at: string;
    updated_at: string;
    org_id: string;
    owner_pricing_plan: "FREE" | "PRO" | "ENTERPRISE" | string;
};

export async function GET(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    try {
        const response = await mem0Request(
            "/api/v1/orgs/organizations/", {
            apikey: apiKey!,
            method: "GET",
        })
        const data: Organization[] = await response.json();

        return NextResponse.json(
            {
                data: data.map((org) => {
                    return {
                        name: org.name,
                        id: org.org_id
                    }
                })

            },
            { status: 200 }
        );

    } catch (e) {
        console.log("Error while connecting to Mem0 to fetch organizations");
        return NextResponse.json(
            { error: "Failed to fetch organizations" },
            { status: 500 }
        )
    }
}