import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

type StructuredAttributes = {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    day_of_week: string;
    week_of_year: number;
    day_of_year: number;
    quarter: number;
    is_weekend: boolean;
};

export type Memory = {
    id: string;
    memory: string;
    user_id: string;
    metadata: any;
    type: string
    categories: string[]
    created_at: string;
    updated_at: string;
    expiration_date: string | null;
    structured_attributes: StructuredAttributes;
}


export type MemoryResponse = {
    count: number;
    next: string | null,
    previous: string | null;
    results: Memory[]
}

export async function POST(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    const body = await req.json();
    const path = params
        ? `/v3/memories/?${params}`
        : "/v3/memories/";


    const response = await mem0Request(
        path, {
        apikey: apiKey!,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body
    })
    if (!response.ok) {
        console.log(response);
        const error = await response.text();

        return NextResponse.json(
            { error },
            { status: response.status }
        )

    } else {
        const rawResponse: MemoryResponse = await response.json();
        const data = rawResponse.results;
        return NextResponse.json(
            {
                total: rawResponse.count,
                next: rawResponse.next,
                previous: rawResponse.previous,
                data: data
            },
            { status: 200 }
        )
    }
}