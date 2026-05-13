import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

export type Entity = {
    id: string;
    name: string;
    owner: string;
    metadata: any;
    type: string
}

export type EntityResponse = {
    count: number;
    next: string|null,
    previous: string| null;
    results: Entity[]
}

export async function GET(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    const response = await mem0Request(
        `/v1/entities?${params}`, {
        apikey: apiKey!,
        method: "GET",
    })
    if (!response.ok) {
        console.log(response);
        const error = response.text;

        return NextResponse.json(
            { error },
            { status: response.status }
        )

    } else {
        const rawResponse:EntityResponse = await response.json();
        const data = rawResponse.results;
        console.log(data);
        
        return NextResponse.json(
            {
                data: data.map((entity) => ({
                    name: entity.name,
                    type: entity.type,
                    id: entity.id,
                })),
                has_more: rawResponse.next !== null,
                count: rawResponse.count,
            },
            { status: 200 }
        )
    }
}