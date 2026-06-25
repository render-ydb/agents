import type { RemoteThreadListAdapter } from "@assistant-ui/react";

let pendingExternalId: string | undefined;

export const setPendingThreadExternalId = (externalId: string) => {
  pendingExternalId = externalId;
};

export const threadListAdapter: RemoteThreadListAdapter = {
  async list({ after } = {}) {
    const url = new URL("/api/threads", window.location.origin);
    if (after) url.searchParams.set("after", after);

    const { threads, next_cursor } = await fetch(url).then((r) => r.json());

    return {
      threads: threads.map(
        (t: {
          id: string;
          externalId: string | null;
          title: string | null;
          archived: boolean;
          createdAt: string;
        }) => ({
          remoteId: t.id,
          externalId: t.externalId ?? undefined,
          status: t.archived ? ("archived" as const) : ("regular" as const),
          title: t.title ?? undefined,
          custom: { createdAt: t.createdAt },
        }),
      ),
      nextCursor: next_cursor ?? undefined,
    };
  },

  async initialize(localId) {
    const externalId = pendingExternalId;
    pendingExternalId = undefined;

    const t = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ localId, externalId }),
    }).then((r) => r.json());

    return { remoteId: t.id, externalId: t.externalId ?? undefined };
  },

  async rename(remoteId, title) {
    await fetch(`/api/threads/${remoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  },

  async archive(remoteId) {
    await fetch(`/api/threads/${remoteId}/archive`, { method: "POST" });
  },

  async unarchive(remoteId) {
    await fetch(`/api/threads/${remoteId}/unarchive`, { method: "POST" });
  },

  async delete(remoteId) {
    await fetch(`/api/threads/${remoteId}`, { method: "DELETE" });
  },

  async fetch(remoteId) {
    const t = await fetch(`/api/threads/${remoteId}`).then((r) => r.json());
    return {
      remoteId: t.id,
      externalId: t.externalId ?? undefined,
      status: t.archived ? ("archived" as const) : ("regular" as const),
      title: t.title ?? undefined,
    };
  },

  async generateTitle(remoteId, messages) {
    const { createAssistantStream } = await import("assistant-stream");
    return createAssistantStream(async (controller) => {
      const { title } = await fetch(`/api/threads/${remoteId}/title`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      }).then((r) => r.json());
      controller.appendText(title);
    });
  },
};
