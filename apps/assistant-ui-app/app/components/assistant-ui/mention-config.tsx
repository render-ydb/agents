"use client";

import {
  unstable_useMentionAdapter,
  type Unstable_MentionCategory,
} from "@assistant-ui/react";
import {
  BookOpenIcon,
  CodeIcon,
  GlobeIcon,
  MessageCircleIcon,
  PaletteIcon,
  SparklesIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import type { FC } from "react";

/**
 * 定义 AI 角色/技能提及选项。
 *
 * 场景说明：
 * 用户在输入框中输入 @ 后可以选择一个 AI 角色或技能模式，
 * 选中后会在消息中插入一个指令标记（如 :role[翻译助手]{name=translator}），
 * 后端解析后据此切换 system prompt，让 AI 以不同人格/方式回复。
 */
const MENTION_CATEGORIES: Unstable_MentionCategory[] = [
  {
    id: "roles",
    label: "AI 角色",
    items: [
      {
        id: "translator",
        type: "role",
        label: "翻译助手",
        description: "中英互译，保持自然流畅的表达",
        metadata: { icon: "Globe" },
      },
      {
        id: "code-expert",
        type: "role",
        label: "代码专家",
        description: "以资深开发者身份回答，给出最佳实践",
        metadata: { icon: "Code" },
      },
      {
        id: "teacher",
        type: "role",
        label: "教学模式",
        description: "像老师一样由浅入深地讲解概念",
        metadata: { icon: "BookOpen" },
      },
      {
        id: "creative",
        type: "role",
        label: "创意写手",
        description: "文案、故事、营销内容创作",
        metadata: { icon: "Palette" },
      },
    ],
  },
  {
    id: "styles",
    label: "回答风格",
    items: [
      {
        id: "concise",
        type: "style",
        label: "简洁模式",
        description: "尽可能用最少的字精准回答",
        metadata: { icon: "Zap" },
      },
      {
        id: "detailed",
        type: "style",
        label: "详细模式",
        description: "全面展开，包含示例和背景知识",
        metadata: { icon: "BookOpen" },
      },
      {
        id: "chat",
        type: "style",
        label: "闲聊模式",
        description: "轻松对话，像朋友一样交流",
        metadata: { icon: "MessageCircle" },
      },
    ],
  },
];

/** 图标名称 → Lucide 组件映射 */
const ICON_MAP: Record<string, FC<{ className?: string }>> = {
  Globe: GlobeIcon,
  Code: CodeIcon,
  BookOpen: BookOpenIcon,
  Palette: PaletteIcon,
  Zap: ZapIcon,
  MessageCircle: MessageCircleIcon,
  Sparkles: SparklesIcon,
  // 分类图标（按 category id 映射）
  roles: SparklesIcon,
  styles: ZapIcon,
};

/**
 * Hook：返回 mentions 适配器配置，直接传给 <ComposerTriggerPopover>。
 */
export function useMentionConfig() {
  const mention = unstable_useMentionAdapter({
    categories: MENTION_CATEGORIES,
  });

  return {
    ...mention,
    iconMap: ICON_MAP,
    fallbackIcon: SparklesIcon as FC<{ className?: string }>,
  };
}
