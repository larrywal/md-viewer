import { Tree, NodeRendererProps } from "react-arborist";
import { useAppStore, FileEntry } from "../../stores/appStore";
import { useFileSystem } from "../../hooks/useFileSystem";

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
      ? "📂"
      : "📁"
    : "📄";

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
  const { fileTree, rootPath } = useAppStore();
  const { openFileByPath } = useFileSystem();

  const data = toTreeNodes(fileTree);

  return (
    <div className="file-tree h-full overflow-hidden">
      {rootPath && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate border-b border-gray-200 dark:border-gray-700">
          {rootPath.split("/").pop()}
        </div>
      )}
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
    </div>
  );
}
