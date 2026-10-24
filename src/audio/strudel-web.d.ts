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
  // Yerel shakuhachi sesinin kaydı için (bkz. shakuhachi.ts / ShakuhachiHost).
  export function registerSound(
    key: string,
    onTrigger: (time: number, value: any, onended: () => void) => unknown,
    data?: Record<string, unknown>,
  ): void
  export function getADSRValues(params: (number | undefined)[]): number[]
  export function getParamADSR(
    param: AudioParam,
    attack: number,
    decay: number,
    sustain: number,
    release: number,
    min: number,
    max: number,
    begin: number,
    end: number,
    curve?: 'linear' | 'exponential',
  ): void
  export function getVibratoOscillator(
    param: AudioParam,
    value: object,
    t: number,
  ): { stop: (t?: number) => void; nodes: Record<string, AudioNode[]> } | undefined
  export function onceEnded(node: AudioScheduledSourceNode, callback: () => void): void
  export function releaseAudioNode(node: AudioNode): void
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
        /** Olayın süresi (döngü); `clip` varsa onunla çarpılmış (superdough'un tutma süresi). */
        duration: { valueOf(): number }
        value: { freq: number; s?: string; gain?: number }
      }[]
    }
  }>
}
