"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  CompositeAttachmentAdapter,
} from "@assistant-ui/react";
import { useStreamRuntime } from "@assistant-ui/react-langchain";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import {
  setPendingThreadExternalId,
  threadListAdapter,
} from "@/lib/thread-list-adapter";

export function Assistant() {
  const apiUrl =
    process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ||
    (typeof window !== "undefined"
      ? new URL("/api", window.location.href).href
      : undefined);

  const runtime = useStreamRuntime({
    assistantId: process.env.NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID!,
    apiUrl,
    onThreadId: setPendingThreadExternalId,
    unstable_threadListAdapter: threadListAdapter,
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full">
        <ThreadList />
        <div className="flex-1 min-w-0">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
