use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

use crate::watcher;

#[derive(Debug, Serialize, Clone)]
pub struct FlatFileEntry {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub modified: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn read_dir_recursive(path: String) -> Result<Vec<FileEntry>, String> {
    read_dir_inner(Path::new(&path), 0).map_err(|e| format!("Failed to read directory: {}", e))
}

fn read_dir_inner(path: &Path, depth: u32) -> Result<Vec<FileEntry>, std::io::Error> {
    if depth > 10 {
        return Ok(vec![]);
    }

    let mut entries = Vec::new();

    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let file_name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files and common non-relevant directories
        if file_name.starts_with('.') || file_name == "node_modules" || file_name == "target" {
            continue;
        }

        let file_path = entry.path();
        let is_dir = file_path.is_dir();

        if is_dir {
            let children = read_dir_inner(&file_path, depth + 1)?;
            // Only include directories that contain .md files (directly or nested)
            if has_md_files(&children) {
                entries.push(FileEntry {
                    name: file_name,
                    path: file_path.to_string_lossy().to_string(),
                    is_dir: true,
                    children: Some(children),
                });
            }
        } else if file_name.ends_with(".md") {
            entries.push(FileEntry {
                name: file_name,
                path: file_path.to_string_lossy().to_string(),
                is_dir: false,
                children: None,
            });
        }
    }

    entries.sort_by(|a, b| {
        // Directories first, then alphabetical
        b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}

fn has_md_files(entries: &[FileEntry]) -> bool {
    entries.iter().any(|e| {
        if e.is_dir {
            e.children.as_ref().map_or(false, |c| has_md_files(c))
        } else {
            true
        }
    })
}

#[tauri::command]
pub fn read_flat_md_files(path: String) -> Result<Vec<FlatFileEntry>, String> {
    let base = Path::new(&path);
    let mut files = Vec::new();
    collect_md_files(base, base, 0, &mut files).map_err(|e| format!("Failed to read directory: {}", e))?;
    files.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(files)
}

fn collect_md_files(
    base: &Path,
    dir: &Path,
    depth: u32,
    out: &mut Vec<FlatFileEntry>,
) -> Result<(), std::io::Error> {
    if depth > 10 {
        return Ok(());
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let file_name = entry.file_name().to_string_lossy().to_string();

        if file_name.starts_with('.') || file_name == "node_modules" || file_name == "target" {
            continue;
        }

        let file_path = entry.path();

        if file_path.is_dir() {
            collect_md_files(base, &file_path, depth + 1, out)?;
        } else if file_name.ends_with(".md") {
            let modified = entry
                .metadata()
                .and_then(|m| m.modified())
                .map(|t| t.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs())
                .unwrap_or(0);

            let relative_path = file_path
                .strip_prefix(base)
                .unwrap_or(&file_path)
                .to_string_lossy()
                .to_string();

            out.push(FlatFileEntry {
                name: file_name,
                path: file_path.to_string_lossy().to_string(),
                relative_path,
                modified,
            });
        }
    }

    Ok(())
}

#[tauri::command]
pub fn watch_directory(app: tauri::AppHandle, path: String) -> Result<(), String> {
    watcher::watch(&app, &path).map_err(|e| format!("Failed to watch directory: {}", e))
}

#[tauri::command]
pub fn unwatch_directory(app: tauri::AppHandle) -> Result<(), String> {
    watcher::unwatch(&app);
    Ok(())
}
