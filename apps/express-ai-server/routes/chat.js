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
 * 从 base64 数据的 magic bytes 检测真实图片 MIME 类型。
 * Anthropic API 要求 media_type 与实际图片格式严格匹配。
 */
function detectImageMediaType(base64Data) {
  // 取前 16 字节足以判断常见格式
  const bytes = Buffer.from(base64Data.slice(0, 24), "base64");
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }
  return null;
}

/**
 * 从 data URL 或 base64 数据中提取正确的 media type。
 * 优先使用 magic bytes 检测，比 data URL 声明的 MIME 更可靠。
 */
function resolveImageMediaType(data, declaredMediaType) {
  let base64;
  if (typeof data === "string") {
    base64 = data.includes(",") ? data.split(",")[1] : data;
  } else if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
    base64 = Buffer.from(data).toString("base64");
  } else {
    return declaredMediaType || "image/png";
  }

  // magic bytes 检测最准确
  const detected = detectImageMediaType(base64);
  if (detected) return detected;

  // fallback: 从 data URL 提取
  if (typeof data === "string" && data.startsWith("data:")) {
    const match = data.match(/^data:([^;,]+)/);
    if (match) return match[1];
  }

  return declaredMediaType || "image/png";
}

/**
 * 将 AI SDK 的 ModelMessage[] 转换为 Anthropic SDK 的 messages 格式。
 * 处理 image / file content parts（附件），映射到 Anthropic 的 image content block。
 */
function toAnthropicMessages(modelMessages) {
  return modelMessages
    .filter((m) => m.role !== "system")
    .map((msg) => {
      const role = msg.role === "user" ? "user" : "assistant";
      console.log("each msg",msg)
      // 如果 content 是纯字符串，直接返回
      if (typeof msg.content === "string") {
        return { role, content: msg.content };
      }

      // content 是数组：可能包含 text / image / file parts
      const contentBlocks = msg.content
        .map((part) => {
          if (part.type === "text") {
            return { type: "text", text: part.text };
          }
          if (part.type === "image") {
            // ImagePart: { type: 'image', image: base64 | Uint8Array | URL, mediaType? }
            const imageData = part.image;
            // 如果是 URL 类型
            if (imageData instanceof URL || typeof imageData === "string" && imageData.startsWith("http")) {
              return {
                type: "image",
                source: { type: "url", url: String(imageData) },
              };
            }
            // base64 字符串或 Uint8Array
            let base64;
            if (typeof imageData === "string") {
              base64 = imageData.includes(",")
                ? imageData.split(",")[1]
                : imageData;
            } else if (imageData instanceof Uint8Array || Buffer.isBuffer(imageData)) {
              base64 = Buffer.from(imageData).toString("base64");
            } else {
              return null;
            }
            // 用 magic bytes 检测真实 MIME，避免前端声明与实际格式不一致
            const mediaType = resolveImageMediaType(imageData, part.mediaType);
            return {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            };
          }
          if (part.type === "file") {
            // FilePart: { type: 'file', data: base64 | Uint8Array | URL, mediaType, filename? }
            const { data, mediaType } = part;
            // 只处理图片类型的文件附件
            if (mediaType && mediaType.startsWith("image/")) {
              if (data instanceof URL || typeof data === "string" && data.startsWith("http")) {
                return {
                  type: "image",
                  source: { type: "url", url: String(data) },
                };
              }
              let base64;
              if (typeof data === "string") {
                base64 = data.includes(",") ? data.split(",")[1] : data;
              } else if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
                base64 = Buffer.from(data).toString("base64");
              } else {
                return null;
              }
              // 用 magic bytes 检测真实 MIME
              const realMediaType = resolveImageMediaType(data, mediaType);
              return {
                type: "image",
                source: { type: "base64", media_type: realMediaType, data: base64 },
              };
            }
            // 文本类型的附件 -> 转换为文本 block
            if (mediaType && mediaType.startsWith("text/")) {
              let text;
              if (typeof data === "string") {
                // 可能是 data URL
                if (data.startsWith("data:")) {
                  const base64Part = data.split(",")[1];
                  text = Buffer.from(base64Part, "base64").toString("utf-8");
                } else {
                  text = data;
                }
              } else if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
                text = Buffer.from(data).toString("utf-8");
              }
              if (text) {
                const filename = part.filename ? `[File: ${part.filename}]\n` : "";
                return { type: "text", text: `${filename}${text}` };
              }
            }
            return null;
          }
          return null;
        })
        .filter(Boolean);

      // 如果转换后只有一个 text block，简化为字符串
      if (contentBlocks.length === 1 && contentBlocks[0].type === "text") {
        return { role, content: contentBlocks[0].text };
      }

      return { role, content: contentBlocks };
    });
}

/**
 * Mentions 指令正则 — 匹配 :type[label]{name=id} 格式
 * 前端 @ 提及选中后会将选项序列化为此格式插入消息文本。
 */
const DIRECTIVE_RE = /:([\w-]+)\[([^\]]+)\](?:\{name=([^}]+)\})?/g;

/**
 * 角色/风格 → system prompt 映射。
 * 当用户消息中包含 @mentions 指令时，后端据此注入对应的 system prompt。
 */
const ROLE_PROMPTS = {
  translator:
    "你是一位专业翻译助手。用户发送中文时翻译为英文，发送英文时翻译为中文。保持自然流畅的表达，注意上下文语境。",
  "code-expert":
    "你是一位资深软件工程师，拥有 15 年开发经验。回答时给出最佳实践、考虑边界情况、提供生产级代码示例，并解释为什么这样做。",
  teacher:
    "你是一位耐心的老师。回答时由浅入深，使用类比帮助理解，提供分步骤讲解，并在末尾总结要点。对于复杂概念，先给出直觉理解再展开细节。",
  creative:
    "你是一位创意写手和文案专家。擅长写出引人入胜的内容，包括广告文案、故事、标语等。语言生动，善用修辞手法。",
};

const STYLE_PROMPTS = {
  concise: "请用最精简的语言回答，避免冗余。每个回答控制在 3-5 句话以内，直击要点。",
  detailed:
    "请详细展开回答，包含背景知识、具体示例、注意事项和延伸阅读建议。结构化地组织内容。",
  chat: "用轻松随意的语气交流，像朋友聊天一样。可以用表情、口语化表达，不必太正式。",
};

/**
 * 从用户最后一条消息中提取 mentions 指令，生成 system prompt。
 */
function buildSystemFromMentions(text) {
  const parts = [];
  let match;
  const re = new RegExp(DIRECTIVE_RE.source, DIRECTIVE_RE.flags);
  while ((match = re.exec(text)) !== null) {
    const [, type, , id] = match;
    const name = id || match[2]; // id 为空时 label 就是 id
    if (type === "role" && ROLE_PROMPTS[name]) {
      parts.push(ROLE_PROMPTS[name]);
    } else if (type === "style" && STYLE_PROMPTS[name]) {
      parts.push(STYLE_PROMPTS[name]);
    }
  }
  return parts.length > 0 ? parts.join("\n\n") : null;
}

/**
 * 调用层用官方 @anthropic-ai/sdk，只在出口把原生流事件转换成
 * AI SDK 的 UI message stream，前端 assistant-ui 零改动。
 */
router.post("/", async (req, res) => {
  const { messages, system } = req.body;

  // UI messages -> AI SDK ModelMessages（去掉前端包装）

  const modelMessages = await convertToModelMessages(messages);


  // ModelMessages -> Anthropic SDK 格式（处理 image/file parts）
  const anthropicMessages = toAnthropicMessages(modelMessages);

  // 从用户最后一条消息中提取 @mentions 指令，动态生成 system prompt
  const lastUserMsg = modelMessages.filter((m) => m.role === "user").pop();
  const lastUserText =
    lastUserMsg && Array.isArray(lastUserMsg.content)
      ? lastUserMsg.content
          .filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("")
      : typeof lastUserMsg?.content === "string"
        ? lastUserMsg.content
        : "";
  const mentionSystem = buildSystemFromMentions(lastUserText);
  // 优先使用 mention 生成的 system prompt，fallback 到前端传入的 system
  const finalSystem = mentionSystem || (typeof system === "string" ? system : undefined);

  const uiStream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      writer.write({ type: "start" });

      // 官方 SDK 的流式接口
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        system: finalSystem,
        messages: anthropicMessages,
      });

      // Anthropic block index -> UI chunk id，保证 start/delta/end 对齐
      const blockUiIds = new Map();

      for await (const event of stream) {
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
