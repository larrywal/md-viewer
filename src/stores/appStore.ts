import { create } from "zustand";

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  dirty: boolean;
  originalContent: string;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children: FileEntry[] | null;
}

interface AppState {
  // Sidebar
  rootPath: string | null;
  fileTree: FileEntry[];
  sidebarWidth: number;
  sidebarOpen: boolean;

  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  closedTabs: Tab[];

  // Theme
  darkMode: boolean;

  // Editor
  editing: boolean;
  cursorLine: number;
  cursorCol: number;

  // Actions
  setRootPath: (path: string | null) => void;
  setFileTree: (tree: FileEntry[]) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;

  openTab: (path: string, name: string, content: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabSaved: (id: string) => void;
  reopenLastClosed: () => void;

  setEditing: (editing: boolean) => void;
  setCursor: (line: number, col: number) => void;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  rootPath: null,
  fileTree: [],
  sidebarWidth: 240,
  sidebarOpen: true,

  tabs: [],
  activeTabId: null,
  closedTabs: [],

  darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,

  editing: false,
  cursorLine: 1,
  cursorCol: 1,

  setRootPath: (path) => set({ rootPath: path }),
  setFileTree: (tree) => set({ fileTree: tree }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  openTab: (path, name, content) => {
    const { tabs } = get();
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const id = path;
    const newTab: Tab = { id, path, name, content, dirty: false, originalContent: content };
    set({
      tabs: [...tabs, newTab],
      activeTabId: id,
    });
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get();
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const closed = tabs[idx];
    const newTabs = tabs.filter((t) => t.id !== id);
    let newActive = activeTabId;
    if (activeTabId === id) {
      if (newTabs.length > 0) {
        newActive = newTabs[Math.min(idx, newTabs.length - 1)].id;
      } else {
        newActive = null;
      }
    }
    set((s) => ({
      tabs: newTabs,
      activeTabId: newActive,
      closedTabs: [...s.closedTabs, closed],
      editing: false,
    }));
  },

  setActiveTab: (id) => set({ activeTabId: id, editing: false }),

  updateTabContent: (id, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, content, dirty: content !== t.originalContent }
          : t,
      ),
    })),

  markTabSaved: (id) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, dirty: false, originalContent: t.content }
          : t,
      ),
    })),

  reopenLastClosed: () => {
    const { closedTabs } = get();
    if (closedTabs.length === 0) return;
    const tab = closedTabs[closedTabs.length - 1];
    set((s) => ({
      closedTabs: s.closedTabs.slice(0, -1),
      tabs: [...s.tabs, tab],
      activeTabId: tab.id,
    }));
  },

  setEditing: (editing) => set({ editing }),
  setCursor: (line, col) => set({ cursorLine: line, cursorCol: col }),
  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
}));
