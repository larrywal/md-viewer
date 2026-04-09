use notify::{recommended_watcher, Event, RecursiveMode, Watcher};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

pub struct WatcherState {
    watcher: Option<Box<dyn Watcher + Send>>,
}

pub fn init(app: AppHandle) {
    app.manage(Mutex::new(WatcherState { watcher: None }));
}

pub fn watch(app: &AppHandle, path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.clone();
    let mut watcher = recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            for path in &event.paths {
                if path.extension().map_or(false, |ext| ext == "md") {
                    let _ = handle.emit(
                        "file-changed",
                        path.to_string_lossy().to_string(),
                    );
                }
            }
        }
    })?;

    watcher.watch(std::path::Path::new(path), RecursiveMode::Recursive)?;

    let state = app.state::<Mutex<WatcherState>>();
    let mut state = state.lock().unwrap();
    state.watcher = Some(Box::new(watcher));

    Ok(())
}

pub fn unwatch(app: &AppHandle) {
    let state = app.state::<Mutex<WatcherState>>();
    let mut state = state.lock().unwrap();
    state.watcher = None;
}
