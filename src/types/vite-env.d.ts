/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_KAKAO_MAP_APP_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.jsx' {
  import type { ComponentType } from 'react';
  const component: ComponentType<Record<string, unknown>>;
  export default component;
}
