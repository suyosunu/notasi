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

// Yalnızca pattern.test.ts'in gerçek çekirdekle desen sorgulaması için.
declare module '@strudel/core' {
  export function evalScope(...modules: unknown[]): Promise<unknown>
}
declare module '@strudel/mini' {}
declare module '@strudel/transpiler' {
  export const transpiler: unknown
  export function evaluate(
    code: string,
    transpiler: unknown,
  ): Promise<{
    pattern: {
      queryArc(
        from: number,
        to: number,
      ): {
        hasOnset(): boolean
        whole: { begin: { valueOf(): number } }
        value: { freq: number; s?: string; gain?: number }
      }[]
    }
  }>
}
