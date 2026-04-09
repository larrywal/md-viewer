import { useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import FileTree from "./components/Sidebar/FileTree";
import TabBar from "./components/Tabs/TabBar";
import HybridEditor from "./components/Editor/HybridEditor";
import StatusBar from "./components/StatusBar";
import { useAppStore } from "./stores/appStore";
import { useFileSystem } from "./hooks/useFileSystem";
import { useEditor } from "./hooks/useEditor";

export default function App() {
  const {
    sidebarOpen,
    sidebarWidth,
    tabs,
    activeTabId,
    darkMode,
    rootPath,
    flatMode,
    flatViewFolder,
    closeTab,
    reopenLastClosed,
    setActiveTab,
    toggleSidebar,
  } = useAppStore();
  const { openFile, openFolder, openFolderByPath, openFileByPath, refreshTree, loadFlatFiles } = useFileSystem();
  const { activeTab, handleContentChange, handleSave, handleEscape } =
    useEditor();

  // Apply dark mode on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Restore last opened folder on mount
  useEffect(() => {
    const lastFolder = localStorage.getItem("md-viewer:lastFolder");
    if (lastFolder) {
      openFolderByPath(lastFolder);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for file changes from watcher
  useEffect(() => {
    const unlisten = listen<string>("file-changed", async (event) => {
      const changedPath = event.payload;
      // Refresh tree if we have a root path
      if (rootPath) {
        await refreshTree(rootPath);
      }
      // Refresh flat view if active
      if (flatMode && flatViewFolder) {
        await loadFlatFiles(flatViewFolder);
      }
      // If the changed file is open in a tab and not dirty, reload it
      const tab = tabs.find((t) => t.path === changedPath && !t.dirty);
      if (tab) {
        openFileByPath(changedPath);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [rootPath, tabs, flatMode, flatViewFolder, refreshTree, openFileByPath, loadFlatFiles]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "o" && !e.shiftKey) {
          e.preventDefault();
          openFile();
        } else if (e.key === "o" && e.shiftKey) {
          e.preventDefault();
          openFolder();
        } else if (e.key === "w") {
          e.preventDefault();
          if (activeTabId) closeTab(activeTabId);
        } else if (e.key === "t" && e.shiftKey) {
          e.preventDefault();
          reopenLastClosed();
        } else if (e.key === "b") {
          e.preventDefault();
          toggleSidebar();
        } else if (e.key >= "1" && e.key <= "9") {
          e.preventDefault();
          const idx = parseInt(e.key) - 1;
          if (idx < tabs.length) {
            setActiveTab(tabs[idx].id);
          }
        }
      }
    },
    [
      openFile,
      openFolder,
      activeTabId,
      closeTab,
      reopenLastClosed,
      toggleSidebar,
      tabs,
      setActiveTab,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-screen">
      {/* Tab Bar */}
      <TabBar />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden"
            style={{ width: sidebarWidth }}
          >
            <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700">
              <button
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={openFolder}
                title="Open Folder (Cmd+Shift+O)"
              >
                Open Folder
              </button>
              <button
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={openFile}
                title="Open File (Cmd+O)"
              >
                Open File
              </button>
            </div>
            <FileTree />
          </div>
        )}

        {/* Editor / Welcome */}
        <div className="flex-1 overflow-hidden">
          {activeTab ? (
            <HybridEditor
              key={activeTab.id}
              content={activeTab.content}
              onChange={handleContentChange}
              onSave={handleSave}
              onEscape={handleEscape}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-4">
              <div className="text-6xl">📝</div>
              <div className="text-lg font-medium">MD Viewer</div>
              <div className="text-sm space-y-1 text-center">
                <p>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    ⌘O
                  </kbd>{" "}
                  Open a file
                </p>
                <p>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    ⌘⇧O
                  </kbd>{" "}
                  Open a folder
                </p>
                <p>Double-click preview to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}
