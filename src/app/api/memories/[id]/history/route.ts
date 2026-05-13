import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

export type HistoryEvent = {
    id: string;
    memory_id: string;
    old_memory: string | null;
    new_memory: string | null;
    event: "ADD" | "UPDATE" | "DELETE" | "NOOP";
    categories?: string[];
    created_at: string;
    updated_at: string;
};

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const apiKey = req.headers.get("mem0-apiKey");
    const { id } = await params;

    const response = await mem0Request(`/v1/memories/${id}/history/`, {
        apikey: apiKey!,
        method: "GET",
    });

    if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
    }

    const data: HistoryEvent[] = await response.json();
    return NextResponse.json({ data }, { status: 200 });
}
