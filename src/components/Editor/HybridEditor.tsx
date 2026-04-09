import { useEffect, useRef, useCallback, useMemo } from "react";
import { EditorView, keymap, ViewUpdate } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { useAppStore } from "../../stores/appStore";

interface Props {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onEscape: () => void;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

export default function HybridEditor({ content, onChange, onSave, onEscape }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const { editing, setEditing, setCursor } = useAppStore();

  const renderedHtml = useMemo(() => {
    try {
      return processor.processSync(content).toString();
    } catch {
      return "<p>Error rendering markdown</p>";
    }
  }, [content]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  const createEditor = useCallback(() => {
    if (!editorRef.current) return;

    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString());
      }
      if (update.selectionSet) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        setCursor(line.number, pos - line.from + 1);
      }
    });

    const saveKeymap = keymap.of([
      {
        key: "Mod-s",
        run: () => {
          onSaveRef.current();
          return true;
        },
      },
      {
        key: "Escape",
        run: () => {
          onEscapeRef.current();
          return true;
        },
      },
    ]);

    const theme = EditorView.theme({
      "&": {
        backgroundColor: "transparent",
        height: "100%",
      },
      ".cm-content": {
        fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
        fontSize: "14px",
        padding: "16px",
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
        border: "none",
      },
    });

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        updateListener,
        saveKeymap,
        theme,
        keymap.of([...defaultKeymap, indentWithTab]),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current.focus();
  }, [content, setCursor]);

  useEffect(() => {
    if (editing) {
      createEditor();
    } else {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    }

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [editing, createEditor]);

  const handlePreviewDoubleClick = useCallback(() => {
    setEditing(true);
  }, [setEditing]);

  if (!editing) {
    return (
      <div
        ref={previewRef}
        className="h-full overflow-auto p-6 markdown-preview cursor-text"
        onDoubleClick={handlePreviewDoubleClick}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return <div ref={editorRef} className="h-full overflow-hidden" />;
}
