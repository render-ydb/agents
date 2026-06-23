"use client";

import { Thread } from "@/components/assistant-ui/thread";

export function meta() {
  return [
    { title: "Assistant UI" },
    { name: "description", content: "AI 聊天助手" },
  ];
}

export default function Home() {
  return (
    <main className="h-dvh">
      <Thread />
    </main>
  );
}
