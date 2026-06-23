const express = require("express");
const Anthropic = require("@anthropic-ai/sdk").default;
const {
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
} = require("ai");

const router = express.Router();

// 原汁原味的 Anthropic 官方客户端
// 读 .env 里的 API_KEY / API_BASE_URL / MODEL
// 注意：Anthropic SDK 内部会自己拼 /v1/messages，所以 baseURL 要去掉末尾的 /v1
const RAW_BASE_URL = process.env.API_BASE_URL;
const baseURL = RAW_BASE_URL
  ? RAW_BASE_URL.replace(/\/v1\/?$/, "").replace(/\/$/, "")
  : undefined;

const apiKey = (process.env.API_KEY || "").trim();

const client = new Anthropic({
  apiKey,
  baseURL, // undefined 时走官方 https://api.anthropic.com
  // 关键：显式置空 authToken，否则 SDK 会读 shell 里的 ANTHROPIC_AUTH_TOKEN
  // （Claude Code CLI 注入的 JWT），导致 litellm 误用 Bearer 鉴权而 401。
  authToken: null,
  // litellm 用 x-api-key 鉴权，显式覆盖以确保头不被 SDK 改写
  defaultHeaders: { "x-api-key": apiKey },
});
const MODEL = process.env.MODEL || "claude-sonnet-4-6";

// 单次响应内 content block 的 UI id 生成（与 Anthropic block index 对齐）
let blockSeq = 0;
const nextBlockId = (prefix) => `${prefix}_${process.pid}_${blockSeq++}`;

/**
 * 调用层用官方 @anthropic-ai/sdk，只在出口把原生流事件转换成
 * AI SDK 的 UI message stream，前端 assistant-ui 零改动。
 */
router.post("/", async (req, res) => {
  const { messages, system } = req.body;

  // UI messages -> Anthropic messages（去掉前端包装）
  const modelMessages = await convertToModelMessages(messages);

  const uiStream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.write({ type: "start" });

      // 官方 SDK 的流式接口
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        system: typeof system === "string" ? system : undefined,
        messages: modelMessages,
      });

      // Anthropic block index -> UI chunk id，保证 start/delta/end 对齐
      const blockUiIds = new Map();

      for await (const event of stream) {
        console.log(event)
        switch (event.type) {
          case "message_start":
            break;

          case "content_block_start": {
            const { index, content_block } = event;
            if (content_block.type === "text") {
              const id = nextBlockId("text");
              blockUiIds.set(index, id);
              writer.write({ type: "text-start", id });
            } else if (content_block.type === "thinking") {
              const id = nextBlockId("rs");
              blockUiIds.set(index, id);
              writer.write({ type: "reasoning-start", id });
            }
            // tool_use 等暂不处理（前端未启用工具）
            break;
          }

          case "content_block_delta": {
            const { index, delta } = event;
            const id = blockUiIds.get(index);
            if (!id) break;
            if (delta.type === "text_delta") {
              writer.write({ type: "text-delta", id, delta: delta.text });
            } else if (delta.type === "thinking_delta") {
              writer.write({ type: "reasoning-delta", id, delta: delta.thinking });
            }
            break;
          }

          case "content_block_stop": {
            const id = blockUiIds.get(event.index);
            if (!id) break;
            if (id.startsWith("text_")) {
              writer.write({ type: "text-end", id });
            } else {
              writer.write({ type: "reasoning-end", id });
            }
            blockUiIds.delete(event.index);
            break;
          }

          case "message_delta":
          case "message_stop":
            break;
        }
      }

      writer.write({ type: "finish" });
    },
    onError: (err) => {
      console.error("[chat] stream error:", err);
      return "An error occurred while streaming.";
    },
  });

  // 把 UI message stream 以 SSE 形式写到 Express 的 Node 响应上
  pipeUIMessageStreamToResponse({ response: res, stream: uiStream });
});

module.exports = router;
