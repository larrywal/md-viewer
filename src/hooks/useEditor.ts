import { useCallback } from "react";
import { useAppStore } from "../stores/appStore";
import { useFileSystem } from "./useFileSystem";

export function useEditor() {
  const { tabs, activeTabId, updateTabContent, markTabSaved, setEditing } =
    useAppStore();
  const { saveFile } = useFileSystem();

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  const handleContentChange = useCallback(
    (content: string) => {
      if (activeTabId) {
        updateTabContent(activeTabId, content);
      }
    },
    [activeTabId, updateTabContent],
  );

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    await saveFile(activeTab.path, activeTab.content);
    markTabSaved(activeTab.id);
    setEditing(false);
  }, [activeTab, saveFile, markTabSaved, setEditing]);

  const handleEscape = useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  const wordCount = activeTab
    ? activeTab.content
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0;

  return { activeTab, handleContentChange, handleSave, handleEscape, wordCount };
}
