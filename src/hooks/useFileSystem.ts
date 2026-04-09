import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore, FileEntry, FlatFileEntry } from "../stores/appStore";

export function useFileSystem() {
  const { setRootPath, setFileTree, openTab, setFlatViewFolder, setFlatFiles } = useAppStore();

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
      await openFolderByPath(path);
    }
  }

  async function openFolderByPath(path: string) {
    setRootPath(path);
    localStorage.setItem("md-viewer:lastFolder", path);
    const tree: FileEntry[] = await invoke("read_dir_recursive", { path });
    setFileTree(tree);
    await invoke("watch_directory", { path });
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

  async function loadFlatFiles(folderPath: string) {
    const files: FlatFileEntry[] = await invoke("read_flat_md_files", { path: folderPath });
    setFlatViewFolder(folderPath);
    setFlatFiles(files);
  }

  function exitFlatFolder() {
    setFlatViewFolder(null);
    setFlatFiles([]);
  }

  return { openFile, openFolder, openFolderByPath, openFileByPath, saveFile, refreshTree, loadFlatFiles, exitFlatFolder };
}
