import { useState, useCallback } from "react";

export interface HistoryItem {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  thumbnailUrl: string | null;
  language: string;
  method: string;
  transcriptText: string;
  transcriptSrt: string;
  segments: Array<{ start: number; duration: number; text: string }>;
  savedAt: string;
}

const HISTORY_KEY = "pro-transcriber-history";
const MAX_HISTORY = 50;

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);

  const addToHistory = useCallback(
    (item: Omit<HistoryItem, "id" | "savedAt">) => {
      setHistory((prev) => {
        const newItem: HistoryItem = {
          ...item,
          id: crypto.randomUUID(),
          savedAt: new Date().toISOString(),
        };
        const filtered = prev.filter((h) => h.videoId !== item.videoId);
        const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  return { history, addToHistory, clearHistory, removeItem };
}
