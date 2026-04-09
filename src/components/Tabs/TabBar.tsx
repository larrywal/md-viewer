import { useAppStore } from "../../stores/appStore";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useAppStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer border-r border-gray-200 dark:border-gray-700 min-w-0 max-w-[200px] ${
            tab.id === activeTabId
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="truncate flex-1">
            {tab.dirty && <span className="text-orange-500 mr-0.5">●</span>}
            {tab.name}
          </span>
          <button
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
