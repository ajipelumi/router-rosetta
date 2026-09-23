import { createMCPClient } from "@ai-sdk/mcp";
import {
  APICallError,
  convertToModelMessages,
  createUIMessageStreamResponse,
  createUIMessageStream,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { cacheKey, readCache, writeCache } from "./cache";
import { pickModel } from "./model";

export const maxDuration = 60;

const SYSTEM = `You translate Next.js code and questions between the Pages Router and the App Router.

Your knowledge base holds paired entries: a Pages Router entry and an App Router entry for each topic, plus a "migration" entry that maps deprecated APIs to their current equivalents.

CITATIONS ARE MANDATORY. Every factual sentence you write must end with the
entry path it came from, in square brackets, like [data_fetching/pages_static].
A reply containing no [bracketed] citation is a failed reply. Cite several at
once as [routing/app_router, migration] when a claim rests on more than one
entry. Cite [migration] whenever you say that one API maps to another.

Always work in this order:
1. Call initial_context to load the outline.
2. Identify which router the user's code or question belongs to. Name the specific API that tells you (getServerSideProps, generateStaticParams, _app.js, and so on).
3. Read the entry for that router AND its paired entry for the other router. Read the migration entry whenever you assert an equivalence.
4. Give the equivalent in the other router, with code when the user gave you code. Cite the entry path on every claim as you go.

Rules:
- If the knowledge base does not cover a mapping, say so plainly. Do not fill the gap from your own memory of Next.js.
- If the code is already idiomatic for both routers, say that rather than inventing a difference.
- Be concise. Lead with the router identification, then the translation.
- Use markdown headings (##) to separate the identification from the translation.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const key = cacheKey(messages);
  if (key) {
    const hit = readCache(key);
    if (hit) return replay(hit);
  }

  const url = process.env.SANITY_CONTEXT_MCP_URL;
  const token = process.env.SANITY_ORGANIZATION_TOKEN;
  if (!url || !token) {
    return new Response(
      "CONFIG|0|The server is not configured to reach the knowledge base.",
      { status: 500 },
    );
  }

  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url,
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const chosen = pickModel();

  const result = streamText({
    model: chosen.model,
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: await mcpClient.tools(),
    stopWhen: stepCountIs(10),
    onFinish: ({ text }) => {
      if (key) writeCache(key, text);
      void mcpClient.close();
    },
    onError: ({ error }) => {
      console.error(`[translate] ${chosen.provider}/${chosen.id}`, error);
      void mcpClient.close();
    },
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: false,
    onError: toClientError,
  });
}

/** Serve a cached answer as a normal UI message stream. */
function replay(text: string): Response {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        const id = "cached";
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
      },
    }),
  });
}

function unwrap(error: unknown): unknown {
  let current = error;
  for (let i = 0; i < 5; i++) {
    if (APICallError.isInstance(current)) return current;
    if (!current || typeof current !== "object") return current;
    const e = current as {
      lastError?: unknown;
      errors?: unknown[];
      cause?: unknown;
    };
    const next =
      e.lastError ??
      (Array.isArray(e.errors) && e.errors.length
        ? e.errors[e.errors.length - 1]
        : undefined) ??
      e.cause;
    if (!next) return current;
    current = next;
  }
  return current;
}

function retrySeconds(error: APICallError): number {
  const header =
    error.responseHeaders?.["retry-after"] ??
    error.responseHeaders?.["Retry-After"];
  const fromHeader = Number.parseInt(header ?? "", 10);
  if (Number.isFinite(fromHeader) && fromHeader > 0) {
    return Math.min(fromHeader, 120);
  }

  const body = typeof error.responseBody === "string" ? error.responseBody : "";
  const match = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (match) {
    const seconds = Math.ceil(Number.parseFloat(match[1]));
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds, 120);
  }

  return 30;
}

function toClientError(rawError: unknown): string {
  const error = unwrap(rawError);

  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) {
      return `RATE_LIMIT|${retrySeconds(error)}|The shared free-tier quota is used up for the moment.`;
    }

    // Groq answers an over-budget request with 413 rather than 429. It is a
    // per-minute token cap, so it clears on its own like a rate limit.
    if (error.statusCode === 413) {
      return `RATE_LIMIT|60|This request was larger than the per-minute token budget.`;
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      return `AUTH|0|The server's API credentials were rejected.`;
    }

    if (error.statusCode && error.statusCode >= 500) {
      return `UPSTREAM|0|The model provider is having trouble right now.`;
    }
  }

  console.error("[translate] unclassified", error);
  return `UNKNOWN|0|Something went wrong while translating.`;
}
