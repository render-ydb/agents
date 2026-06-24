import { useAuiState } from "@assistant-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";

export type Suggestion = { prompt: string };

/**
 * 动态跟进建议 hook。
 * 监听 AI 回复完成事件，自动请求后端生成 2-3 个推荐追问。
 */
export function useDynamicSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isRunning = useAuiState((s) => s.thread.isRunning);
  const messages = useAuiState((s) => s.thread.messages);

  // 跟踪上一次状态，检测 isRunning: true → false 的转变
  const prevIsRunningRef = useRef(false);
  // 跟踪上一次请求的消息数，避免重复请求
  const lastRequestedCountRef = useRef(0);
  // 避免竞态：中止过时的请求
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (msgs: typeof messages) => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);

      try {
        // 只发送最近几轮消息的简化版本
        const recentMessages = msgs.slice(-6).map((msg) => ({
          role: msg.role,
          parts: msg.parts
            ?.filter((p) => p.type === "text")
            .map((p) => ({ type: "text" as const, text: (p as { text: string }).text })),
        }));

        const response = await fetch("http://localhost:3001/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: recentMessages }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.warn("[suggestions] fetch failed:", error.message);
          if (!controller.signal.aborted) {
            setSuggestions([]);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const wasRunning = prevIsRunningRef.current;
    prevIsRunningRef.current = isRunning;

    // AI 开始运行时清空旧建议
    if (isRunning && !wasRunning) {
      setSuggestions([]);
      return;
    }

    // AI 完成回复：isRunning 从 true → false，且有消息
    if (wasRunning && !isRunning && messages.length > 0) {
      // 避免对相同消息数重复请求
      if (lastRequestedCountRef.current === messages.length) {
        return;
      }
      lastRequestedCountRef.current = messages.length;
      fetchSuggestions(messages);
    }
  }, [isRunning, messages, fetchSuggestions]);

  // 组件卸载时中止请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { suggestions, isLoading };
}
