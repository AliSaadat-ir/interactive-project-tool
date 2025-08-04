// === ENHANCED TRANSLATION SCANNER ===
// lib/translation/scanner.js

const fs = require('fs');
const path = require('path');
const { print, printHeader, clearScreen } = require('../core/terminal');
const { SimpleMenu } = require('../core/menu');

// Enhanced menu with details display and exit option
class DetailedConflictMenu extends SimpleMenu {
  constructor(title, options, details = {}, allowExit = false) {
    super(title, options);
    this.details = details;
    this.allowExit = allowExit;
    this.hasChanges = false;
  }

  async show() {
    return new Promise((resolve) => {
      this.render();

      // Set up key handling
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleKeypress = async (key) => {
        if (key === '\u0003') { // Ctrl+C
          if (this.allowExit) {
            // Immediately exit to main menu
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', handleKeypress);
            resolve({ action: 'exit_to_menu' });
          } else {
            process.exit();
          }
        } else if (key === '\r' || key === '\n') { // Enter
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handleKeypress);
          this.hasChanges = true;
          resolve(this.options[this.selectedIndex]);
        } else if (key === '\u001b[A') { // Up arrow
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
        } else if (key === '\u001b[B') { // Down arrow
          this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
          this.render();
        } else if (key >= '1' && key <= '9') { // Number keys
          const index = parseInt(key) - 1;
          if (index < this.options.length) {
            this.selectedIndex = index;
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
    
    // Show menu options first
    this.options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        print(`  ▶ ${index + 1}. ${option.name}`, 'green');
      } else {
        print(`    ${index + 1}. ${option.name}`, 'white');
      }
    });

    // Show file details below options (only for non-action items)
    const selectedOption = this.options[this.selectedIndex];
    if (this.details[selectedOption.value] && 
        selectedOption.value !== 'custom' && 
        selectedOption.value !== 'skip' &&
        selectedOption.value !== 'change_key' &&
        selectedOption.value !== 'save_and_continue' &&
        selectedOption.value !== 'split_keys') {
      console.log();
      print('───────────────────────────────────────', 'dim');
      print('📁 File Details:', 'cyan');
      console.log();
      
      const detail = this.details[selectedOption.value];
      detail.locations.forEach((loc, index) => {
        print(`  ${index + 1}. ${loc.file}:${loc.line}`, 'white');
        if (loc.preview) {
          print(`     ${loc.preview}`, 'dim');
        }
      });
      
      print('───────────────────────────────────────', 'dim');
    }

    console.log();
    print('Use ↑↓ arrows or number keys to select, Enter to confirm', 'dim');
    if (this.allowExit) {
      print('Press Ctrl+C to save and exit to main menu', 'cyan');
    } else {
      print('Press Ctrl+C to exit', 'dim');
    }
  }
}

// Enhanced multi-select menu for key changes
class KeyChangeMenu extends SimpleMenu {
  constructor(title, options) {
    super(title, options);
    this.selected = new Set();
  }

  async show() {
    return new Promise((resolve) => {
      this.render();

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleKeypress = (key) => {
        if (key === '\u0003') { // Ctrl+C
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handleKeypress);
          resolve({ cancelled: true });
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
          if (this.selected.has(currentOption.value)) {
            this.selected.delete(currentOption.value);
          } else {
            this.selected.add(currentOption.value);
          }
          this.render();
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
      
      if (index === this.selectedIndex) {
        print(`  ▶ ${checkbox} ${option.name}`, 'green');
      } else {
        print(`    ${checkbox} ${option.name}`, isSelected ? 'cyan' : 'white');
      }
    });

    console.log();
    print(`Selected: ${this.selected.size} text(s)`, 'cyan');
    console.log();
    print('Use ↑↓ arrows to navigate, Space to select/deselect', 'dim');
    print('Press Enter to confirm selection', 'dim');
    print('Press Ctrl+C to cancel', 'dim');
  }
}

class TranslationScanner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.usedKeys = new Set();
    this.fallbackTexts = {};
    this.fallbackConflicts = {}; // key -> array of {text, locations}
    this.keyUsageMap = new Map(); // key -> array of file locations
    this.fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    this.excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next'];
    this.keyChanges = {}; // oldKey -> newKey mapping
    this.resolvedConflicts = {}; // Store resolved conflicts
    this.conflictResolutionState = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      pendingChanges: {}
    };
  }

  // Extract the actual text content without quotes
  extractTextContent(text) {
    return text.replace(/^['"`]|['"`]$/g, '');
  }

  // Parse quoted string properly
  parseQuotedString(text, startIndex) {
    const openQuote = text[startIndex];
    if (!['"', "'", '`'].includes(openQuote)) {
      return null;
    }
    
    let i = startIndex + 1;
    let content = '';
    
    while (i < text.length) {
      const char = text[i];
      
      if (char === openQuote) {
        return {
          fullMatch: openQuote + content + openQuote,
          content: content,
          endIndex: i
        };
      } else if (char === '\\' && i + 1 < text.length) {
        const nextChar = text[i + 1];
        if (nextChar === openQuote || nextChar === '\\') {
          content += nextChar;
          i += 2;
        } else {
          content += char;
          i++;
        }
      } else {
        content += char;
        i++;
      }
    }
    
    return null;
  }

  // Check if there are conflicts
  hasConflicts() {
    return Object.keys(this.fallbackConflicts).length > 0;
  }

  // Count total conflicts
  getConflictCount() {
    return Object.keys(this.fallbackConflicts).length;
  }

  // Generate new key suggestions
  generateNewKeys(baseKey, count) {
    const suggestions = [];
    
    // Numeric suffixes
    for (let i = 1; i <= count; i++) {
      suggestions.push(`${baseKey}${i}`);
    }
    
    // Descriptive suffixes
    suggestions.push(
      `${baseKey}Alt`,
      `${baseKey}Alternative`,
      `${baseKey}Variant`,
      `${baseKey}Version2`
    );
    
    return suggestions;
  }

  // Apply single key change immediately
  async applySingleKeyChange(oldKey, newKey) {
    const locations = this.keyUsageMap.get(oldKey) || [];
    const changedFiles = new Set();
    
    for (const location of locations) {
      const filePath = path.join(this.projectRoot, location.file);
      changedFiles.add(filePath);
      
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace the key in various patterns
        const patterns = [
          new RegExp(`\\bt\\.${oldKey}\\b`, 'g'),
          new RegExp(`\\bt\\['${oldKey}'\\]`, 'g'),
          new RegExp(`\\bt\\["${oldKey}"\\]`, 'g'),
          new RegExp(`\\bt\\[\`${oldKey}\`\\]`, 'g'),
          new RegExp(`\\bt\\?\\.${oldKey}\\b`, 'g'),
          new RegExp(`\\$t\\.${oldKey}\\b`, 'g'),
          new RegExp(`\\$t\\(['"\`]${oldKey}['"\`]\\)`, 'g')
        ];
        
        patterns.forEach(pattern => {
          content = content.replace(pattern, (match) => {
            return match.replace(oldKey, newKey);
          });
        });
        
        fs.writeFileSync(filePath, content, 'utf8');
      } catch (error) {
        print(`  ❌ Failed to update ${location.file}: ${error.message}`, 'red');
      }
    }
    
    print(`  ✅ Updated ${changedFiles.size} files with key change: ${oldKey} → ${newKey}`, 'green');
  }

  // Enhanced resolve fallback conflicts
  async resolveFallbackConflicts() {
    printHeader();
    print('🔧 RESOLVE FALLBACK CONFLICTS', 'yellow');
    console.log();
    
    const conflictKeys = Object.keys(this.fallbackConflicts);
    this.conflictResolutionState.totalConflicts = conflictKeys.length;
    this.conflictResolutionState.resolvedConflicts = 0;
    
    print(`📊 Found ${conflictKeys.length} keys with conflicts`, 'cyan');
    print('💡 Press Ctrl+C at any time to save progress and return to menu', 'cyan');
    console.log();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    for (let i = 0; i < conflictKeys.length; i++) {
      const key = conflictKeys[i];
      const conflicts = this.fallbackConflicts[key];
      
      printHeader();
      print(`📝 Conflict ${i + 1} of ${conflictKeys.length} (Resolved: ${this.conflictResolutionState.resolvedConflicts})`, 'cyan');
      print(`🔑 Key: "${key}"`, 'yellow');
      console.log();
      print('Found different fallback texts in your code:', 'white');
      console.log();
      
      // Group by normalized text content
      const textGroups = {};
      conflicts.forEach(conflict => {
        const normalizedContent = this.extractTextContent(conflict.text);
        if (!textGroups[normalizedContent]) {
          textGroups[normalizedContent] = {
            variations: [],
            locations: []
          };
        }
        
        if (!textGroups[normalizedContent].variations.includes(conflict.text)) {
          textGroups[normalizedContent].variations.push(conflict.text);
        }
        
        textGroups[normalizedContent].locations.push(...conflict.locations);
      });
      
      // Create options
      const options = [];
      const details = {};
      
      Object.entries(textGroups).forEach(([content, group]) => {
        group.locations = this.deduplicateLocations(group.locations);
        
        let displayText;
        if (group.variations.length > 1) {
          displayText = `"${content}" (variations: ${group.variations.join(', ')})`;
        } else {
          displayText = group.variations[0];
        }
        
        const optionName = `${displayText} (${group.locations.length} location${group.locations.length > 1 ? 's' : ''})`;
        options.push({
          name: optionName,
          value: content
        });
        
        details[content] = {
          locations: group.locations.map(loc => ({
            file: loc.file,
            line: loc.line,
            preview: this.getLinePreview(loc.file, loc.line)
          }))
        };
      });
      
      // Add special options
      options.push(
        { name: '🔄 Change key for some texts', value: 'change_key' },
        { name: '✏️  Enter custom text', value: 'custom' },
        { name: '💾 Save progress and continue', value: 'save_and_continue' },
        { name: '⏭️  Skip this conflict', value: 'skip' }
      );
      
      const menu = new DetailedConflictMenu(
        'Select action:',
        options,
        details,
        true // Allow exit
      );
      
      const selected = await menu.show();
      
      // Handle exit to menu
      if (selected.action === 'exit_to_menu') {
        await this.saveResolvedConflicts();
        print('\n✅ Progress saved. Returning to menu...', 'green');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return;
      }
      
      if (selected.value === 'save_and_continue') {
        await this.saveResolvedConflicts();
        print('\n✅ Progress saved!', 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      if (selected.value === 'change_key') {
        // Handle key changes
        const keyChangeResult = await this.handleKeyChange(key, textGroups);
        if (keyChangeResult.changed) {
          this.conflictResolutionState.resolvedConflicts++;
          // Remove this conflict as it's resolved
          delete this.fallbackConflicts[key];
        }
      } else if (selected.value === 'custom') {
        const { askQuestion } = require('../core/input');
        const customText = await askQuestion('Enter custom fallback text: ');
        this.fallbackTexts[key] = customText.trim() || Object.keys(textGroups)[0];
        this.resolvedConflicts[key] = this.fallbackTexts[key];
        this.conflictResolutionState.resolvedConflicts++;
        delete this.fallbackConflicts[key];
        print(`✅ Set custom text: "${this.fallbackTexts[key]}"`, 'green');
      } else if (selected.value === 'skip') {
        this.fallbackTexts[key] = Object.keys(textGroups)[0];
        print(`⏭️  Skipped (using first found: "${this.fallbackTexts[key]}")`, 'yellow');
      } else {
        this.fallbackTexts[key] = selected.value;
        this.resolvedConflicts[key] = selected.value;
        this.conflictResolutionState.resolvedConflicts++;
        delete this.fallbackConflicts[key];
        print(`✅ Selected: "${this.fallbackTexts[key]}"`, 'green');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final save
    await this.saveResolvedConflicts();
    
    // Summary
    printHeader();
    print('📊 Conflict Resolution Complete', 'cyan');
    console.log();
    print(`✅ Resolved: ${this.conflictResolutionState.resolvedConflicts} conflicts`, 'green');
    print(`📝 Total processed: ${conflictKeys.length} conflicts`, 'white');
  }

  // Handle key change for conflicts with immediate application
  async handleKeyChange(baseKey, textGroups) {
    printHeader();
    print(`🔄 Change Keys for: ${baseKey}`, 'yellow');
    console.log();
    print('Select which texts should use different keys:', 'cyan');
    console.log();
    
    const options = Object.entries(textGroups).map(([content, group]) => ({
      name: `"${content}" (${group.locations.length} locations)`,
      value: content
    }));
    
    const menu = new KeyChangeMenu('Select texts to assign new keys:', options);
    const result = await menu.show();
    
    if (result.cancelled) {
      print('\n❌ Key change cancelled', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { changed: false, count: 0 };
    }
    
    const selectedTexts = result;
    
    if (selectedTexts.length === 0) {
      print('\n❌ No texts selected for key change', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { changed: false, count: 0 };
    }
    
    // Generate key suggestions
    const suggestions = this.generateNewKeys(baseKey, selectedTexts.length);
    
    for (let i = 0; i < selectedTexts.length; i++) {
      const text = selectedTexts[i];
      
      printHeader();
      print(`🔑 Assign new key for: "${text}"`, 'cyan');
      console.log();
      
      const keyOptions = suggestions.map(key => ({ name: key, value: key }));
      keyOptions.push({ name: '✏️  Enter custom key', value: 'custom' });
      
      const keyMenu = new SimpleMenu('Select new key:', keyOptions);
      const selectedKey = await keyMenu.show();
      
      let newKey;
      if (selectedKey.value === 'custom') {
        const { askQuestion } = require('../core/input');
        newKey = await askQuestion('Enter custom key name: ');
        newKey = newKey.trim();
        
        if (!newKey || !this.isValidKey(newKey)) {
          print('\n❌ Invalid key name. Using suggestion instead.', 'red');
          newKey = suggestions[i];
        }
      } else {
        newKey = selectedKey.value;
      }
      
      print(`\n✅ Assigning: ${baseKey} → ${newKey} for "${text}"`, 'green');
      
      // Apply change immediately
      const group = textGroups[text];
      for (const location of group.locations) {
        // Update key usage map
        if (!this.keyUsageMap.has(newKey)) {
          this.keyUsageMap.set(newKey, []);
        }
        this.keyUsageMap.get(newKey).push(location);
      }
      
      // Apply the key change to files
      await this.applySingleKeyChange(baseKey, newKey);
      
      // Update internal mappings
      this.usedKeys.add(newKey);
      this.fallbackTexts[newKey] = text;
      this.keyChanges[baseKey] = newKey;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Keep the original key for texts not selected
    const remainingTexts = Object.keys(textGroups).filter(t => !selectedTexts.includes(t));
    if (remainingTexts.length > 0) {
      this.fallbackTexts[baseKey] = remainingTexts[0];
    }
    
    return { changed: true, count: selectedTexts.length };
  }

  // Save resolved conflicts
  async saveResolvedConflicts() {
    // Update fallbackTexts with resolved conflicts
    Object.assign(this.fallbackTexts, this.resolvedConflicts);
    
    // Save state for potential recovery
    const stateFile = path.join(this.projectRoot, '.translation-conflicts-resolved.json');
    try {
      fs.writeFileSync(stateFile, JSON.stringify({
        resolvedConflicts: this.resolvedConflicts,
        keyChanges: this.keyChanges,
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      // Ignore save errors
    }
  }

  // Load previously resolved conflicts
  async loadResolvedConflicts() {
    const stateFile = path.join(this.projectRoot, '.translation-conflicts-resolved.json');
    try {
      if (fs.existsSync(stateFile)) {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        this.resolvedConflicts = data.resolvedConflicts || {};
        this.keyChanges = data.keyChanges || {};
        return true;
      }
    } catch (error) {
      // Ignore load errors
    }
    return false;
  }

  // Check if key is valid
  isValidKey(key) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key);
  }

  // Deduplicate locations
  deduplicateLocations(locations) {
    const seen = new Set();
    const unique = [];
    
    for (const loc of locations) {
      const key = `${loc.file}:${loc.line}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(loc);
      }
    }
    
    return unique.sort((a, b) => {
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      return a.line - b.line;
    });
  }

  // Get line preview
  getLinePreview(filePath, lineNumber) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      if (lineNumber > 0 && lineNumber <= lines.length) {
        const line = lines[lineNumber - 1].trim();
        return line.length > 60 ? line.substring(0, 57) + '...' : line;
      }
    } catch (error) {
      // Ignore errors
    }
    return '';
  }

  // Clear conflicts after resolution
  clearResolvedConflicts() {
    const stateFile = path.join(this.projectRoot, '.translation-conflicts-resolved.json');
    try {
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
    } catch (error) {
      // Ignore errors
    }
  }

  // Scan entire project
  async scanProject() {
    print('🔍 Scanning project for translation usage...', 'cyan');
    
    // Clear previous scan data
    this.usedKeys.clear();
    this.fallbackTexts = {};
    this.fallbackConflicts = {};
    this.keyUsageMap.clear();
    
    // Load previously resolved conflicts
    await this.loadResolvedConflicts();
    
    const srcDirs = ['components', 'app', 'src', 'pages', 'lib', 'utils'];
    
    for (const dir of srcDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        await this.scanDirectory(fullPath);
      }
    }
    
    const rootFiles = fs.readdirSync(this.projectRoot);
    for (const file of rootFiles) {
      const fullPath = path.join(this.projectRoot, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile() && this.fileExtensions.includes(path.extname(file))) {
        await this.scanFile(fullPath);
      }
    }
    
    // Apply previously resolved conflicts
    for (const [key, value] of Object.entries(this.resolvedConflicts)) {
      if (this.fallbackConflicts[key]) {
        this.fallbackTexts[key] = value;
        delete this.fallbackConflicts[key];
      }
    }
    
    return {
      usedKeys: this.usedKeys,
      fallbackTexts: this.fallbackTexts,
      keyUsageMap: this.keyUsageMap,
      conflicts: this.fallbackConflicts
    };
  }

  // Scan directory recursively
  async scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.excludeDirs.includes(item)) {
          await this.scanDirectory(fullPath);
        } else if (stat.isFile() && this.fileExtensions.includes(path.extname(item))) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  // Enhanced scan file with new patterns
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      // Enhanced patterns including optional chaining
      const patterns = [
        // t.key || 'fallback' patterns (with fallback)
        /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\[`([a-zA-Z_][a-zA-Z0-9_]*)`\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        
        // Optional chaining patterns with fallback
        /\bt\?\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\?\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\?\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        
        // {t.key || 'fallback'} in JSX
        /\{t\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        /\{t\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        /\{t\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        /\{t\?\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        
        // Simple patterns (without fallback)
        /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]/g,
        /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]/g,
        /\bt\[`([a-zA-Z_][a-zA-Z0-9_]*)`\]/g,
        
        // Optional chaining without fallback
        /\bt\?\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /\bt\?\['([a-zA-Z_][a-zA-Z0-9_]*)'\]/g,
        /\bt\?\["([a-zA-Z_][a-zA-Z0-9_]*)"\]/g,
        
        // $t patterns (Vue style)
        /\$t\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /\$t\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g,
        
        // useTranslation hook patterns
        /translation\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g,
        /translate\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g
      ];
      
      const lines = content.split('\n');
      const processedMatches = new Set();
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        pattern.lastIndex = 0;
        const matches = content.matchAll(pattern);
        
        for (const match of matches) {
          const key = match[1];
          const position = match.index;
          
          const matchId = `${key}-${position}`;
          if (processedMatches.has(matchId)) {
            continue;
          }
          processedMatches.add(matchId);
          
          this.usedKeys.add(key);
          
          // Find line number
          let lineNumber = 1;
          let charCount = 0;
          
          for (let j = 0; j < lines.length; j++) {
            charCount += lines[j].length + 1;
            if (charCount > position) {
              lineNumber = j + 1;
              break;
            }
          }
          
          const location = {
            file: relativePath,
            line: lineNumber,
            fallback: null
          };
          
          // For patterns with fallback text (patterns 0-10)
          if (i < 11 && match[2]) {
            const fullFallbackMatch = match[2];
            
            const parsedQuote = this.parseQuotedString(fullFallbackMatch, 0);
            if (parsedQuote) {
              const fallbackContent = parsedQuote.content;
              
              location.fallback = fullFallbackMatch;
              
              if (this.fallbackTexts[key]) {
                if (this.fallbackTexts[key] !== fallbackContent) {
                  if (!this.fallbackConflicts[key]) {
                    this.fallbackConflicts[key] = [];
                    
                    const originalLocations = this.keyUsageMap.get(key)
                      ?.filter(loc => {
                        if (loc.fallback) {
                          const originalParsed = this.parseQuotedString(loc.fallback, 0);
                          return originalParsed && originalParsed.content === this.fallbackTexts[key];
                        }
                        return false;
                      }) || [];
                    
                    if (originalLocations.length > 0) {
                      const originalWithQuotes = originalLocations[0].fallback;
                      this.fallbackConflicts[key].push({
                        text: originalWithQuotes,
                        locations: originalLocations
                      });
                    }
                  }
                  
                  let existingConflict = this.fallbackConflicts[key]
                    .find(c => {
                      const parsed = this.parseQuotedString(c.text, 0);
                      return parsed && parsed.content === fallbackContent;
                    });
                  
                  if (existingConflict) {
                    const locationExists = existingConflict.locations.some(
                      loc => loc.file === location.file && loc.line === location.line
                    );
                    if (!locationExists) {
                      existingConflict.locations.push(location);
                    }
                  } else {
                    this.fallbackConflicts[key].push({
                      text: fullFallbackMatch,
                      locations: [location]
                    });
                  }
                }
              } else {
                this.fallbackTexts[key] = fallbackContent;
              }
            }
          }
          
          if (!this.keyUsageMap.has(key)) {
            this.keyUsageMap.set(key, []);
          }
          
          const existingLocations = this.keyUsageMap.get(key);
          const locationExists = existingLocations.some(
            loc => loc.file === location.file && loc.line === location.line
          );
          
          if (!locationExists) {
            this.keyUsageMap.get(key).push(location);
          }
        }
      }
      
      // Check for dynamic keys
      const dynamicPatterns = [
        /\bt\[([^'"`\]]+)\]/g,
        /\bt\?\[([^'"`\]]+)\]/g,
        /\$t\(([^'"`\)]+)\)/g
      ];
      
      for (const pattern of dynamicPatterns) {
        pattern.lastIndex = 0;
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const expression = match[1];
          if (!expression.match(/^['"`]/)) {
            print(`  ℹ️  Dynamic translation key found in ${relativePath}: t[${expression}]`, 'dim');
          }
        }
      }
      
    } catch (error) {
      print(`  ⚠️  Error scanning ${filePath}: ${error.message}`, 'yellow');
    }
  }

  // Get detailed usage report for a key
  getKeyUsageReport(key) {
    const locations = this.keyUsageMap.get(key) || [];
    return {
      key,
      fallback: this.fallbackTexts[key] || null,
      usageCount: locations.length,
      locations: this.deduplicateLocations(locations),
      hasConflict: !!this.fallbackConflicts[key]
    };
  }

  // Check if a key is used
  isKeyUsed(key) {
    return this.usedKeys.has(key);
  }
}

module.exports = TranslationScanner;