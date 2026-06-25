import { type NextRequest, NextResponse } from "next/server";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

function isSSE(res: Response) {
  return res.headers.get("content-type")?.includes("text/event-stream");
}

async function handleRequest(req: NextRequest, method: string) {
  try {
    const path = req.nextUrl.pathname.replace(/^\/?api\//, "");
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete("_path");
    searchParams.delete("nxtP_path");
    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    const options: RequestInit = {
      method,
      headers: {
        "x-api-key": process.env.LANGCHAIN_API_KEY || "",
      },
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = await req.text();
    }

    const res = await fetch(
      `${process.env.LANGGRAPH_API_URL}/${path}${queryString}`,
      options,
    );

    const corsHeaders = getCorsHeaders();

    // Next.js dev server (Turbopack) buffers streaming responses until the
    // first body chunk arrives. For SSE connections that may idle without
    // data (e.g. the `custom` channel), the client never receives headers
    // and the connection appears dead. Sending an SSE comment (`:`) as the
    // first chunk forces an immediate flush so the browser can establish
    // the EventSource connection.
    if (isSSE(res) && res.body) {
      const encoder = new TextEncoder();
      const upstream = res.body;

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(":\n\n"));
          const reader = upstream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          } catch {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: res.status,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
          ...corsHeaders,
        },
      });
    }

    const headers = new Headers(res.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    for (const [key, value] of Object.entries(corsHeaders)) {
      headers.set(key, value);
    }

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  } catch (e: unknown) {
    if (e instanceof Error) {
      const typedError = e as Error & { status?: number };
      return NextResponse.json(
        { error: typedError.message },
        { status: typedError.status ?? 500 },
      );
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => handleRequest(req, "GET");
export const POST = (req: NextRequest) => handleRequest(req, "POST");
export const PUT = (req: NextRequest) => handleRequest(req, "PUT");
export const PATCH = (req: NextRequest) => handleRequest(req, "PATCH");
export const DELETE = (req: NextRequest) => handleRequest(req, "DELETE");
export const OPTIONS = () =>
  new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
