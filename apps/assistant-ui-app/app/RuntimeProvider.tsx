"use client";

import {
  AssistantRuntimeProvider,
  InMemoryThreadListAdapter,
  useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";

// InMemoryThreadListAdapter 稳定实例，避免每次渲染重建
const threadListAdapter = new InMemoryThreadListAdapter();

export function RuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useRemoteThreadListRuntime({
    adapter: threadListAdapter,
    runtimeHook: () =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useChatRuntime({
        transport: new AssistantChatTransport({
          api: "http://localhost:3001/api/chat",
        }),
      }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
