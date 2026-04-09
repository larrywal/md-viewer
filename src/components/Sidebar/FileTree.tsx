import { Tree, NodeRendererProps } from "react-arborist";
import { useAppStore, FileEntry } from "../../stores/appStore";
import { useFileSystem } from "../../hooks/useFileSystem";
import { shortenPath } from "../../utils/pathUtils";

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
  isDir: boolean;
  path: string;
}

function toTreeNodes(entries: FileEntry[]): TreeNode[] {
  return entries.map((e) => ({
    id: e.path,
    name: e.name,
    path: e.path,
    isDir: e.is_dir,
    children: e.children ? toTreeNodes(e.children) : undefined,
  }));
}

function Node({ node, style }: NodeRendererProps<TreeNode>) {
  const icon = node.data.isDir
    ? node.isOpen
      ? "\u{1F4C2}"
      : "\u{1F4C1}"
    : "\u{1F4C4}";

  return (
    <div
      style={style}
      className={`flex items-center gap-1.5 px-2 py-0.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
        node.isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
      }`}
      onClick={() => node.isInternal ? node.toggle() : node.select()}
    >
      <span className="text-xs flex-shrink-0">{icon}</span>
      <span className="truncate">{node.data.name}</span>
    </div>
  );
}

export default function FileTree() {
  const { fileTree, rootPath, flatMode, flatViewFolder, flatFiles, toggleFlatMode } = useAppStore();
  const { openFileByPath, loadFlatFiles, exitFlatFolder } = useFileSystem();

  const data = toTreeNodes(fileTree);

  // Extract top-level folders from the file tree
  const topLevelFolders = fileTree.filter((e) => e.is_dir);

  return (
    <div className="file-tree h-full overflow-hidden flex flex-col">
      {rootPath && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="truncate">{rootPath.split("/").pop()}</span>
          <button
            onClick={toggleFlatMode}
            className={`ml-2 flex-shrink-0 px-1.5 py-0.5 rounded text-xs ${
              flatMode
                ? "bg-blue-500 text-white"
                : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            title={flatMode ? "Switch to tree view" : "Switch to flat view"}
          >
            &#x2261;
          </button>
        </div>
      )}

      {!flatMode ? (
        /* Normal tree view */
        <Tree<TreeNode>
          data={data}
          openByDefault={false}
          width="100%"
          height={800}
          indent={16}
          rowHeight={28}
          onActivate={(node) => {
            if (!node.data.isDir) {
              openFileByPath(node.data.path);
            }
          }}
        >
          {Node}
        </Tree>
      ) : !flatViewFolder ? (
        /* Flat mode: folder list */
        <div className="flex-1 overflow-y-auto">
          {topLevelFolders.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-400">No folders found</div>
          ) : (
            topLevelFolders.map((folder) => (
              <div
                key={folder.path}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => loadFlatFiles(folder.path)}
              >
                <span className="text-xs flex-shrink-0">{"\u{1F4C1}"}</span>
                <span className="truncate">{folder.name}</span>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Flat mode: file list within a folder */
        <div className="flex-1 overflow-y-auto">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 w-full text-left border-b border-gray-200 dark:border-gray-700"
            onClick={exitFlatFolder}
          >
            &larr; Back to folders
          </button>
          {flatFiles.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-400">No .md files found</div>
          ) : (
            flatFiles.map((file) => (
              <div
                key={file.path}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => openFileByPath(file.path)}
              >
                <span className="text-xs flex-shrink-0">{"\u{1F4C4}"}</span>
                <span className="truncate">
                  {file.name}{" "}
                  <span className="text-xs text-gray-400">({shortenPath(file.relative_path)})</span>
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
