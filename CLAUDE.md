# MD Viewer

Lightweight macOS Markdown viewer/editor built with Tauri v2 + React + TypeScript.

## Dev Commands

```bash
npm run tauri dev    # Run in development mode
npm run tauri build  # Build .dmg for macOS
npx tsc --noEmit     # Type check frontend
cargo check          # Check Rust backend (run from src-tauri/)
```

## Architecture

- `src-tauri/` — Rust backend (Tauri v2, file I/O, file watcher)
- `src/` — React frontend (CodeMirror 6 editor, react-arborist file tree, Zustand state)
- State management via Zustand in `src/stores/appStore.ts`
- Tauri IPC commands: `read_file`, `write_file`, `read_dir_recursive`, `watch_directory`, `unwatch_directory`
