"use client";

import { cn } from "@/lib/utils";
import {
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import { ArchiveIcon, ArchiveRestoreIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { FC } from "react";

// ─── 顶部新建按钮 ─────────────────────────────────────────────
const ThreadListNew: FC = () => (
  <ThreadListPrimitive.New asChild>
    <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground transition-colors">
      <PlusIcon className="size-4 shrink-0" />
      新建对话
    </button>
  </ThreadListPrimitive.New>
);

// ─── 单条会话项 ────────────────────────────────────────────────
const ThreadListItem: FC = () => (
  <ThreadListItemPrimitive.Root className="group relative">
    {/* 点击切换会话 */}
    <ThreadListItemPrimitive.Trigger className="flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground transition-colors pr-8">
      <span className="truncate">
        <ThreadListItemPrimitive.Title fallback="新对话" />
      </span>
    </ThreadListItemPrimitive.Trigger>

    {/* 右侧 ··· 下拉菜单 */}
    <ThreadListItemMorePrimitive.Root>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <button className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 hover:bg-muted transition-opacity">
          <span className="sr-only">操作</span>
          <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="14" cy="8" r="1.5" />
          </svg>
        </button>
      </ThreadListItemMorePrimitive.Trigger>

      <ThreadListItemMorePrimitive.Content
        side="right"
        align="start"
        sideOffset={4}
        className="z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-popover/95 p-1.5 text-popover-foreground shadow-lg backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <ThreadListItemPrimitive.Archive asChild>
          <ThreadListItemMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent">
            <ArchiveIcon className="size-4" />
            归档
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Archive>

        <ThreadListItemMorePrimitive.Separator className="my-1 h-px bg-border" />

        <ThreadListItemPrimitive.Delete asChild>
          <ThreadListItemMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-destructive outline-none select-none hover:bg-destructive/10 focus:bg-destructive/10">
            <Trash2Icon className="size-4" />
            删除
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Delete>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  </ThreadListItemPrimitive.Root>
);

// ─── 已归档会话项（在归档区显示，可恢复） ─────────────────────
const ArchivedThreadListItem: FC = () => (
  <ThreadListItemPrimitive.Root className="group relative">
    <ThreadListItemPrimitive.Trigger className="flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/50 hover:bg-accent hover:text-foreground data-[active=true]:bg-accent data-[active=true]:text-foreground transition-colors pr-8">
      <span className="truncate">
        <ThreadListItemPrimitive.Title fallback="已归档对话" />
      </span>
    </ThreadListItemPrimitive.Trigger>

    <ThreadListItemMorePrimitive.Root>
      <ThreadListItemMorePrimitive.Trigger asChild>
        <button className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 hover:bg-muted transition-opacity">
          <span className="sr-only">操作</span>
          <svg className="size-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="2" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="14" cy="8" r="1.5" />
          </svg>
        </button>
      </ThreadListItemMorePrimitive.Trigger>

      <ThreadListItemMorePrimitive.Content
        side="right"
        align="start"
        sideOffset={4}
        className="z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-popover/95 p-1.5 text-popover-foreground shadow-lg backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <ThreadListItemPrimitive.Unarchive asChild>
          <ThreadListItemMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent">
            <ArchiveRestoreIcon className="size-4" />
            恢复
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Unarchive>

        <ThreadListItemMorePrimitive.Separator className="my-1 h-px bg-border" />

        <ThreadListItemPrimitive.Delete asChild>
          <ThreadListItemMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-destructive outline-none select-none hover:bg-destructive/10 focus:bg-destructive/10">
            <Trash2Icon className="size-4" />
            删除
          </ThreadListItemMorePrimitive.Item>
        </ThreadListItemPrimitive.Delete>
      </ThreadListItemMorePrimitive.Content>
    </ThreadListItemMorePrimitive.Root>
  </ThreadListItemPrimitive.Root>
);

// ─── 已归档区域（用 hook 读归档数量来决定是否显示标题） ─────────
const ArchivedSection: FC = () => {
  const archivedCount = useAuiState((s) => s.threads.archivedThreadIds.length);
  if (archivedCount === 0) return null;
  return (
    <div>
      <p className="mt-3 px-3 pb-1 text-xs font-medium text-muted-foreground">
        已归档
      </p>
      <ThreadListPrimitive.Items archived>
        {() => <ArchivedThreadListItem />}
      </ThreadListPrimitive.Items>
    </div>
  );
};

// ─── 整体侧边栏 ────────────────────────────────────────────────
export const ThreadList: FC<{ className?: string }> = ({ className }) => (
  <ThreadListPrimitive.Root
    className={cn(
      "flex h-full flex-col gap-1 overflow-y-auto px-2 py-3",
      className,
    )}
  >
    <ThreadListNew />

    <div className="my-1 h-px bg-border/60" />

    {/* 活跃会话 */}
    <ThreadListPrimitive.Items>
      {() => <ThreadListItem />}
    </ThreadListPrimitive.Items>

    {/* 已归档区域 */}
    <ArchivedSection />
  </ThreadListPrimitive.Root>
);
