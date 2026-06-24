"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Download, ImageIcon, Loader2, RefreshCw, AlertCircle } from "lucide-react";

type ImageGenArgs = {
  prompt: string;
};

type ImageGenResult = {
  image: string;
  mimeType: string;
  revisedPrompt?: string;
  error?: string;
};

export const ImageGenToolUI = makeAssistantToolUI<ImageGenArgs, ImageGenResult>({
  toolName: "generate_image",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return <ImageGenLoading prompt={args.prompt} />;
    }

    if (status.type === "complete" && result) {
      if (result.error) {
        return <ImageGenError message={result.error} />;
      }
      return (
        <ImageGenComplete
          image={result.image}
          prompt={args.prompt}
          revisedPrompt={result.revisedPrompt}
        />
      );
    }

    if (status.type === "incomplete") {
      return <ImageGenError message="Image generation was interrupted" />;
    }

    return null;
  },
});

function ImageGenLoading({ prompt }: { prompt: string }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      {/* Shimmer placeholder */}
      <div className="relative aspect-square max-w-sm overflow-hidden bg-muted">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/5 to-muted" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
          <p className="text-center text-sm text-muted-foreground">
            正在生成图片...
          </p>
        </div>
      </div>
      {/* Prompt info */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="line-clamp-1 text-xs text-muted-foreground">{prompt}</p>
      </div>
    </div>
  );
}

function ImageGenComplete({
  image,
  prompt,
  revisedPrompt,
}: {
  image: string;
  prompt: string;
  revisedPrompt?: string;
}) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = image;
    link.download = `generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="my-3 inline-block max-w-lg overflow-hidden rounded-xl border border-border bg-muted/30">
      {/* Image */}
      <div className="relative">
        <img
          src={image}
          alt={revisedPrompt || prompt}
          className="block w-full rounded-t-xl"
          loading="lazy"
        />
      </div>
      {/* Actions & info */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-2 overflow-hidden">
          <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {revisedPrompt || prompt}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="ml-2 flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="下载图片"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function ImageGenError({ message }: { message: string }) {
  return (
    <div className="my-3 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
      <div>
        <p className="text-sm font-medium text-destructive">图片生成失败</p>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
