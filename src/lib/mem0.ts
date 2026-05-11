import { headers } from "next/headers";

const BASE_URL = "https://api.mem0.ai";

type RequestOptions = {
    method: "GET" | "POST" | "PUT" | "DELETE";
    apikey: string;
    headers?: HeadersInit;
    body?: unknown
}

export const mem0Request = async (
    path: string,
    options: RequestOptions
) => {
    const response = await fetch(`${BASE_URL}${path}`, {
        headers: {
            Authorization: `Token ${options.apikey}`,
            ...options.headers
        },
        body: options.body
            ? JSON.stringify(options.body)
            : undefined
    });
    return response;
}