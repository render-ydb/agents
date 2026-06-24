const express = require("express");
const { generateImage } = require("ai");
const { createOpenAI } = require("@ai-sdk/openai");

const router = express.Router();

// 复用 LiteLLM proxy 的配置
const openai = createOpenAI({
  apiKey: (process.env.API_KEY || "").trim(),
  baseURL: process.env.API_BASE_URL || "https://api.openai.com/v1",
});

/**
 * POST /api/image
 * Body: { prompt: string }
 * Returns: { image: "data:<mime>;base64,...", mimeType: string, revisedPrompt?: string }
 */
router.post("/", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    console.log("[image] Generating image for prompt:", prompt.slice(0, 100));

    const result = await generateImage({
      model: openai.image("gpt-image-2"),
      prompt,
    });

    // 提取 revisedPrompt（OpenAI 可能会优化用户的 prompt）
    const revisedPrompt =
      result.providerMetadata?.openai?.revisedPrompt ??
      result.providerMetadata?.openai?.revised_prompt;

    const image = `data:${result.image.mimeType || "image/png"};base64,${result.image.base64}`;
    const mimeType = result.image.mimeType || "image/png";

    console.log("[image] Generation complete, mimeType:", mimeType);

    res.json({
      image,
      mimeType,
      ...(typeof revisedPrompt === "string" && { revisedPrompt }),
    });
  } catch (err) {
    console.error("[image] Generation error:", err);
    res.status(500).json({
      error: "Image generation failed",
      message: err.message || String(err),
    });
  }
});

module.exports = router;
