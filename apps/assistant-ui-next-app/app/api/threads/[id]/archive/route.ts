import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { threads } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/threads/:id/archive — 存档对话
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [thread] = await db
    .update(threads)
    .set({ archived: true, updatedAt: new Date() })
    .where(eq(threads.id, id))
    .returning();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  return NextResponse.json(thread);
}
