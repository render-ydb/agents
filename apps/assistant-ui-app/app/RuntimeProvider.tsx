"use client";

import {
  AssistantRuntimeProvider,
  InMemoryThreadListAdapter,
  useRemoteThreadListRuntime,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  CompositeAttachmentAdapter,
} from "@assistant-ui/react";
import { DevToolsModal } from "@assistant-ui/react-devtools";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { ImageGenToolUI } from "./components/assistant-ui/image-gen-tool-ui";

// InMemoryThreadListAdapter 稳定实例，避免每次渲染重建
const threadListAdapter = new InMemoryThreadListAdapter();

// 附件适配器：支持图片和文本文件上传
const attachmentAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
]);

export function RuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useRemoteThreadListRuntime({
    adapter: threadListAdapter,
    runtimeHook: () =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useChatRuntime({
        transport: new AssistantChatTransport({
          api: "http://localhost:3001/api/chat",
        }),
        adapters: {
          attachments: attachmentAdapter,
        },
      }),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ImageGenToolUI />
      <DevToolsModal/>
      {children}
    </AssistantRuntimeProvider>
  );
}
