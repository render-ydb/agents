"use client";

import {
  ThreadListPrimitive,
  ThreadListItemPrimitive,
} from "@assistant-ui/react";
import {
  PlusIcon,
  ArchiveIcon,
  Trash2Icon,
  ArchiveRestoreIcon,
} from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

export function ThreadList() {
  return (
    <aside className="flex h-full w-64 flex-col border-r bg-muted/30">
      <ThreadListPrimitive.Root>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Chats</h2>
          <ThreadListPrimitive.New asChild>
            <button
              className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
              title="New Chat"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </ThreadListPrimitive.New>
        </div>

        {/* Thread items */}
        <div className="flex-1 overflow-y-auto">
          <ThreadListPrimitive.Items
            components={{
              ThreadListItem: ThreadListItem,
            }}
          />
        </div>

        {/* Load more */}
        <ThreadListPrimitive.LoadMore asChild>
          <button className="w-full border-t py-2 text-xs text-muted-foreground hover:text-foreground">
            Load more
          </button>
        </ThreadListPrimitive.LoadMore>
      </ThreadListPrimitive.Root>
    </aside>
  );
}

function ThreadListItem() {
  return (
    <ThreadListItemPrimitive.Root className="group flex items-center gap-1 px-3 py-2 hover:bg-muted/50 data-[current]:bg-muted cursor-pointer">
      <ThreadListItemPrimitive.Trigger className="flex-1 min-w-0 text-left">
        <span className="truncate text-sm block">
          <ThreadListItemPrimitive.Title fallback="New Chat" />
        </span>
      </ThreadListItemPrimitive.Trigger>

      {/* Actions (visible on hover) */}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <ThreadListItemPrimitive.Archive asChild>
          <TooltipIconButton tooltip="Archive" side="bottom" className="size-6">
            <ArchiveIcon className="h-3.5 w-3.5" />
          </TooltipIconButton>
        </ThreadListItemPrimitive.Archive>

        <ThreadListItemPrimitive.Unarchive asChild>
          <TooltipIconButton tooltip="Unarchive" side="bottom" className="size-6">
            <ArchiveRestoreIcon className="h-3.5 w-3.5" />
          </TooltipIconButton>
        </ThreadListItemPrimitive.Unarchive>

        <ThreadListItemPrimitive.Delete asChild>
          <TooltipIconButton tooltip="Delete" side="bottom" className="size-6 text-destructive hover:bg-destructive/10">
            <Trash2Icon className="h-3.5 w-3.5" />
          </TooltipIconButton>
        </ThreadListItemPrimitive.Delete>
      </div>
    </ThreadListItemPrimitive.Root>
  );
}
