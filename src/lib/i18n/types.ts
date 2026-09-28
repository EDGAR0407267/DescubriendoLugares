import type es from './dictionaries/es'

/** Shape of every UI dictionary; Spanish is the reference locale. */
export type Dictionary = typeof es

export type PluralMessages = { one: string; other: string } & Partial<
  Record<'zero' | 'two' | 'few' | 'many', string>
>
