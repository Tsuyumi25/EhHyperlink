/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />

declare const __APP_VERSION__: string
/** Hash of every source file, injected at build time; part of every cache key. */
declare const __BUILD_HASH__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
