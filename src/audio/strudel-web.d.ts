// @strudel/web (AGPL) ships without type declarations; only what we use is declared.
declare module '@strudel/web' {
  export interface StrudelOptions {
    prebake?: () => unknown
    miniAllStrings?: boolean
  }
  export function initStrudel(options?: StrudelOptions): Promise<unknown>
  export function evaluate(code: string, autoplay?: boolean): Promise<unknown>
  export function hush(): void
  export function getAudioContext(): AudioContext
}
