/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENCLAW_API_KEY: string;
  readonly VITE_OPENCLAW_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
