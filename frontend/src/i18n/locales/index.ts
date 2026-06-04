import { de } from './de'
import { en } from './en'
import type { Language } from '../types'

export const translations = { de, en } satisfies Record<Language, typeof de>
