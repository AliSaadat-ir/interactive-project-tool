// === ENHANCED TRANSLATION MANAGER ===
// Main class for managing all translation operations

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

class TranslationManager {
  constructor(env) {
    this.translationsDir = null;
    this.typesFile = null;
    this.projectRoot = process.cwd();
    this.availableLanguages = [];
    this.env = env || {};
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
    // Setup translation API first
    this.translator = new TranslationTranslator(this.env);
    await this.translator.setupApi();
    
    // Try auto-detection first
    const detected = await this.detectTranslationStructure();
    
    if (!detected) {
      print('\n⚠️  Could not auto-detect translation structure', 'yellow');
      const menu = new SimpleMenu(
        'How would you like to proceed?',
        [
          { name: 'Select translation directory manually', value: 'manual' },
          { name: 'Cancel', value: 'cancel' }
        ]
      );
      
      const choice = await menu.show();
      if (choice.value === 'cancel') return;
      
      await this.selectTranslationDirectory();
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

  // Show translation management menu
  async showTranslationMenu() {
    while (true) {
      printHeader();
      print('🌐 TRANSLATION MANAGEMENT', 'yellow');
      console.log();
      
      if (this.lastScanResult) {
        print('✅ Project scanned', 'green');
        print(`   Found ${this.lastScanResult.usedKeys.size} translation keys`, 'dim');
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
        menuOptions.push(
          { name: '🔄 Full Synchronization (Recommended)', value: 'full_sync' },
          { name: '➕ Add Missing Translations Only', value: 'add_missing' },
          { name: '🗑️  Remove Unused Keys Only', value: 'remove_unused' },
          { name: '📊 Generate Detailed Report', value: 'report' },
          { name: '🔍 Check Consistency', value: 'check' }
        );
      }
      
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
        case 'back':
          return;
      }
    }
  }

  // Perform project scan
  async performScan() {
    printHeader();
    print('🔍 SCANNING PROJECT', 'yellow');
    console.log();
    
    // Perform scan
    const scanResult = await this.scanner.scanProject();
    this.lastScanResult = scanResult;
    
    print(`\n✅ Scan completed!`, 'green');
    print(`📊 Found ${scanResult.usedKeys.size} unique translation keys`, 'cyan');
    
    // Check if there were fallback conflicts
    if (this.scanner.hasConflicts()) {
      console.log();
      print('⚠️  Found translation keys with different fallback texts', 'yellow');
      const resolveConflicts = await askConfirmMenu(
        'Would you like to resolve these conflicts now?'
      );
      
      if (resolveConflicts) {
        await this.scanner.resolveFallbackConflicts();
      } else {
        print('\n💡 You can resolve conflicts later from the scan menu', 'dim');
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

  // Generate report
  async generateReport() {
    const allKeys = await this.synchronizer.extractAllKeys(
      this.lastScanResult.usedKeys,
      this.lastScanResult.fallbackTexts
    );
    
    const analysis = await this.analyzer.analyze(this.lastScanResult.usedKeys, allKeys);
    await this.reporter.generateReport(analysis, this.projectRoot, this.lastScanResult);
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
    await this.translator.setupApi();
    
    this.synchronizer = new TranslationSynchronizer(
      this.translationsDir,
      this.typesFile,
      this.availableLanguages
    );
    
    this.scanner = new TranslationScanner(this.projectRoot);
    const scanResult = await this.scanner.scanProject();
    
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
      const items = fs.readdirSync(currentDir)
        .filter(item => {
          try {
            return fs.statSync(path.join(currentDir, item)).isDirectory();
          } catch {
            return false;
          }
        })
        .map(item => ({
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
    
    // Perform sync
    await this.synchronizer.syncAllFiles(scanResult.usedKeys, this.translator);
    
    print('\n✅ Full synchronization completed!', 'green');
    await waitForEnter();
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