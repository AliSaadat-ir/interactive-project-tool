// === TRANSLATION TYPES ===
// Type definitions and utilities for translations

// Translation interface template
const TRANSLATION_INTERFACE = `// Auto-generated translation types
// Last updated: {{DATE}}

export interface Translations {
{{KEYS}}
}

export type TranslationKey = keyof Translations;

// Language codes
export type LanguageCode = {{LANGUAGE_CODES}};

// Translation function type
export type TranslationFunction = (key: TranslationKey) => string;
`;

// Generate TypeScript interface for translations
function generateTranslationInterface(keys, languageCodes) {
  const sortedKeys = Array.from(keys).sort();
  const keyDefinitions = sortedKeys
    .map(key => `  ${key}: string;`)
    .join('\n');
  
  const langCodes = languageCodes
    .map(code => `'${code}'`)
    .join(' | ');
  
  return TRANSLATION_INTERFACE
    .replace('{{DATE}}', new Date().toISOString())
    .replace('{{KEYS}}', keyDefinitions)
    .replace('{{LANGUAGE_CODES}}', langCodes);
}

// Parse translation keys from TypeScript interface
function parseTranslationInterface(content) {
  const keys = new Set();
  
  // Extract interface content
  const interfaceMatch = content.match(/export\s+(?:interface|type)\s+(?:Translations|TranslationKeys)\s*(?:=\s*)?{([^}]+)}/s);
  
  if (interfaceMatch) {
    const interfaceContent = interfaceMatch[1];
    const keyPattern = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*string\s*;?\s*$/gm;
    const matches = interfaceContent.matchAll(keyPattern);
    
    for (const match of matches) {
      keys.add(match[1]);
    }
  }
  
  return keys;
}

// Generate language file content
function generateLanguageFile(languageCode, translations) {
  const sortedKeys = Object.keys(translations).sort();
  const values = sortedKeys.map(key => {
    const value = translations[key].replace(/'/g, "\\'");
    return `  ${key}: '${value}'`;
  });
  
  return `// Translation file for ${languageCode}
// Auto-synchronized: ${new Date().toISOString()}

import { Translations } from '../types';

export const ${languageCode}: Translations = {
${values.join(',\n')}
};
`;
}

// Generate JSON language file
function generateJSONLanguageFile(translations) {
  const sortedKeys = Object.keys(translations).sort();
  const sorted = {};
  
  sortedKeys.forEach(key => {
    sorted[key] = translations[key];
  });
  
  return JSON.stringify(sorted, null, 2);
}

// Validate translation key
function isValidTranslationKey(key) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
}

// Convert camelCase to human readable
function keyToHumanReadable(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

// Convert human readable to camelCase
function humanReadableToKey(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (match, chr) => chr.toUpperCase())
    .replace(/^(.)/, (match, chr) => chr.toLowerCase());
}

module.exports = {
  generateTranslationInterface,
  parseTranslationInterface,
  generateLanguageFile,
  generateJSONLanguageFile,
  isValidTranslationKey,
  keyToHumanReadable,
  humanReadableToKey
};