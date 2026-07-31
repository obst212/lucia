/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEXT_PUBLIC_GAS_URL?: string;
  readonly NEXT_PUBLIC_GAS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
