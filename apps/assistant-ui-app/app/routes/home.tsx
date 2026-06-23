"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";

export function meta() {
  return [
    { title: "Assistant UI" },
    { name: "description", content: "AI 聊天助手" },
  ];
}

export default function Home() {
  return (
    <main className="flex h-dvh overflow-hidden">
      {/* 左侧会话列表侧边栏 */}
      <aside className="w-56 shrink-0 border-r bg-muted/30 hidden md:block">
        <ThreadList className="h-full" />
      </aside>

      {/* 右侧对话区 */}
      <div className="flex-1 min-w-0">
        <Thread />
      </div>
    </main>
  );
}
