const express = require("express");
const Anthropic = require("@anthropic-ai/sdk").default;

const router = express.Router();

// 复用与 chat.js 相同的 Anthropic client 配置
const RAW_BASE_URL = process.env.API_BASE_URL;
const baseURL = RAW_BASE_URL
  ? RAW_BASE_URL.replace(/\/v1\/?$/, "").replace(/\/$/, "")
  : undefined;

const apiKey = (process.env.API_KEY || "").trim();

const client = new Anthropic({
  apiKey,
  baseURL,
  authToken: null,
  defaultHeaders: { "x-api-key": apiKey },
});

// 使用较小/快速的模型生成建议（如果可用），否则使用主模型
const SUGGESTION_MODEL = process.env.SUGGESTION_MODEL || process.env.MODEL || "claude-sonnet-4-6";

const SYSTEM_PROMPT = `你是一个对话建议生成器。根据用户和AI的对话历史，生成2-3个自然的跟进问题供用户选择。

要求：
- 每个问题简洁明了，不超过20个字
- 问题应该是用户可能想继续追问的方向
- 涵盖不同角度（深入、扩展、应用等）
- 直接返回 JSON 数组格式，不要其他内容

返回格式示例：
["问题1", "问题2", "问题3"]`;

/**
 * POST /api/suggestions
 * 根据对话历史生成跟进建议
 */
router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.json({ suggestions: [] });
    }

    // 只取最近几轮对话，避免 token 过多
    const recentMessages = messages.slice(-6);

    // 构建对话摘要作为上下文
    const conversationContext = recentMessages
      .map((msg) => {
        const role = msg.role === "user" ? "用户" : "AI";
        // 从 parts 或 content 中提取文本
        let text = "";
        if (msg.parts) {
          text = msg.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("");
        } else if (typeof msg.content === "string") {
          text = msg.content;
        }
        // 截断过长文本
        if (text.length > 300) {
          text = text.slice(0, 300) + "...";
        }
        return `${role}: ${text}`;
      })
      .join("\n");

    const response = await client.messages.create({
      model: SUGGESTION_MODEL,
      max_tokens: 150,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `以下是对话历史，请生成跟进建议：\n\n${conversationContext}`,
        },
      ],
    });

    // 提取响应文本
    const responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    // 解析 JSON 数组
    let suggestions = [];
    try {
      // 尝试提取 JSON 数组（可能被包在 markdown 代码块里）
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          suggestions = parsed
            .filter((s) => typeof s === "string" && s.trim())
            .slice(0, 3)
            .map((prompt) => ({ prompt: prompt.trim() }));
        }
      }
    } catch (parseError) {
      console.warn("[suggestions] Failed to parse LLM response:", responseText);
    }

    res.json({ suggestions });
  } catch (error) {
    console.error("[suggestions] Error:", error.message);
    // 建议生成失败不应阻断用户体验，静默返回空数组
    res.json({ suggestions: [] });
  }
});

module.exports = router;
