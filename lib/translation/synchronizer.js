// === TRANSLATION SYNCHRONIZER ===
// Ensures all language files and types.ts are in perfect sync

const fs = require('fs');
const path = require('path');
const { print } = require('../core/terminal');

class TranslationSynchronizer {
  constructor(translationsDir, typesFile, availableLanguages) {
    this.translationsDir = translationsDir;
    this.typesFile = typesFile;
    this.availableLanguages = availableLanguages;
    this.masterKeys = new Map(); // key -> { en: value, fallback: value }
  }

  // Extract all keys from all sources
  async extractAllKeys(usedKeys, fallbackTexts) {
    print('🔍 Extracting all translation keys...', 'cyan');
    
    // 1. Get keys from all language files
    const allLanguageKeys = new Set();
    for (const lang of this.availableLanguages) {
      const keys = await this.extractKeysFromFile(lang.file);
      keys.forEach(key => allLanguageKeys.add(key));
    }
    
    // 2. Get keys from types.ts
    const typesKeys = await this.extractKeysFromTypes();
    
    // 3. Combine all sources
    const allKeys = new Set([...allLanguageKeys, ...typesKeys, ...usedKeys]);
    
    // 4. Build master key map with English values and fallbacks
    const enFile = this.availableLanguages.find(l => l.code === 'en');
    if (enFile) {
      const enContent = await this.readLanguageFile(enFile.file);
      for (const key of allKeys) {
        this.masterKeys.set(key, {
          en: enContent[key] || fallbackTexts[key] || this.keyToText(key),
          fallback: fallbackTexts[key] || this.keyToText(key)
        });
      }
    }
    
    return allKeys;
  }

  // Extract keys from a language file
  async extractKeysFromFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const keys = new Set();
      
      if (filePath.endsWith('.json')) {
        const data = JSON.parse(content);
        Object.keys(data).forEach(key => keys.add(key));
      } else {
        // TypeScript/JavaScript files
        const keyPattern = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/gm;
        const matches = content.matchAll(keyPattern);
        for (const match of matches) {
          keys.add(match[1]);
        }
      }
      
      return keys;
    } catch (error) {
      console.error(`Error reading ${filePath}: ${error.message}`);
      return new Set();
    }
  }

  // Extract keys from types.ts
  async extractKeysFromTypes() {
    if (!this.typesFile || !fs.existsSync(this.typesFile)) {
      return new Set();
    }
    
    try {
      const content = fs.readFileSync(this.typesFile, 'utf8');
      const keys = new Set();
      
      // Extract interface Translations content
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
    } catch (error) {
      console.error(`Error reading types file: ${error.message}`);
      return new Set();
    }
  }

  // Read language file content
  async readLanguageFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (filePath.endsWith('.json')) {
        return JSON.parse(content);
      } else {
        // Parse TypeScript/JavaScript file
        const translations = {};
        
        // Extract key-value pairs
        const pattern = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*['"`]([^'"`]*?)['"`],?\s*$/gm;
        const matches = content.matchAll(pattern);
        
        for (const match of matches) {
          translations[match[1]] = match[2];
        }
        
        return translations;
      }
    } catch (error) {
      console.error(`Error reading language file ${filePath}: ${error.message}`);
      return {};
    }
  }

  // Convert camelCase key to readable text
  keyToText(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Sync all files with the master key set
  async syncAllFiles(keysToKeep, translator) {
    print('\n🔄 Synchronizing all translation files...', 'cyan');
    
    // 1. Update types.ts
    if (this.typesFile) {
      await this.updateTypesFile(keysToKeep);
    }
    
    // 2. Update each language file
    for (const lang of this.availableLanguages) {
      await this.syncLanguageFile(lang, keysToKeep, translator);
    }
    
    print('✅ All files synchronized!', 'green');
  }

  // Update types.ts to match exact key set
  async updateTypesFile(keysToKeep) {
    if (!this.typesFile || !fs.existsSync(this.typesFile)) {
      // Create types file if it doesn't exist
      const content = this.generateTypesContent(keysToKeep);
      fs.writeFileSync(this.typesFile, content, 'utf8');
      print('✅ Created types.ts file', 'green');
      return;
    }
    
    try {
      // Rewrite the entire types file with exact keys
      const content = this.generateTypesContent(keysToKeep);
      fs.writeFileSync(this.typesFile, content, 'utf8');
      print(`✅ Updated types.ts with ${keysToKeep.size} keys`, 'green');
    } catch (error) {
      print(`❌ Error updating types file: ${error.message}`, 'red');
    }
  }

  // Generate types.ts content
  generateTypesContent(keys) {
    const sortedKeys = Array.from(keys).sort();
    const keyDefinitions = sortedKeys.map(key => `  ${key}: string;`).join('\n');
    
    return `// Auto-generated translation types
// Last updated: ${new Date().toISOString()}

export interface Translations {
${keyDefinitions}
}

export type TranslationKey = keyof Translations;

// Language codes
export type LanguageCode = 'en' | 'ar' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'hi' | 'fa' | 'ur';

// Translation function type
export type TranslationFunction = (key: TranslationKey) => string;
`;
  }

  // Sync a single language file
  async syncLanguageFile(lang, keysToKeep, translator) {
    print(`\n📝 Syncing ${lang.code}...`, 'yellow');
    
    const currentTranslations = await this.readLanguageFile(lang.file);
    const newTranslations = {};
    const missingKeys = [];
    const updatedKeys = [];
    
    // Check each key that should be kept
    for (const key of keysToKeep) {
      const masterValue = this.masterKeys.get(key);
      
      if (lang.code === 'en') {
        // For English, use the master value
        newTranslations[key] = masterValue.en;
        
        // Check if value changed
        if (currentTranslations[key] && currentTranslations[key] !== masterValue.en) {
          updatedKeys.push({ key, old: currentTranslations[key], new: masterValue.en });
        }
      } else {
        // For other languages
        if (currentTranslations[key]) {
          // Key exists, check if English changed
          const enFile = this.availableLanguages.find(l => l.code === 'en');
          const oldEnValue = await this.getOldEnglishValue(key);
          
          if (oldEnValue && oldEnValue !== masterValue.en) {
            // English changed, need to retranslate
            updatedKeys.push({ key, reason: 'English text changed' });
            missingKeys.push(key);
          } else {
            // Keep existing translation
            newTranslations[key] = currentTranslations[key];
          }
        } else {
          // Missing key
          missingKeys.push(key);
        }
      }
    }
    
    // Report changes
    if (updatedKeys.length > 0 && lang.code === 'en') {
      print(`  📝 Updated ${updatedKeys.length} values in English`, 'cyan');
      updatedKeys.forEach(({ key, old, new: newVal }) => {
        print(`    ${key}: "${old}" → "${newVal}"`, 'dim');
      });
    }
    
    // Translate missing keys
    if (missingKeys.length > 0 && lang.code !== 'en') {
      print(`  🌐 Translating ${missingKeys.length} keys...`, 'cyan');
      
      const translations = await translator.translateKeys(
        missingKeys,
        this.masterKeys,
        'en',
        lang.code
      );
      
      Object.assign(newTranslations, translations);
    } else if (lang.code !== 'en') {
      // Copy missing keys for non-English without translation
      missingKeys.forEach(key => {
        newTranslations[key] = this.masterKeys.get(key).en;
      });
    }
    
    // Write updated file
    await this.writeLanguageFile(lang.file, newTranslations);
    
    const stats = {
      total: keysToKeep.size,
      existing: Object.keys(currentTranslations).length,
      added: missingKeys.length,
      removed: Object.keys(currentTranslations).length - 
               Object.keys(currentTranslations).filter(k => keysToKeep.has(k)).length
    };
    
    print(`  ✅ ${lang.code}: ${stats.total} keys (added: ${stats.added}, removed: ${stats.removed})`, 'green');
  }

  // Get old English value for comparison
  async getOldEnglishValue(key) {
    // This would ideally check git history or a cache
    // For now, return null to trigger retranslation when in doubt
    return null;
  }

  // Write language file with proper formatting
  async writeLanguageFile(filePath, translations) {
    const sortedKeys = Object.keys(translations).sort();
    
    if (filePath.endsWith('.json')) {
      const content = JSON.stringify(
        sortedKeys.reduce((obj, key) => {
          obj[key] = translations[key];
          return obj;
        }, {}),
        null,
        2
      );
      fs.writeFileSync(filePath, content, 'utf8');
    } else {
      // TypeScript/JavaScript file
      const lang = path.basename(filePath, path.extname(filePath));
      const values = sortedKeys.map(key => {
        const value = translations[key].replace(/'/g, "\\'");
        return `  ${key}: '${value}'`;
      });
      
      const content = `// Translation file for ${lang}
// Auto-synchronized: ${new Date().toISOString()}

import { Translations } from '../types';

export const ${lang}: Translations = {
${values.join(',\n')}
};
`;
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  // Check consistency across all files
  async checkConsistency() {
    print('\n🔍 Checking translation consistency...', 'cyan');
    
    const issues = [];
    const keysByFile = new Map();
    
    // Get keys from each file
    for (const lang of this.availableLanguages) {
      const keys = await this.extractKeysFromFile(lang.file);
      keysByFile.set(lang.code, keys);
    }
    
    // Get types keys
    const typesKeys = await this.extractKeysFromTypes();
    
    // Check for inconsistencies
    const allKeys = new Set();
    keysByFile.forEach(keys => keys.forEach(k => allKeys.add(k)));
    
    // Check each language
    for (const [langCode, keys] of keysByFile) {
      const missing = Array.from(allKeys).filter(k => !keys.has(k));
      const extra = Array.from(keys).filter(k => !allKeys.has(k));
      
      if (missing.length > 0) {
        issues.push(`${langCode}: Missing ${missing.length} keys`);
      }
      if (extra.length > 0) {
        issues.push(`${langCode}: Has ${extra.length} extra keys`);
      }
    }
    
    // Check types file
    const typesMissing = Array.from(allKeys).filter(k => !typesKeys.has(k));
    const typesExtra = Array.from(typesKeys).filter(k => !allKeys.has(k));
    
    if (typesMissing.length > 0) {
      issues.push(`types.ts: Missing ${typesMissing.length} keys`);
    }
    if (typesExtra.length > 0) {
      issues.push(`types.ts: Has ${typesExtra.length} extra keys`);
    }
    
    if (issues.length === 0) {
      print('✅ All files are in perfect sync!', 'green');
      print(`   Total keys: ${allKeys.size}`, 'dim');
    } else {
      print('⚠️  Consistency issues found:', 'yellow');
      issues.forEach(issue => print(`   - ${issue}`, 'yellow'));
    }
    
    return issues.length === 0;
  }
}

module.exports = TranslationSynchronizer;