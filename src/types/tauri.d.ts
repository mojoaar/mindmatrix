// Tauri Desktop type declarations
// These are available when running inside a Tauri webview

interface TauriStore {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  save: () => Promise<void>;
}

interface Window {
  __TAURI__?: {
    store?: {
      load: (name: string, opts?: { autoSave?: boolean }) => Promise<TauriStore>;
    };
  };
}
