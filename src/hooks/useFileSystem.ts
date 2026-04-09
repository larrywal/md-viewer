import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore, FileEntry } from "../stores/appStore";

export function useFileSystem() {
  const { setRootPath, setFileTree, openTab } = useAppStore();

  async function openFile() {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });

    if (selected) {
      const path = selected as string;
      const content: string = await invoke("read_file", { path });
      const name = path.split("/").pop() || path;
      openTab(path, name, content);
    }
  }

  async function openFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
    });

    if (selected) {
      const path = selected as string;
      setRootPath(path);
      const tree: FileEntry[] = await invoke("read_dir_recursive", { path });
      setFileTree(tree);

      // Start watching the directory
      await invoke("watch_directory", { path });
    }
  }

  async function openFileByPath(path: string) {
    const content: string = await invoke("read_file", { path });
    const name = path.split("/").pop() || path;
    openTab(path, name, content);
  }

  async function saveFile(path: string, content: string) {
    await invoke("write_file", { path, content });
  }

  async function refreshTree(path: string) {
    const tree: FileEntry[] = await invoke("read_dir_recursive", { path });
    setFileTree(tree);
  }

  return { openFile, openFolder, openFileByPath, saveFile, refreshTree };
}
