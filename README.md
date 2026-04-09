# MD Viewer

A lightweight macOS desktop app for browsing, previewing, and inline-editing Markdown files.

## Features

- **File tree sidebar** — open any folder, browse `.md` files
- **Multi-tab editing** — open several files at once
- **Hybrid editing** — rendered preview by default, double-click to edit, Cmd+S to save
- **Dark/light theme** — follows macOS system preference, toggle with button
- **File watching** — auto-reload when files change externally
- **Keyboard shortcuts** — Cmd+O (open file), Cmd+Shift+O (open folder), Cmd+1-9 (switch tabs), Cmd+W (close tab)

## Tech Stack

- **Tauri v2** — native macOS app (~5 MB)
- **React 18 + TypeScript** — frontend
- **CodeMirror 6** — markdown editor
- **remark/rehype** — GFM rendering
- **react-arborist** — file tree
- **Zustand** — state management
- **Tailwind CSS** — styling

## Development

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

Produces a `.dmg` in `src-tauri/target/release/bundle/dmg/`.
