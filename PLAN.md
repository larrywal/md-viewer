# MD Viewer — Project Plan

## Vision

A desktop app (+ optional CLI) for browsing, previewing, and inline-editing Markdown files from both your local Mac filesystem and GitHub repositories. Claude Code can launch it directly to a specific file.

---

## Technology Stack Recommendation

### Framework: **Tauri v2 + React + TypeScript**

After evaluating Electron, Tauri, SwiftUI, and VS Code extensions, **Tauri v2** is the clear winner for this project:

| Factor | Tauri v2 | Electron | SwiftUI | VS Code Ext |
|---|---|---|---|---|
| Bundle size | ~5-10 MB | ~150+ MB | Native | N/A |
| Memory usage | ~30-40 MB | ~200-300 MB | Native | Shared |
| Startup time | <0.5s | 1-2s | Fast | Fast |
| File system access | Native (Rust) | Node.js | Native | Sandboxed |
| CLI integration | Easy (Rust) | Possible | Possible | Built-in |
| GitHub API | JS frontend | JS | URLSession | JS |
| Cross-platform | Yes | Yes | Mac only | Yes |
| Learning curve | Moderate | Low | High | Low |

**Why Tauri over Electron:** 96% smaller bundles, 5-10x less memory, faster startup, native Rust backend for file operations. Multiple developers have shipped Tauri markdown editors successfully — it's a proven pattern now.

**Why Tauri over SwiftUI:** Cross-platform potential, massive web ecosystem for markdown rendering, easier GitHub integration. SwiftUI would be more work for less flexibility.

**Why not a VS Code extension:** You want a standalone experience with your own UX, not constrained by VS Code's extension API.

### Key Libraries

| Component | Library | Why |
|---|---|---|
| Markdown rendering | **unified/remark + rehype** | Best GFM support, plugin ecosystem, same engine GitHub uses |
| Editor | **CodeMirror 6** with markdown extensions | Hybrid editing (rendered preview for unfocused blocks, raw markdown on focus) — exactly the UX you described |
| File tree | **React Arborist** | Built for VS Code-like file trees, virtualized for large dirs, drag/drop support |
| GitHub integration | **Octokit REST** (`@octokit/rest`) | Official GitHub SDK, tree API for recursive repo browsing |
| Styling | **Tailwind CSS** | Fast iteration, easy dark/light mode |
| State management | **Zustand** | Lightweight, perfect for this scale |

### The "Hybrid Editing" UX (Core Innovation)

CodeMirror 6 has a plugin called **codemirror-rich-markdoc** and a newer **hybrid markdown editing** extension (Jan 2026) that does exactly what you described:
- Unfocused blocks render as rich preview (headings, bold, links, images, tables)
- When you click/focus a block, it switches to raw markdown for editing
- When you move away, it re-renders

This eliminates the need for a separate "edit mode" — the entire document is always previewable, and you just click anywhere to edit.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Tauri Window                     │
│  ┌──────────┐  ┌──────────────────────────────┐  │
│  │           │  │                              │  │
│  │  Sidebar  │  │    Main Content Area         │  │
│  │           │  │                              │  │
│  │  ┌──────┐ │  │  Preview Mode (default):     │  │
│  │  │Local │ │  │  - Rendered markdown          │  │
│  │  │Files │ │  │  - Double-click → edit block  │  │
│  │  └──────┘ │  │                              │  │
│  │  ┌──────┐ │  │  Edit Mode (per-block):      │  │
│  │  │GitHub│ │  │  - CodeMirror 6 raw editor   │  │
│  │  │Repos │ │  │  - Esc/button → back to      │  │
│  │  └──────┘ │  │    preview                   │  │
│  │           │  │                              │  │
│  └──────────┘  └──────────────────────────────┘  │
│  ┌────────────────────────────────────────────┐  │
│  │  Status Bar: file path, word count, etc.   │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Backend (Rust / Tauri)

- **File system operations**: Read/write files, watch for changes, directory listing
- **CLI entry point**: `mdview <file-path>` opens the app to that file
- **Deep link handler**: `mdview://open?file=/path/to/file.md`
- **Auto-save**: Debounced writes on edit

### Frontend (React + TypeScript)

- **Sidebar**: Tabbed between Local / GitHub
  - Local: React Arborist tree, filtered to show `.md` files (with option to show all)
  - GitHub: Auth via GitHub token, repo picker, then tree view of repo contents
- **Main area**: CodeMirror 6 with hybrid markdown rendering
- **Toolbar**: Save, toggle edit/preview, theme switcher, search

---

## Development Phases

### Phase 1: Foundation (MVP)
> Goal: Open a local markdown file and view it rendered

1. Initialize Tauri v2 + React + TypeScript project
2. Set up CodeMirror 6 with basic markdown support
3. Implement file open dialog (Tauri native)
4. Render markdown with remark/rehype (GFM support)
5. Basic window chrome and layout (sidebar + main area)

### Phase 2: Local File Tree
> Goal: Browse and open local files from sidebar

6. Integrate React Arborist for file tree
7. Tauri Rust backend: recursive directory reading with `.md` filter
8. File watcher for live reload when files change externally
9. Remember last-opened directory (persist in app config)

### Phase 3: Hybrid Editing
> Goal: Double-click to edit, seamless preview ↔ edit

10. Integrate CodeMirror 6 hybrid markdown plugin
11. Double-click on rendered block → switch to raw editor at that position
12. `Escape` or save button → re-render preview
13. `Cmd+S` to save file via Tauri backend
14. Auto-save with debounce (configurable)

### Phase 4: GitHub Integration
> Goal: Browse and view markdown files from GitHub repos

15. GitHub OAuth or personal access token setup flow
16. Repo browser (list user's repos + search)
17. Browse repo file tree via GitHub Trees API (recursive)
18. Read-only markdown preview for GitHub files
19. (Stretch) Edit and commit back via GitHub Contents API

### Phase 5: CLI Integration
> Goal: `mdview path/to/file.md` from terminal

20. Rust CLI argument parsing (`clap`)
21. Single-instance check — if app is running, send file path via IPC
22. If not running, launch app and open to file
23. Register as handler for `.md` files on macOS (optional)
24. Claude Code integration: output `mdview` command that opens to a specific file

### Phase 6: Polish
> Goal: Production-quality experience

25. Dark/light theme with system preference detection
26. Search within file (`Cmd+F`)
27. Search across files in directory
28. Recent files list
29. Split view option (side-by-side raw + preview)
30. Keyboard shortcuts panel
31. App icon, DMG packaging, auto-updater

---

## Claude Code Integration

Add to your `CLAUDE.md` or create a shell alias:

```bash
# Claude Code can run this to show you a markdown file
alias mdview="/Applications/MD\ Viewer.app/Contents/MacOS/md-viewer"

# Example: Claude generates a report and opens it
mdview /path/to/report.md
```

Or as a Claude Code hook that auto-opens `.md` files after creation.

---

## File Structure

```
md-viewer/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Entry point, CLI parsing
│   │   ├── commands.rs # Tauri IPC commands
│   │   ├── fs.rs       # File system operations
│   │   └── watcher.rs  # File change watcher
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                # React frontend
│   ├── App.tsx
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── FileTree.tsx
│   │   │   ├── GitHubBrowser.tsx
│   │   │   └── SidebarTabs.tsx
│   │   ├── Editor/
│   │   │   ├── MarkdownViewer.tsx
│   │   │   ├── HybridEditor.tsx
│   │   │   └── Toolbar.tsx
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useFileSystem.ts
│   │   ├── useGitHub.ts
│   │   └── useEditor.ts
│   ├── stores/
│   │   └── appStore.ts  # Zustand
│   └── styles/
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── CLAUDE.md
```

---

## Open Questions for You

1. **GitHub auth**: Personal access token (simpler) or full OAuth flow (smoother UX)?
2. **Edit GitHub files**: Should editing/committing to GitHub be in scope, or just read-only browsing?
3. **Cross-platform**: Mac-only for now, or design for Windows/Linux from the start?
4. **Tabs**: Do you want multi-tab support (open several files at once)?
5. **AI features**: Any interest in Claude-powered features (summarize, explain, rewrite sections)?

---

## Research Sources

- [Tauri vs Electron 2026 Comparison](https://tech-insider.org/tauri-vs-electron-2026/)
- [Electron vs Tauri — DoltHub](https://www.dolthub.com/blog/2025-11-13-electron-vs-tauri/)
- [I built a Markdown editor with Tauri](https://dev.to/ukash/i-built-a-markdown-editor-with-tauri-heres-what-i-learned-4f5l)
- [Tauri+Svelte Markdown Editor — Rust Forum](https://users.rust-lang.org/t/an-extremely-elegant-open-source-ai-markdown-editor-tauri-svelte/138163)
- [MDXEditor — Rich Text Markdown for React](https://mdxeditor.dev/)
- [CodeMirror Hybrid Markdown Editing](https://discuss.codemirror.net/t/hybrid-markdown-editing-preview-for-unfocused-lines-raw-for-active-line/9660)
- [codemirror-rich-markdoc plugin](https://github.com/segphault/codemirror-rich-markdoc)
- [React Arborist — Complete Tree View](https://github.com/brimdata/react-arborist)
- [React Complex Tree](https://github.com/lukasbach/react-complex-tree)
- [Mark Text — Open Source Markdown Editor](https://github.com/marktext/marktext)
- [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor)
- [Octokit REST API for repo contents](https://octokit.github.io/rest.js/)
- [CodeMirror Live Markdown Demo](https://codemirror-live-markdown.vercel.app/)
