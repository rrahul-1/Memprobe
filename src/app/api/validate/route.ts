import { NextResponse } from "next/server";
import { mem0Request } from "@/lib/mem0";

export async function GET(req: Request) {
    const apiKey = req.headers.get("mem0-apiKey");
    console.log(apiKey);
    const response = await mem0Request(
        "/v1/ping", {
        apikey: apiKey!,
        method: "GET",
    })
    if (!response.ok) {
        console.log(response);
        return NextResponse.json(
            { error: "Invalid apikey" },
            { status: 400 }
        )

    } else {
        return NextResponse.json(
            { status: 202 }
        )
    }
}