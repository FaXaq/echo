/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  readonly VITE_PUBLIC_POSTHOG_HOST?: string;
}
