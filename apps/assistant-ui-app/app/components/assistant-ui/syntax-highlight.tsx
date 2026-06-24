"use client";

import { useEffect, useState, type FC } from "react";
import type { SyntaxHighlighterProps } from "@assistant-ui/react-markdown";
import { createHighlighter, type Highlighter } from "shiki";

/**
 * 预加载的语言列表 — 高频开发语言。
 */
const PRELOADED_LANGS = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "html",
  "css",
  "json",
  "python",
  "bash",
  "shell",
  "markdown",
  "yaml",
  "sql",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
] as const;

/** VS Code Dark+ (dark) + GitHub Light (light) */
const THEMES = {
  dark: "dark-plus",
  light: "github-light",
} as const;

// 单例 highlighter — 全局共享，避免重复初始化
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEMES.dark, THEMES.light],
      langs: [...PRELOADED_LANGS],
    });
  }
  return highlighterPromise;
}

/** 语言别名映射 */
const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  objc: "c",
  rb: "ruby",
};

function normalizeLang(lang: string | undefined): string {
  if (!lang) return "text";
  const lower = lang.toLowerCase().trim();
  return LANG_ALIASES[lower] || lower;
}

/**
 * Shiki 语法高亮组件 — 遵循 assistant-ui 的 SyntaxHighlighterProps 接口。
 * 接收 { components: { Pre, Code }, language, code }，渲染高亮后的 HTML。
 */
export const ShikiSyntaxHighlighter: FC<SyntaxHighlighterProps> = ({
  components: { Pre, Code },
  language,
  code,
}) => {
  const [highlightedHtml, setHighlightedHtml] = useState<string>("");
  const lang = normalizeLang(language);

  useEffect(() => {
    let cancelled = false;

    getHighlighter().then((highlighter) => {
      if (cancelled) return;

      const loadedLangs = highlighter.getLoadedLanguages();
      const targetLang = loadedLangs.includes(lang as any) ? lang : "text";

      const html = highlighter.codeToHtml(code, {
        lang: targetLang,
        themes: THEMES,
        defaultColor: false,
      });

      setHighlightedHtml(html);
    });

    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  // 还没加载完时，用原始文本 fallback
  if (!highlightedHtml) {
    return (
      <Pre>
        <Code>{code}</Code>
      </Pre>
    );
  }

  // shiki 生成的 HTML 自带 <pre><code>...</code></pre> 结构
  // 我们用 Pre 包裹，内部用 dangerouslySetInnerHTML 渲染高亮内容
  return (
    <Pre>
      <code
        className="shiki-highlighted font-mono text-[13px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: extractCodeContent(highlightedHtml) }}
      />
    </Pre>
  );
};

/**
 * 从 shiki 输出的 <pre><code>...</code></pre> 中提取 code 内部的 HTML。
 */
function extractCodeContent(html: string): string {
  // shiki 输出格式: <pre ...><code ...>CONTENT</code></pre>
  const codeMatch = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
  return codeMatch?.[1] ?? html;
}
