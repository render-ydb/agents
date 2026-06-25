import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { threads } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/threads/:id/title — 生成对话标题
// 简单实现：提取第一条用户消息的前 50 个字符作为标题
// 可替换为 LLM 生成
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  // 从消息中提取标题
  let title = "New Chat";
  if (body.messages && body.messages.length > 0) {
    // 找到第一条用户消息
    const firstUserMsg = body.messages.find(
      (m: { role: string }) => m.role === "user",
    );
    if (firstUserMsg) {
      // 提取文本内容
      const text =
        typeof firstUserMsg.content === "string"
          ? firstUserMsg.content
          : Array.isArray(firstUserMsg.content)
            ? firstUserMsg.content
                .filter((p: { type: string }) => p.type === "text")
                .map((p: { text: string }) => p.text)
                .join(" ")
            : "";
      title = text.slice(0, 50) || "New Chat";
      if (text.length > 50) title += "...";
    }
  }

  // 保存标题到数据库
  await db
    .update(threads)
    .set({ title, updatedAt: new Date() })
    .where(eq(threads.id, id));

  return NextResponse.json({ title });
}
