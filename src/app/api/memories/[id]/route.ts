import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const apiKey = req.headers.get("mem0-apiKey");
    const { id } = await params;
    const body = await req.json();

    const response = await mem0Request(`/v1/memories/${id}/`, {
        apikey: apiKey!,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
    });

    if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const apiKey = req.headers.get("mem0-apiKey");
    const { id } = await params;

    const response = await mem0Request(`/v1/memories/${id}/`, {
        apikey: apiKey!,
        method: "DELETE",
    });

    if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error }, { status: response.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
}
