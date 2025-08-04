// Auto-generated translation types
// Last updated: 2025-08-03 23:59:02 (Tehran +03:30)

export interface Translations {
  key: string;
  strings: string;
}

export type TranslationKey = keyof Translations;

// Language codes
export type LanguageCode = 'en' | 'ar' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'hi' | 'fa' | 'ur';

// Translation function type
export type TranslationFunction = (key: TranslationKey) => string;
