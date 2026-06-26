import { tool } from "@langchain/core/tools";

type WebSearchInput = {
  query: string;
  max_results?: number;
  search_depth?: "basic" | "advanced";
  include_domains?: string[];
  exclude_domains?: string[];
};

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type TavilyResponse = {
  query?: string;
  answer?: string;
  results?: TavilyResult[];
};

const DEFAULT_MAX_RESULTS = 5;
const MAX_RESULTS_LIMIT = 10;

function clampMaxResults(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_MAX_RESULTS;
  return Math.min(Math.max(Math.floor(value), 1), MAX_RESULTS_LIMIT);
}

function compactResult(result: TavilyResult) {
  return {
    title: result.title ?? "Untitled",
    url: result.url ?? "",
    content: result.content ?? "",
    score: result.score,
  };
}

export const webSearchTool = tool(
  async (input: WebSearchInput) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("TAVILY_API_KEY is not configured");
    }

    const maxResults = clampMaxResults(input.max_results);
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: input.query,
        search_depth: input.search_depth ?? "basic",
        include_answer: true,
        include_raw_content: false,
        max_results: maxResults,
        include_domains: input.include_domains,
        exclude_domains: input.exclude_domains,
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Tavily search failed (${response.status}): ${message.slice(0, 300)}`);
    }

    const data = (await response.json()) as TavilyResponse;
    return JSON.stringify({
      query: data.query ?? input.query,
      answer: data.answer ?? "",
      results: (data.results ?? []).map(compactResult),
    });
  },
  {
    name: "web_search",
    description:
      "Search the live web for current or external information. Use this when the answer may depend on recent facts, documentation, pricing, news, or sources outside the conversation.",
    schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to send to Tavily.",
        },
        max_results: {
          type: "number",
          description: "Maximum number of results to return. Defaults to 5; capped at 10.",
        },
        search_depth: {
          type: "string",
          enum: ["basic", "advanced"],
          description: "Use basic for most searches; advanced for deeper research.",
        },
        include_domains: {
          type: "array",
          items: { type: "string" },
          description: "Optional domains to restrict results to, such as ['docs.example.com'].",
        },
        exclude_domains: {
          type: "array",
          items: { type: "string" },
          description: "Optional domains to exclude from results.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
);
