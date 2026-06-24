"use client";

import {
  unstable_useSlashCommandAdapter,
  useAssistantRuntime,
  useComposerRuntime,
} from "@assistant-ui/react";
import {
  FileTextIcon,
  ImageIcon,
  LanguagesIcon,
  ListIcon,
  EraserIcon,
  SparklesIcon,
  CodeIcon,
  TableIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import type { FC } from "react";

/**
 * Slash Commands 配置 — 输入 / 触发快捷动作。
 *
 * 与 @mentions 的区别：
 * - @mentions: 在消息中插入指令文本，供 AI 参考
 * - /commands: 立即执行一个动作（如自动发送预设消息、清空对话等）
 */
export function useSlashCommandConfig() {
  const composerRuntime = useComposerRuntime();
  const assistantRuntime = useAssistantRuntime();

  const slash = unstable_useSlashCommandAdapter({
    commands: [
      {
        id: "summarize",
        label: "总结对话",
        description: "让 AI 总结当前对话的要点",
        icon: "FileText",
        execute: () => {
          composerRuntime.setText("请总结以上所有对话的核心要点，用简洁的列表形式呈现。");
          composerRuntime.send();
        },
      },
      {
        id: "translate",
        label: "翻译上条消息",
        description: "将 AI 最后一条回复翻译为英文",
        icon: "Languages",
        execute: () => {
          composerRuntime.setText(
            "请将你上一条回复翻译为英文，保持原意和格式。",
          );
          composerRuntime.send();
        },
      },
      {
        id: "code-only",
        label: "纯代码模式",
        description: "让 AI 只回复代码，不加解释",
        icon: "Code",
        execute: () => {
          composerRuntime.setText(
            "接下来请只回复代码，不需要任何解释说明，直接给出可运行的完整代码。",
          );
          composerRuntime.send();
        },
      },
      {
        id: "table",
        label: "表格形式回答",
        description: "要求 AI 用 Markdown 表格回答",
        icon: "Table",
        execute: () => {
          composerRuntime.setText(
            "请将你的回答整理为 Markdown 表格形式，便于对比和阅读。",
          );
          composerRuntime.send();
        },
      },
      {
        id: "step-by-step",
        label: "分步骤讲解",
        description: "要求 AI 按步骤详细讲解",
        icon: "List",
        execute: () => {
          composerRuntime.setText(
            "请按照清晰的步骤（Step 1, Step 2, ...）重新组织你的回答，每步附带简要说明。",
          );
          composerRuntime.send();
        },
      },
      {
        id: "shorter",
        label: "更简短",
        description: "让 AI 用更精简的语言重写上条回复",
        icon: "Zap",
        execute: () => {
          composerRuntime.setText(
            "你上一条回复太长了，请用 3-5 句话精简地重写，只保留最关键的信息。",
          );
          composerRuntime.send();
        },
      },
      {
        id: "image",
        label: "生成图片",
        description: "根据描述生成图片（输入后跟描述文字）",
        icon: "Image",
        execute: () => {
          const currentText = (composerRuntime.getState().text || "").trim();
          if (currentText) {
            composerRuntime.setText(
              `请根据以下描述生成一张图片：${currentText}`,
            );
            composerRuntime.send();
          } else {
            composerRuntime.setText("请根据以下描述生成一张图片：");
          }
        },
      },
      {
        id: "clear",
        label: "清空对话",
        description: "开始一个新的对话",
        icon: "Eraser",
        execute: () => {
          assistantRuntime.threads.switchToNewThread();
        },
      },
    ],
    removeOnExecute: true, // 选中后移除 /command 文本，不留痕迹
    iconMap: ICON_MAP,
    fallbackIcon: SparklesIcon as FC<{ className?: string }>,
  });

  return slash;
}

/** 图标映射 */
const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  FileText: FileTextIcon,
  Image: ImageIcon,
  Languages: LanguagesIcon,
  Code: CodeIcon,
  Table: TableIcon,
  List: ListIcon,
  Zap: ZapIcon,
  Eraser: EraserIcon,
  Sparkles: SparklesIcon,
};
