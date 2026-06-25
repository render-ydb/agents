import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { threads } from "@/db/schema";
import { desc, eq, and, lt } from "drizzle-orm";

// GET /api/threads — 获取对话列表（支持分页和存档过滤）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");
  const includeArchived = searchParams.get("includeArchived") === "true";
  const limit = 20;

  const conditions = [];
  if (!includeArchived) {
    conditions.push(eq(threads.archived, false));
  }
  if (after) {
    // cursor-based pagination: fetch threads created before the cursor
    const cursorThread = await db
      .select({ createdAt: threads.createdAt })
      .from(threads)
      .where(eq(threads.id, after))
      .limit(1);
    if (cursorThread.length > 0) {
      conditions.push(lt(threads.createdAt, cursorThread[0].createdAt));
    }
  }

  const rows = await db
    .select()
    .from(threads)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(threads.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const result = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? result[result.length - 1].id : undefined;

  return NextResponse.json({
    threads: result,
    next_cursor: nextCursor,
  });
}

// POST /api/threads — 创建新对话元数据
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const [thread] = await db
    .insert(threads)
    .values({
      externalId: body.externalId || null,
      title: body.title || null,
    })
    .returning();

  return NextResponse.json(thread, { status: 201 });
}
