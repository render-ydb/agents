import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { threads } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/threads/:id — 获取单个对话
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.id, id))
    .limit(1);

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json(thread);
}

// PATCH /api/threads/:id — 更新对话（重命名等）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const [thread] = await db
    .update(threads)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(threads.id, id))
    .returning();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json(thread);
}

// DELETE /api/threads/:id — 删除对话
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [thread] = await db
    .delete(threads)
    .where(eq(threads.id, id))
    .returning();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
