// === TRANSLATION ANALYZER ===
// Analyzes translation files and provides insights

const fs = require('fs');
const path = require('path');

class TranslationAnalyzer {
  constructor(translationsDir, typesFile, availableLanguages) {
    this.translationsDir = translationsDir;
    this.typesFile = typesFile;
    this.availableLanguages = availableLanguages;
  }

  // Perform complete analysis
  async analyze(usedKeys, allKeys) {
    const analysis = {
      totalUsedKeys: usedKeys.size,
      totalUniqueKeys: allKeys.size,
      keysOnlyInCode: new Set(),
      keysOnlyInFiles: new Set(),
      languageStats: {},
      inconsistentKeys: [],
      allKeys: allKeys
    };

    // Get keys from each language file
    const keysByLanguage = new Map();
    
    for (const lang of this.availableLanguages) {
      const keys = await this.getLanguageKeys(lang.file);
      keysByLanguage.set(lang.code, keys);
      
      // Language statistics
      const missingKeys = Array.from(allKeys).filter(key => !keys.has(key));
      
      analysis.languageStats[lang.code] = {
        total: keys.size,
        missing: missingKeys.length,
        coverage: allKeys.size > 0 ? ((keys.size / allKeys.size) * 100).toFixed(1) : 0,
        keys: keys,
        missingKeys: missingKeys
      };
    }

    // Find keys only in code (not in any language file)
    for (const key of usedKeys) {
      let found = false;
      for (const [lang, keys] of keysByLanguage) {
        if (keys.has(key)) {
          found = true;
          break;
        }
      }
      if (!found) {
        analysis.keysOnlyInCode.add(key);
      }
    }

    // Find keys only in files (not used in code)
    const allFileKeys = new Set();
    for (const [lang, keys] of keysByLanguage) {
      keys.forEach(key => allFileKeys.add(key));
    }
    
    for (const key of allFileKeys) {
      if (!usedKeys.has(key)) {
        analysis.keysOnlyInFiles.add(key);
      }
    }

    // Check for inconsistent keys (keys that exist in some but not all languages)
    const keyFrequency = new Map();
    
    for (const [lang, keys] of keysByLanguage) {
      for (const key of keys) {
        keyFrequency.set(key, (keyFrequency.get(key) || 0) + 1);
      }
    }
    
    for (const [key, count] of keyFrequency) {
      if (count > 0 && count < this.availableLanguages.length) {
        const existsIn = [];
        const missingIn = [];
        
        for (const [lang, keys] of keysByLanguage) {
          if (keys.has(key)) {
            existsIn.push(lang);
          } else {
            missingIn.push(lang);
          }
        }
        
        analysis.inconsistentKeys.push({
          key,
          existsIn,
          missingIn
        });
      }
    }

    return analysis;
  }

  // Get keys from a language file
  async getLanguageKeys(filePath) {
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

  // Get detailed report for a specific language
  getLanguageReport(langCode, analysis) {
    const stats = analysis.languageStats[langCode];
    if (!stats) return null;

    return {
      code: langCode,
      totalKeys: stats.total,
      missingKeys: stats.missing,
      coverage: stats.coverage,
      status: stats.missing === 0 ? '✅ Complete' : `⚠️ Missing ${stats.missing} keys`
    };
  }

  // Get summary statistics
  getSummaryStats(analysis) {
    const languages = Object.keys(analysis.languageStats);
    const fullyTranslated = languages.filter(lang => 
      analysis.languageStats[lang].missing === 0
    );
    
    return {
      totalLanguages: languages.length,
      fullyTranslated: fullyTranslated.length,
      needsWork: languages.length - fullyTranslated.length,
      averageCoverage: languages.reduce((sum, lang) => 
        sum + parseFloat(analysis.languageStats[lang].coverage), 0
      ) / languages.length
    };
  }
}

module.exports = TranslationAnalyzer;