"use client";

import { cn } from "@/lib/utils";
import {
  ComposerPrimitive,
  MessagePrimitive,
  SelectionToolbarPrimitive,
  type QuoteInfo,
} from "@assistant-ui/react";
import { QuoteIcon, XIcon } from "lucide-react";
import type { FC } from "react";

/**
 * QuoteBlock — 在用户消息中展示被引用的文本。
 */
export const QuoteBlock: FC<QuoteInfo> = ({ text }) => {
  return (
    <div className="mb-2 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
      <QuoteIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
};

/**
 * SelectionToolbar — 选中 AI 消息文字时弹出的浮动工具栏。
 * 放在 ThreadPrimitive.Root 内、Viewport 同级。
 */
export const SelectionToolbar: FC = () => {
  return (
    <SelectionToolbarPrimitive.Root
      className={cn(
        "bg-popover/95 text-popover-foreground z-50 flex items-center gap-1 rounded-lg border px-2 py-1 shadow-lg backdrop-blur-sm",
        "animate-in fade-in-0 zoom-in-95 duration-150",
      )}
    >
      <SelectionToolbarPrimitive.Quote
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <QuoteIcon className="size-3.5" />
        引用
      </SelectionToolbarPrimitive.Quote>
    </SelectionToolbarPrimitive.Root>
  );
};

/**
 * ComposerQuotePreview — 输入框上方的引用预览条。
 * 只在有引用时渲染，带关闭按钮。
 */
export const ComposerQuotePreview: FC = () => {
  return (
    <ComposerPrimitive.Quote
      className={cn(
        "flex items-start gap-2 rounded-t-lg border-b border-border/60 bg-muted/30 px-3 py-2",
        "animate-in fade-in-0 slide-in-from-bottom-1 duration-150",
      )}
    >
      <QuoteIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <ComposerPrimitive.QuoteText className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground" />
      <ComposerPrimitive.QuoteDismiss
        className={cn(
          "mt-0.5 shrink-0 rounded-sm p-0.5 text-muted-foreground opacity-70",
          "hover:opacity-100 hover:bg-accent transition-opacity",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
      >
        <XIcon className="size-3.5" />
      </ComposerPrimitive.QuoteDismiss>
    </ComposerPrimitive.Quote>
  );
};
