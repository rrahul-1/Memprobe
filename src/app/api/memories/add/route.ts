import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

export async function POST(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    const body = await req.json();

    const response = await mem0Request("/v3/memories/add/", {
        apikey: apiKey!,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ data }, { status: 200 });
}
