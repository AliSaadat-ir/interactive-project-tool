// === ENHANCED TRANSLATION MANAGER ===
// lib/translation/manager.js

const fs = require('fs');
const path = require('path');
const TranslationSynchronizer = require('./synchronizer');
const TranslationScanner = require('./scanner');
const TranslationAnalyzer = require('./analyzer');
const TranslationTranslator = require('./translator');
const TranslationReporter = require('./reporter');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, clearScreen, waitForEnter, askQuestion } = require('../core/terminal');
const { generateLanguageFile, generateJSONLanguageFile, parseTranslationInterface, generateTranslationInterface } = require('./types');

// Enhanced confirmation with arrow selection
async function askConfirmMenu(question, defaultYes = true) {
  const menu = new SimpleMenu(
    question,
    [
      { name: defaultYes ? '✓ Yes (default)' : 'Yes', value: true },
      { name: !defaultYes ? '✗ No (default)' : 'No', value: false }
    ]
  );
  
  const result = await menu.show();
  return result.value;
}

// Multi-select menu for language selection
class LanguageSelectMenu extends SimpleMenu {
  constructor(title, options) {
    super(title, options);
    this.selected = new Set(['en']); // English is always selected
    this.selectMode = true;
  }

  async show() {
    return new Promise((resolve) => {
      this.render();

      // Set up key handling
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleKeypress = (key) => {
        if (key === '\u0003') { // Ctrl+C
          process.exit();
        } else if (key === '\r' || key === '\n') { // Enter
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handleKeypress);
          resolve(Array.from(this.selected));
        } else if (key === '\u001b[A') { // Up arrow
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
        } else if (key === '\u001b[B') { // Down arrow
          this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
          this.render();
        } else if (key === ' ') { // Space to toggle selection
          const currentOption = this.options[this.selectedIndex];
          // Don't allow deselecting English
          if (currentOption.value !== 'en') {
            if (this.selected.has(currentOption.value)) {
              this.selected.delete(currentOption.value);
            } else {
              this.selected.add(currentOption.value);
            }
            this.render();
          }
        }
      };

      process.stdin.on('data', handleKeypress);
    });
  }

  render() {
    clearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.options.forEach((option, index) => {
      const isSelected = this.selected.has(option.value);
      const checkbox = isSelected ? '[✓]' : '[ ]';
      const isEnglish = option.value === 'en';
      
      if (index === this.selectedIndex) {
        print(`  ▶ ${checkbox} ${option.name}${isEnglish ? ' (required)' : ''}`, 'green');
      } else {
        print(`    ${checkbox} ${option.name}${isEnglish ? ' (required)' : ''}`, isSelected ? 'cyan' : 'white');
      }
    });

    console.log();
    print(`Selected: ${this.selected.size} language(s)`, 'cyan');
    console.log();
    print('Use ↑↓ arrows to navigate, Space to select/deselect', 'dim');
    print('Press Enter to confirm', 'dim');
    print('Note: English is required and cannot be deselected', 'dim');
  }
}

class TranslationManager {
  constructor(env, settings, openFileCallback) {
    this.translationsDir = null;
    this.typesFile = null;
    this.projectRoot = process.cwd();
    this.availableLanguages = [];
    this.env = env || {};
    this.settings = settings || { defaultTranslationApi: 'auto', autoOpenReports: true };
    this.openFileCallback = openFileCallback; // Function to open files with IDE
    this.lastScanResult = null; // Store last scan result
    
    // Initialize sub-modules
    this.scanner = new TranslationScanner(this.projectRoot);
    this.analyzer = null; // Will be initialized after detection
    this.synchronizer = null;
    this.translator = null;
    this.reporter = new TranslationReporter();
  }

  // Main management flow
  async manage() {
    // Setup translation API with user's preferred setting
    this.translator = new TranslationTranslator(this.env);
    await this.translator.setupApi(this.settings.defaultTranslationApi);
    
    // Check if project uses translations but has no structure
    const hasTranslationUsage = await this.checkTranslationUsage();
    const hasTranslationStructure = await this.detectTranslationStructure();
    
    if (hasTranslationUsage && !hasTranslationStructure) {
      printHeader();
      print('🔍 Translation usage detected but no translation structure found!', 'yellow');
      print('Your project uses t.strings but has no translation files.', 'dim');
      console.log();
      
      const createStructure = await askConfirmMenu('Would you like to create a translation structure?');
      
      if (createStructure) {
        await this.createTranslationStructure();
        // Re-detect after creation
        await this.detectTranslationStructure();
      } else {
        print('\n⚠️  Cannot manage translations without a structure', 'yellow');
        await waitForEnter();
        return;
      }
    } else if (!hasTranslationStructure) {
      print('\n⚠️  Could not detect translation structure', 'yellow');
      const menu = new SimpleMenu(
        'How would you like to proceed?',
        [
          { name: '🏗️  Create translation structure', value: 'create' },
          { name: '📂 Select translation directory manually', value: 'manual' },
          { name: '❌ Cancel', value: 'cancel' }
        ]
      );
      
      const choice = await menu.show();
      if (choice.value === 'cancel') return;
      
      if (choice.value === 'create') {
        await this.createTranslationStructure();
        await this.detectTranslationStructure();
      } else {
        await this.selectTranslationDirectory();
      }
    }
    
    // Initialize modules with detected structure
    this.analyzer = new TranslationAnalyzer(
      this.translationsDir,
      this.typesFile,
      this.availableLanguages
    );
    
    this.synchronizer = new TranslationSynchronizer(
      this.translationsDir,
      this.typesFile,
      this.availableLanguages
    );
    
    // Show translation management menu
    await this.showTranslationMenu();
  }

  // Check if project uses translations
  async checkTranslationUsage() {
    const scanResult = await this.scanner.scanProject();
    return scanResult.usedKeys.size > 0;
  }

  // NEW: Create translation structure from scratch
  async createTranslationStructure() {
    printHeader();
    print('🏗️  CREATE TRANSLATION STRUCTURE', 'yellow');
    console.log();
    
    // Select languages
    print('Select languages to support:', 'cyan');
    console.log();
    
    const allLanguages = [
      { name: 'English', value: 'en' },
      { name: 'Arabic (العربية)', value: 'ar' },
      { name: 'Spanish (Español)', value: 'es' },
      { name: 'French (Français)', value: 'fr' },
      { name: 'German (Deutsch)', value: 'de' },
      { name: 'Italian (Italiano)', value: 'it' },
      { name: 'Portuguese (Português)', value: 'pt' },
      { name: 'Russian (Русский)', value: 'ru' },
      { name: 'Chinese (中文)', value: 'zh' },
      { name: 'Japanese (日本語)', value: 'ja' },
      { name: 'Korean (한국어)', value: 'ko' },
      { name: 'Hindi (हिन्दी)', value: 'hi' },
      { name: 'Persian/Farsi (فارسی)', value: 'fa' },
      { name: 'Urdu (اردو)', value: 'ur' }
    ];
    
    const languageMenu = new LanguageSelectMenu(
      'Select languages (Space to toggle, Enter to confirm):',
      allLanguages
    );
    
    const selectedLanguages = await languageMenu.show();
    
    if (selectedLanguages.length === 0) {
      print('\n❌ No languages selected', 'red');
      await waitForEnter();
      return;
    }
    
    // Select location
    printHeader();
    print(`📋 Selected ${selectedLanguages.length} language(s)`, 'green');
    selectedLanguages.forEach(lang => {
      const langInfo = allLanguages.find(l => l.value === lang);
      print(`  ✓ ${langInfo.name}`, 'cyan');
    });
    console.log();
    
    // Choose directory location
    const locationMenu = new SimpleMenu(
      'Where should the translation files be created?',
      [
        { name: '📁 lib/translations (recommended)', value: 'lib/translations' },
        { name: '📁 src/translations', value: 'src/translations' },
        { name: '📁 translations (root)', value: 'translations' },
        { name: '📁 locales', value: 'locales' },
        { name: '📁 i18n', value: 'i18n' },
        { name: '✏️  Custom location', value: 'custom' }
      ]
    );
    
    const locationChoice = await locationMenu.show();
    
    let translationsPath;
    if (locationChoice.value === 'custom') {
      const customPath = await askQuestion('Enter custom path (e.g., src/i18n): ');
      translationsPath = customPath.trim() || 'translations';
    } else {
      translationsPath = locationChoice.value;
    }
    
    // Confirm creation
    printHeader();
    print('📋 Ready to create translation structure', 'cyan');
    console.log();
    print(`📍 Location: ${translationsPath}/`, 'white');
    print(`🌐 Languages: ${selectedLanguages.join(', ')}`, 'white');
    console.log();
    print('Will create:', 'yellow');
    print(`  ${translationsPath}/`, 'dim');
    print(`  ├── index.ts`, 'dim');
    print(`  ├── languages/`, 'dim');
    selectedLanguages.forEach((lang, index) => {
      const isLast = index === selectedLanguages.length - 1;
      print(`  │   ${isLast ? '└' : '├'}── ${lang}.ts`, 'dim');
    });
    print(`  └── types.ts`, 'dim');
    console.log();
    
    const confirm = await askConfirmMenu('Create this structure?');
    
    if (!confirm) {
      print('\n❌ Creation cancelled', 'yellow');
      await waitForEnter();
      return;
    }
    
    // Create the structure
    try {
      const fullPath = path.join(this.projectRoot, translationsPath);
      const languagesPath = path.join(fullPath, 'languages');
      
      // Create directories
      fs.mkdirSync(languagesPath, { recursive: true });
      
      // Scan for existing keys if any
      const scanResult = await this.scanner.scanProject();
      const keys = scanResult.usedKeys;
      
      // Create types.ts
      const typesContent = this.generateInitialTypes(keys, selectedLanguages);
      fs.writeFileSync(path.join(fullPath, 'types.ts'), typesContent, 'utf8');
      
      // Create language files
      for (const lang of selectedLanguages) {
        const translations = {};
        
        // For English, use fallback texts
        if (lang === 'en' && keys.size > 0) {
          for (const key of keys) {
            translations[key] = scanResult.fallbackTexts[key] || this.keyToText(key);
          }
        } else if (keys.size > 0) {
          // For other languages, create empty translations
          for (const key of keys) {
            translations[key] = '';
          }
        }
        
        const content = this.generateLanguageFileContent(lang, translations);
        fs.writeFileSync(path.join(languagesPath, `${lang}.ts`), content, 'utf8');
      }
      
      // Create index.ts
      const indexContent = this.generateIndexFile(selectedLanguages);
      fs.writeFileSync(path.join(fullPath, 'index.ts'), indexContent, 'utf8');
      
      print('\n✅ Translation structure created successfully!', 'green');
      print(`📁 Location: ${fullPath}`, 'cyan');
      
      if (keys.size > 0) {
        print(`📝 Found and added ${keys.size} translation keys`, 'cyan');
        
        if (selectedLanguages.length > 1) {
          print('\n💡 Next steps:', 'yellow');
          print('1. Run "Full Synchronization" to translate all keys', 'dim');
          print('2. Review and adjust translations as needed', 'dim');
        }
      }
      
      await waitForEnter();
      
    } catch (error) {
      print(`\n❌ Failed to create structure: ${error.message}`, 'red');
      await waitForEnter();
    }
  }

  // Generate initial types.ts content
  generateInitialTypes(keys, languages) {
    const sortedKeys = Array.from(keys).sort();
    const keyDefinitions = sortedKeys.length > 0 
      ? sortedKeys.map(key => `  ${key}: string;`).join('\n')
      : '  // Add your translation keys here\n  // example: string;';
    
    const langCodes = languages.map(l => `'${l}'`).join(' | ');
    
    return `// Auto-generated translation types
// Created: ${new Date().toISOString()}

export interface Translations {
${keyDefinitions}
}

export type TranslationKey = keyof Translations;

// Language codes
export type LanguageCode = ${langCodes};

// Translation function type
export type TranslationFunction = (key: TranslationKey) => string;
`;
  }

  // Generate language file content
  generateLanguageFileContent(lang, translations) {
    const sortedKeys = Object.keys(translations).sort();
    
    if (sortedKeys.length === 0) {
      return `// Translation file for ${lang}
// Created: ${new Date().toISOString()}

import { Translations } from '../types';

export const ${lang}: Translations = {
  // Add your translations here
  // example: 'Example text',
};
`;
    }
    
    const values = sortedKeys.map(key => {
      const value = translations[key].replace(/'/g, "\\'");
      return `  ${key}: '${value}'`;
    });
    
    return `// Translation file for ${lang}
// Created: ${new Date().toISOString()}

import { Translations } from '../types';

export const ${lang}: Translations = {
${values.join(',\n')}
};
`;
  }

  // Generate index.ts file
  generateIndexFile(languages) {
    const imports = languages.map(lang => `import { ${lang} } from './languages/${lang}';`).join('\n');
    const exports = languages.map(lang => `  ${lang}`).join(',\n');
    
    return `// Translation index file
// Created: ${new Date().toISOString()}

${imports}

// Export all translations
export const translations = {
${exports}
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
`;
  }

  // Show translation management menu
  async showTranslationMenu() {
    while (true) {
      printHeader();
      print('🌐 TRANSLATION MANAGEMENT', 'yellow');
      console.log();
      
      if (this.lastScanResult) {
        print('✅ Project scanned', 'green');
        print(`   Found ${this.lastScanResult.usedKeys.size} translation keys`, 'dim');
        
        // Check if there are unresolved conflicts
        if (this.scanner.hasConflicts()) {
          print(`   ⚠️  ${this.scanner.getConflictCount()} unresolved conflicts`, 'yellow');
        }
        
        console.log();
      } else {
        print('⚠️  Project not scanned yet', 'yellow');
        print('   Run scan first to enable all features', 'dim');
        console.log();
      }
      
      const menuOptions = [
        { name: '🔍 Scan Project for Translations', value: 'scan' }
      ];
      
      // Only show other options if scan has been performed
      if (this.lastScanResult) {
        // Show conflict resolution if there are conflicts
        if (this.scanner.hasConflicts()) {
          menuOptions.push({ 
            name: `🔧 Resolve Conflicts (${this.scanner.getConflictCount()} remaining)`, 
            value: 'resolve_conflicts' 
          });
        }
        
        menuOptions.push(
          { name: '🔄 Full Synchronization (Recommended)', value: 'full_sync' },
          { name: '➕ Add Missing Translations Only', value: 'add_missing' },
          { name: '🗑️  Remove Unused Keys Only', value: 'remove_unused' },
          { name: '📊 Generate Detailed Report', value: 'report' },
          { name: '🔍 Check Consistency', value: 'check' }
        );
      }
      
      // Always show structure creation option
      menuOptions.push({ name: '🏗️  Create New Translation Structure', value: 'create_structure' });
      menuOptions.push({ name: '↩️  Back to Main Menu', value: 'back' });
      
      const menu = new SimpleMenu(
        'Select an option:',
        menuOptions
      );
      
      const choice = await menu.show();
      
      switch (choice.value) {
        case 'scan':
          await this.performScan();
          break;
        case 'resolve_conflicts':
          if (this.scanner.hasConflicts()) {
            const result = await this.scanner.resolveFallbackConflicts();
            
            if (result && result.completed) {
              // Update lastScanResult after conflict resolution
              if (this.lastScanResult) {
                this.lastScanResult.fallbackTexts = this.scanner.fallbackTexts;
                this.lastScanResult.conflicts = this.scanner.fallbackConflicts;
              }
              
              // Update translation files with resolved conflicts
              await this.updateFilesWithResolvedConflicts();
            }
          }
          break;
        case 'full_sync':
          if (this.lastScanResult) {
            await this.performFullSync(this.lastScanResult);
          }
          break;
        case 'add_missing':
          if (this.lastScanResult) {
            await this.performAddMissing();
          }
          break;
        case 'remove_unused':
          if (this.lastScanResult) {
            await this.performRemoveUnused();
          }
          break;
        case 'report':
          if (this.lastScanResult) {
            await this.generateReport();
          }
          break;
        case 'check':
          await this.synchronizer.checkConsistency();
          await waitForEnter();
          break;
        case 'create_structure':
          await this.createTranslationStructure();
          break;
        case 'back':
          return;
      }
    }
  }

  // Update translation files with resolved conflicts
  async updateFilesWithResolvedConflicts() {
    printHeader();
    print('🔄 Updating translation files with resolved conflicts...', 'yellow');
    console.log();
    
    // Get resolved conflicts and new keys
    const resolvedConflicts = this.scanner.getResolvedConflicts();
    const pendingKeyChanges = this.scanner.getPendingKeyChanges();
    
    // Update English file with resolved fallback texts
    const enFile = this.availableLanguages.find(l => l.code === 'en');
    if (enFile) {
      const currentTranslations = await this.readLanguageFile(enFile.file);
      let updated = false;
      
      // Update with resolved conflicts
      for (const [key, text] of Object.entries(resolvedConflicts)) {
        if (currentTranslations[key] !== text) {
          currentTranslations[key] = text;
          updated = true;
        }
      }
      
      // Update with fallback texts
      for (const [key, text] of Object.entries(this.scanner.fallbackTexts)) {
        if (!currentTranslations[key]) {
          currentTranslations[key] = text;
          updated = true;
        }
      }
      
      if (updated) {
        await this.updateLanguageFile(enFile, currentTranslations, 'replace');
        print(`✅ Updated English translations`, 'green');
      }
    }
    
    // Update types.ts if needed
    if (this.scanner.usedKeys.size > 0) {
      await this.updateTypesFile(this.scanner.usedKeys, 'replace');
      print(`✅ Updated types.ts with all keys`, 'green');
    }
    
    print('\n✅ Translation files updated with resolved conflicts!', 'green');
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Perform project scan
  async performScan() {
    printHeader();
    print('🔍 SCANNING PROJECT', 'yellow');
    console.log();
    
    // Clear any previous conflict resolutions
    this.scanner.clearResolvedConflicts();
    
    // Perform scan
    const scanResult = await this.scanner.scanProject();
    this.lastScanResult = scanResult;
    
    print(`\n✅ Scan completed!`, 'green');
    print(`📊 Found ${scanResult.usedKeys.size} unique translation keys`, 'cyan');
    
    // Check if there were fallback conflicts
    if (this.scanner.hasConflicts()) {
      console.log();
      print(`⚠️  Found ${this.scanner.getConflictCount()} translation keys with different fallback texts`, 'yellow');
      const resolveConflicts = await askConfirmMenu(
        'Would you like to resolve these conflicts now?'
      );
      
      if (resolveConflicts) {
        const result = await this.scanner.resolveFallbackConflicts();
        
        if (result && result.completed) {
          // Update scan result with resolved conflicts
          this.lastScanResult.fallbackTexts = this.scanner.fallbackTexts;
          this.lastScanResult.conflicts = this.scanner.fallbackConflicts;
          
          // Update translation files
          await this.updateFilesWithResolvedConflicts();
        }
      } else {
        print('\n💡 You can resolve conflicts later from the menu', 'dim');
      }
    }
    
    // Extract all keys
    const allKeys = await this.synchronizer.extractAllKeys(
      scanResult.usedKeys,
      scanResult.fallbackTexts
    );
    
    // Analyze current state
    const analysis = await this.analyzer.analyze(scanResult.usedKeys, allKeys);
    
    // Show analysis summary
    await this.showAnalysisSummary(analysis);
    await waitForEnter();
  }

  // Perform add missing translations
  async performAddMissing() {
    const allKeys = await this.synchronizer.extractAllKeys(
      this.lastScanResult.usedKeys,
      this.lastScanResult.fallbackTexts
    );
    
    const analysis = await this.analyzer.analyze(this.lastScanResult.usedKeys, allKeys);
    await this.addMissingTranslations(analysis, this.lastScanResult);
    await waitForEnter();
  }

  // Perform remove unused keys
  async performRemoveUnused() {
    const allKeys = await this.synchronizer.extractAllKeys(
      this.lastScanResult.usedKeys,
      this.lastScanResult.fallbackTexts
    );
    
    const analysis = await this.analyzer.analyze(this.lastScanResult.usedKeys, allKeys);
    await this.removeUnusedKeys(analysis);
    await waitForEnter();
  }

  // Generate report - Enhanced with auto-open
  async generateReport() {
    const allKeys = await this.synchronizer.extractAllKeys(
      this.lastScanResult.usedKeys,
      this.lastScanResult.fallbackTexts
    );
    
    const analysis = await this.analyzer.analyze(this.lastScanResult.usedKeys, allKeys);
    const reportPaths = await this.reporter.generateReport(analysis, this.projectRoot, this.lastScanResult, this.settings);
    
    // Auto-open reports if enabled
    if (this.settings.autoOpenReports && this.openFileCallback) {
      console.log();
      
      // Always open HTML report first if available
      if (reportPaths.html) {
        print('📖 Opening HTML report...', 'cyan');
        await this.openFileCallback(reportPaths.html, this.settings);
      }
      
      const openMarkdown = await askConfirmMenu('Also open Markdown report?', false);
      if (openMarkdown && reportPaths.markdown) {
        await this.openFileCallback(reportPaths.markdown, this.settings);
      }
      
      const openJson = await askConfirmMenu('Also open JSON report?', false);
      if (openJson && reportPaths.json) {
        await this.openFileCallback(reportPaths.json, this.settings);
      }
    }
    
    await waitForEnter();
  }

  // Quick sync from command line
  async quickSync() {
    const detected = await this.detectTranslationStructure();
    if (!detected) {
      print('❌ Could not detect translation structure', 'red');
      return;
    }
    
    this.translator = new TranslationTranslator(this.env);
    await this.translator.setupApi(this.settings.defaultTranslationApi);
    
    this.synchronizer = new TranslationSynchronizer(
      this.translationsDir,
      this.typesFile,
      this.availableLanguages
    );
    
    this.scanner = new TranslationScanner(this.projectRoot);
    const scanResult = await this.scanner.scanProject();
    
    // Resolve conflicts if any
    if (this.scanner.hasConflicts()) {
      print(`\n⚠️  Found ${this.scanner.getConflictCount()} conflicts that need resolution`, 'yellow');
      const resolve = await askConfirmMenu('Resolve conflicts before sync?');
      if (resolve) {
        const result = await this.scanner.resolveFallbackConflicts();
        if (result && result.completed) {
          scanResult.fallbackTexts = this.scanner.fallbackTexts;
          await this.updateFilesWithResolvedConflicts();
        }
      }
    }
    
    const allKeys = await this.synchronizer.extractAllKeys(
      scanResult.usedKeys,
      scanResult.fallbackTexts
    );
    
    // Sync all files
    await this.synchronizer.syncAllFiles(scanResult.usedKeys, this.translator);
    
    print('\n✅ All translation files synchronized!', 'green');
  }

  // Check consistency from command line
  async checkConsistency() {
    const detected = await this.detectTranslationStructure();
    if (!detected) {
      print('❌ Could not detect translation structure', 'red');
      return;
    }
    
    this.synchronizer = new TranslationSynchronizer(
      this.translationsDir,
      this.typesFile,
      this.availableLanguages
    );
    
    await this.synchronizer.checkConsistency();
  }

  // Auto-detect translation structure
  async detectTranslationStructure() {
    print('🔍 Detecting translation structure...', 'cyan');
    
    const patterns = [
      { dir: 'lib/translations/languages', typesFile: 'lib/translations/types.ts' },
      { dir: 'src/translations/languages', typesFile: 'src/translations/types.ts' },
      { dir: 'translations/languages', typesFile: 'translations/types.ts' },
      { dir: 'locales', typesFile: 'locales/types.ts' },
      { dir: 'i18n', typesFile: 'i18n/types.ts' },
      { dir: 'lang', typesFile: 'lang/types.ts' }
    ];

    for (const pattern of patterns) {
      const dirPath = path.join(this.projectRoot, pattern.dir);
      const typesPath = path.join(this.projectRoot, pattern.typesFile);
      
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        const langFiles = files.filter(f => /^[a-z]{2}\.(?:ts|js|json)$/.test(f));
        
        if (langFiles.length > 0) {
          this.translationsDir = dirPath;
          this.typesFile = fs.existsSync(typesPath) ? typesPath : null;
          
          print(`✅ Found translations in: ${pattern.dir}`, 'green');
          print(`   Language files: ${langFiles.join(', ')}`, 'dim');
          
          if (!this.typesFile) {
            print(`   ⚠️  No types.ts file found, will create one`, 'yellow');
            this.typesFile = typesPath;
          }
          
          this.availableLanguages = langFiles.map(f => ({
            code: f.split('.')[0],
            file: path.join(dirPath, f)
          }));
          
          return true;
        }
      }
    }
    
    return false;
  }

  // Manual selection of translation directory
  async selectTranslationDirectory() {
    let currentDir = this.projectRoot;
    
    while (true) {
      const items = fs.readdirSync(currentDir).filter(item => {
        try {
          return fs.statSync(path.join(currentDir, item)).isDirectory();
        } catch {
          return false;
        }
      }).map(item => ({
        name: `📁 ${item}`,
        value: item
      }));
      
      // Add navigation options
      if (currentDir !== path.parse(currentDir).root) {
        items.unshift({
          name: '⬆️ .. (Parent Directory)',
          value: '..'
        });
      }
      
      items.unshift({
        name: '📍 Use this directory for translations',
        value: '.'
      });
      
      const menu = new SimpleMenu(
        `Select translation directory (current: ${currentDir})`,
        items
      );
      
      const selected = await menu.show();
      
      if (selected.value === '.') {
        // Check for language files
        const files = fs.readdirSync(currentDir);
        const langFiles = files.filter(f => /^[a-z]{2}\.(?:ts|js|json)$/.test(f));
        
        if (langFiles.length === 0) {
          print('\n⚠️  No language files found in this directory', 'yellow');
          print('Expected files like: en.ts, ar.ts, es.ts, etc.', 'dim');
          await waitForEnter();
          continue;
        }
        
        this.translationsDir = currentDir;
        this.availableLanguages = langFiles.map(f => ({
          code: f.split('.')[0],
          file: path.join(currentDir, f)
        }));
        
        // Look for types file
        const parentDir = path.dirname(currentDir);
        const possibleTypesPaths = [
          path.join(parentDir, 'types.ts'),
          path.join(currentDir, 'types.ts'),
          path.join(currentDir, '..', 'types.ts')
        ];
        
        for (const typesPath of possibleTypesPaths) {
          if (fs.existsSync(typesPath)) {
            this.typesFile = typesPath;
            break;
          }
        }
        
        if (!this.typesFile) {
          this.typesFile = path.join(parentDir, 'types.ts');
          print(`\n⚠️  No types.ts file found, will create at: ${this.typesFile}`, 'yellow');
        }
        
        print(`\n✅ Selected translation directory: ${this.translationsDir}`, 'green');
        print(`   Language files: ${langFiles.join(', ')}`, 'dim');
        await waitForEnter();
        return;
        
      } else if (selected.value === '..') {
        currentDir = path.dirname(currentDir);
      } else {
        currentDir = path.join(currentDir, selected.value);
      }
    }
  }

  // Show analysis summary
  async showAnalysisSummary(analysis) {
    printHeader();
    print('📊 Translation Analysis Summary:', 'yellow');
    console.log();
    
    print(`  Total keys in use: ${analysis.totalUsedKeys}`, 'white');
    print(`  Total unique keys: ${analysis.totalUniqueKeys}`, 'white');
    
    if (analysis.keysOnlyInCode.size > 0) {
      print(`  Keys only in code: ${analysis.keysOnlyInCode.size}`, 'yellow');
    }
    
    if (analysis.keysOnlyInFiles.size > 0) {
      print(`  Keys only in files: ${analysis.keysOnlyInFiles.size}`, 'yellow');
    }
    
    if (analysis.inconsistentKeys.length > 0) {
      print(`  Inconsistent keys: ${analysis.inconsistentKeys.length}`, 'red');
    }
    
    console.log();
    print('🌍 Language Status:', 'cyan');
    
    for (const [lang, stats] of Object.entries(analysis.languageStats)) {
      const status = stats.missing === 0 ? '✅' : '⚠️';
      print(`  ${status} ${lang}: ${stats.total} keys, ${stats.missing} missing`, 
            stats.missing === 0 ? 'green' : 'yellow');
    }
    
    console.log();
  }

  // Perform full synchronization
  async performFullSync(scanResult) {
    print('\n🔄 Performing full synchronization...', 'cyan');
    print('This will:', 'yellow');
    print('  1. Add all keys found in code', 'dim');
    print('  2. Remove keys not used in code', 'dim');
    print('  3. Sync all language files to have identical keys', 'dim');
    print('  4. Update types.ts to match exactly', 'dim');
    print('  5. Translate all missing translations', 'dim');
    
    console.log();
    const confirm = await askConfirmMenu('Proceed with full sync?');
    if (!confirm) return;
    
    // Backup if enabled
    if (this.settings.autoBackupBeforeSync) {
      await this.createBackup();
    }
    
    // Perform sync
    await this.synchronizer.syncAllFiles(scanResult.usedKeys, this.translator);
    
    print('\n✅ Full synchronization completed!', 'green');
    await waitForEnter();
  }

  // Create backup of translation files
  async createBackup() {
    print('\n📦 Creating backup...', 'cyan');
    
    const backupDir = path.join(this.projectRoot, '.translation-backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, timestamp);
    
    try {
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Copy translation files
      const translationParent = path.dirname(this.translationsDir);
      const backupTranslationDir = path.join(backupPath, path.basename(translationParent));
      
      // Copy entire translation directory
      this.copyDirectory(translationParent, backupTranslationDir);
      
      print(`✅ Backup created at: ${backupPath}`, 'green');
    } catch (error) {
      print(`⚠️  Could not create backup: ${error.message}`, 'yellow');
    }
  }

  // Copy directory recursively
  copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Add missing translations
  async addMissingTranslations(analysis, scanResult) {
    print('\n🌐 Adding missing translations...', 'cyan');
    
    let totalTranslated = 0;
    const allKeys = analysis.allKeys;
    
    // First, ensure all keys exist in all files
    for (const [langCode, stats] of Object.entries(analysis.languageStats)) {
      const lang = this.availableLanguages.find(l => l.code === langCode);
      if (!lang) continue;
      
      if (stats.missing > 0) {
        print(`\n  Processing ${langCode}...`, 'yellow');
        
        // Get current translations
        const currentTranslations = await this.readLanguageFile(lang.file);
        
        // Find missing keys
        const missingKeys = Array.from(allKeys).filter(key => 
          !currentTranslations.hasOwnProperty(key)
        );
        
        if (missingKeys.length > 0) {
          const newTranslations = {};
          
          if (langCode === 'en') {
            // For English, use fallback texts or key names
            missingKeys.forEach(key => {
              newTranslations[key] = scanResult.fallbackTexts[key] || this.keyToText(key);
            });
          } else {
            // For other languages, translate
            print(`    Translating ${missingKeys.length} keys...`, 'cyan');
            
            // Show progress if enabled
            if (this.settings.showProgressBars) {
              const { showProgress } = require('../core/terminal');
              let processed = 0;
              
              // Process in batches
              const batchSize = 10;
              for (let i = 0; i < missingKeys.length; i += batchSize) {
                const batch = missingKeys.slice(i, i + batchSize);
                
                // Prepare master keys map for translator
                const masterKeys = new Map();
                for (const key of batch) {
                  masterKeys.set(key, {
                    en: scanResult.fallbackTexts[key] || this.keyToText(key),
                    fallback: scanResult.fallbackTexts[key] || this.keyToText(key)
                  });
                }
                
                const translations = await this.translator.translateKeys(
                  batch,
                  masterKeys,
                  'en',
                  langCode
                );
                
                Object.assign(newTranslations, translations);
                processed += batch.length;
                
                showProgress(processed, missingKeys.length, `Translating ${langCode}`);
              }
            } else {
              // Prepare master keys map for translator
              const masterKeys = new Map();
              for (const key of missingKeys) {
                masterKeys.set(key, {
                  en: scanResult.fallbackTexts[key] || this.keyToText(key),
                  fallback: scanResult.fallbackTexts[key] || this.keyToText(key)
                });
              }
              
              const translations = await this.translator.translateKeys(
                missingKeys,
                masterKeys,
                'en',
                langCode
              );
              
              Object.assign(newTranslations, translations);
            }
          }
          
          // Update language file
          await this.updateLanguageFile(lang, newTranslations, 'add');
          totalTranslated += missingKeys.length;
          print(`    ✅ Added ${missingKeys.length} translations`, 'green');
        }
      }
    }
    
    // Update types.ts if needed
    if (analysis.keysOnlyInCode.size > 0) {
      await this.updateTypesFile(allKeys, 'replace');
      print(`\n✅ Updated types.ts with all keys`, 'green');
    }
    
    print(`\n✅ Total translations added: ${totalTranslated}`, 'green');
  }

  // Remove unused keys
  async removeUnusedKeys(analysis) {
    print('\n🗑️  Removing unused keys...', 'cyan');
    
    const keysToRemove = analysis.keysOnlyInFiles;
    
    if (keysToRemove.size === 0) {
      print('✅ No unused keys found!', 'green');
      return;
    }
    
    print(`Found ${keysToRemove.size} unused keys:`, 'yellow');
    const keyList = Array.from(keysToRemove).slice(0, 10);
    keyList.forEach(key => print(`  - ${key}`, 'dim'));
    if (keysToRemove.size > 10) {
      print(`  ... and ${keysToRemove.size - 10} more`, 'dim');
    }
    
    console.log();
    const confirm = await askConfirmMenu(
      `Remove ${keysToRemove.size} unused keys from all files?`
    );
    if (!confirm) return;
    
    // Remove from all language files
    for (const lang of this.availableLanguages) {
      await this.updateLanguageFile(lang, Array.from(keysToRemove), 'remove');
    }
    
    // Remove from types.ts
    if (this.typesFile) {
      const remainingKeys = new Set(analysis.allKeys);
      keysToRemove.forEach(key => remainingKeys.delete(key));
      await this.updateTypesFile(remainingKeys, 'replace');
    }
    
    print(`✅ Removed ${keysToRemove.size} unused keys!`, 'green');
  }

  // Update language file
  async updateLanguageFile(lang, data, operation) {
    try {
      const currentContent = await this.readLanguageFile(lang.file);
      let newContent = { ...currentContent };
      
      if (operation === 'add') {
        // Add new translations
        Object.assign(newContent, data);
      } else if (operation === 'remove') {
        // Remove keys
        data.forEach(key => {
          delete newContent[key];
        });
      } else if (operation === 'replace') {
        // Replace entire content
        newContent = data;
      }
      
      // Write updated content
      const fileContent = lang.file.endsWith('.json')
        ? generateJSONLanguageFile(newContent)
        : generateLanguageFile(lang.code, newContent);
      
      fs.writeFileSync(lang.file, fileContent, 'utf8');
      return true;
    } catch (error) {
      print(`❌ Error updating ${lang.code}: ${error.message}`, 'red');
      return false;
    }
  }

  // Update types file
  async updateTypesFile(keys, operation) {
    try {
      let allKeys = new Set();
      
      if (operation === 'add') {
        // Get existing keys and add new ones
        if (fs.existsSync(this.typesFile)) {
          const content = fs.readFileSync(this.typesFile, 'utf8');
          allKeys = parseTranslationInterface(content);
        }
        keys.forEach(key => allKeys.add(key));
      } else if (operation === 'remove') {
        // Get existing keys and remove specified ones
        if (fs.existsSync(this.typesFile)) {
          const content = fs.readFileSync(this.typesFile, 'utf8');
          allKeys = parseTranslationInterface(content);
        }
        keys.forEach(key => allKeys.delete(key));
      } else {
        // Replace all keys
        allKeys = keys;
      }
      
      // Generate and write new content
      const languageCodes = this.availableLanguages.map(l => l.code);
      const content = generateTranslationInterface(allKeys, languageCodes);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(this.typesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.typesFile, content, 'utf8');
      return true;
    } catch (error) {
      print(`❌ Error updating types file: ${error.message}`, 'red');
      return false;
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

  // Convert key to readable text
  keyToText(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}

module.exports = TranslationManager;