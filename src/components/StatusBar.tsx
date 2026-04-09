import { useAppStore } from "../stores/appStore";
import { useEditor } from "../hooks/useEditor";

export default function StatusBar() {
  const { editing, cursorLine, cursorCol, darkMode, toggleDarkMode } =
    useAppStore();
  const { activeTab, wordCount } = useEditor();

  return (
    <div className="flex items-center justify-between px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
      <div className="flex items-center gap-4">
        {activeTab && (
          <>
            <span className="truncate max-w-[400px]">{activeTab.path}</span>
            <span>{wordCount.toLocaleString()} words</span>
            {editing && (
              <span>
                Ln {cursorLine}, Col {cursorCol}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {editing && (
          <span className="text-blue-500 font-medium">EDITING</span>
        )}
        {activeTab?.dirty && (
          <span className="text-orange-500 font-medium">UNSAVED</span>
        )}
        <button
          className="hover:text-gray-700 dark:hover:text-gray-200"
          onClick={toggleDarkMode}
          title="Toggle theme"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </div>
  );
}
