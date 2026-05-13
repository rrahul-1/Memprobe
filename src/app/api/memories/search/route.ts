import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

export type SearchMemory = {
    id: string;
    memory: string;
    score: number;
    user_id?: string;
    agent_id?: string;
    app_id?: string;
    run_id?: string;
    categories?: string[];
    created_at?: string;
    updated_at?: string;
    metadata?: any;
};

export async function POST(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    const body = await req.json();

    const response = await mem0Request("/v3/memories/search/", {
        apikey: apiKey!,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
    }

    const raw = await response.json();
    const results: SearchMemory[] = raw.results ?? raw;
    return NextResponse.json({ data: results }, { status: 200 });
}
