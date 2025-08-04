// Translation index file
// Created: 2025-08-03T20:28:38.529Z

import { en } from './languages/en';
import { ar } from './languages/ar';
import { es } from './languages/es';
import { fr } from './languages/fr';
import { de } from './languages/de';

// Export all translations
export const translations = {
  en,
  ar,
  es,
  fr,
  de
};

// Export types
export * from './types';

// Helper function to get translator
export function getTranslator(language: string) {
  return (key: string) => {
    const lang = translations[language as keyof typeof translations];
    return lang?.[key as keyof typeof lang] || key;
  };
}
