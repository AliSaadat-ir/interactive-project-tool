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
          if (this.allowExit && this.hasChanges) {
            // Ask to save changes
            const saveMenu = new SimpleMenu(
              'You have unsaved changes. What would you like to do?',
              [
                { name: 'Save changes and exit', value: 'save_exit' },
                { name: 'Discard changes and exit', value: 'discard_exit' },
                { name: 'Continue resolving conflicts', value: 'continue' }
              ]
            );
            
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', handleKeypress);
            
            const choice = await saveMenu.show();
            
            if (choice.value === 'save_exit') {
              resolve({ action: 'save_exit' });
            } else if (choice.value === 'discard_exit') {
              resolve({ action: 'discard_exit' });
            } else {
              // Continue - re-setup handler
              process.stdin.setRawMode(true);
              process.stdin.resume();
              process.stdin.on('data', handleKeypress);
              this.render();
            }
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
      print('Press Ctrl+C to exit (with save options)', 'dim');
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
    let count = 0;
    Object.values(this.fallbackConflicts).forEach(conflicts => {
      count += conflicts.length;
    });
    return count;
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

  // Apply key changes to files
  async applyKeyChanges() {
    if (Object.keys(this.keyChanges).length === 0) return;
    
    printHeader();
    print('🔄 Applying key changes to files...', 'yellow');
    console.log();
    
    const changedFiles = new Set();
    
    for (const [oldKey, newKey] of Object.entries(this.keyChanges)) {
      const locations = this.keyUsageMap.get(oldKey) || [];
      
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
          print(`  ✅ Updated ${location.file}`, 'green');
        } catch (error) {
          print(`  ❌ Failed to update ${location.file}: ${error.message}`, 'red');
        }
      }
    }
    
    print(`\n📝 Updated ${changedFiles.size} files with key changes`, 'cyan');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Enhanced resolve fallback conflicts
  async resolveFallbackConflicts() {
    printHeader();
    print('🔧 RESOLVE FALLBACK CONFLICTS', 'yellow');
    console.log();
    
    const conflictKeys = Object.keys(this.fallbackConflicts);
    const totalConflicts = this.getConflictCount();
    
    print(`📊 Found ${conflictKeys.length} keys with conflicts`, 'cyan');
    print(`📝 Total conflict variations: ${totalConflicts}`, 'cyan');
    console.log();
    
    const startMenu = new SimpleMenu(
      'How would you like to proceed?',
      [
        { name: `Resolve all ${conflictKeys.length} conflicts`, value: 'resolve_all' },
        { name: 'View conflict summary first', value: 'view_summary' },
        { name: 'Skip conflict resolution', value: 'skip' }
      ]
    );
    
    const startChoice = await startMenu.show();
    
    if (startChoice.value === 'skip') {
      return;
    }
    
    if (startChoice.value === 'view_summary') {
      await this.showConflictSummary();
    }
    
    let resolvedCount = 0;
    let skippedCount = 0;
    let keyChangeCount = 0;
    
    for (let i = 0; i < conflictKeys.length; i++) {
      const key = conflictKeys[i];
      const conflicts = this.fallbackConflicts[key];
      
      printHeader();
      print(`📝 Conflict ${i + 1} of ${conflictKeys.length}`, 'cyan');
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
        { name: '⏭️  Skip this conflict', value: 'skip' }
      );
      
      const menu = new DetailedConflictMenu(
        'Select action:',
        options,
        details,
        true // Allow exit
      );
      
      const selected = await menu.show();
      
      // Handle exit actions
      if (selected.action === 'save_exit') {
        await this.saveResolvedConflicts();
        print('\n✅ Changes saved. Exiting conflict resolution...', 'green');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return;
      } else if (selected.action === 'discard_exit') {
        print('\n❌ Changes discarded. Exiting conflict resolution...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return;
      }
      
      if (selected.value === 'change_key') {
        // Handle key changes
        const keyChangeResult = await this.handleKeyChange(key, textGroups);
        if (keyChangeResult.changed) {
          keyChangeCount += keyChangeResult.count;
          resolvedCount++;
        }
      } else if (selected.value === 'custom') {
        const { askQuestion } = require('../core/input');
        const customText = await askQuestion('Enter custom fallback text: ');
        this.fallbackTexts[key] = customText.trim() || Object.keys(textGroups)[0];
        this.resolvedConflicts[key] = this.fallbackTexts[key];
        resolvedCount++;
        print(`✅ Set custom text: "${this.fallbackTexts[key]}"`, 'green');
      } else if (selected.value === 'skip') {
        this.fallbackTexts[key] = Object.keys(textGroups)[0];
        skippedCount++;
        print(`⏭️  Skipped (using first found: "${this.fallbackTexts[key]}")`, 'yellow');
      } else {
        this.fallbackTexts[key] = selected.value;
        this.resolvedConflicts[key] = selected.value;
        resolvedCount++;
        print(`✅ Selected: "${this.fallbackTexts[key]}"`, 'green');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Apply key changes if any
    if (keyChangeCount > 0) {
      await this.applyKeyChanges();
    }
    
    // Summary
    printHeader();
    print('📊 Conflict Resolution Summary', 'cyan');
    console.log();
    print(`✅ Resolved: ${resolvedCount} conflicts`, 'green');
    print(`🔄 Key changes: ${keyChangeCount} keys`, 'cyan');
    print(`⏭️  Skipped: ${skippedCount} conflicts`, 'yellow');
    print(`📝 Total: ${conflictKeys.length} conflicts`, 'white');
    
    this.fallbackConflicts = {};
  }

  // Handle key change for conflicts
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
    const selectedTexts = await menu.show();
    
    if (selectedTexts.length === 0) {
      print('\n❌ No texts selected for key change', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { changed: false, count: 0 };
    }
    
    // Generate key suggestions
    const suggestions = this.generateNewKeys(baseKey, selectedTexts.length);
    const keyAssignments = {};
    
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
      
      keyAssignments[text] = newKey;
      print(`\n✅ Assigned: ${baseKey} → ${newKey} for "${text}"`, 'green');
      
      // Update internal mappings
      const group = textGroups[text];
      group.locations.forEach(loc => {
        // Create new key entry
        if (!this.keyUsageMap.has(newKey)) {
          this.keyUsageMap.set(newKey, []);
        }
        this.keyUsageMap.get(newKey).push(loc);
        
        // Track key change
        this.keyChanges[baseKey] = newKey;
      });
      
      this.usedKeys.add(newKey);
      this.fallbackTexts[newKey] = text;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Keep the original key for texts not selected
    const remainingTexts = Object.keys(textGroups).filter(t => !selectedTexts.includes(t));
    if (remainingTexts.length > 0) {
      this.fallbackTexts[baseKey] = remainingTexts[0];
    }
    
    return { changed: true, count: selectedTexts.length };
  }

  // Show conflict summary
  async showConflictSummary() {
    printHeader();
    print('📊 CONFLICT SUMMARY', 'yellow');
    console.log();
    
    const conflictKeys = Object.keys(this.fallbackConflicts);
    
    conflictKeys.forEach((key, index) => {
      const conflicts = this.fallbackConflicts[key];
      print(`${index + 1}. Key: "${key}"`, 'cyan');
      
      const textGroups = {};
      conflicts.forEach(conflict => {
        const normalizedContent = this.extractTextContent(conflict.text);
        if (!textGroups[normalizedContent]) {
          textGroups[normalizedContent] = {
            count: 0,
            variations: []
          };
        }
        textGroups[normalizedContent].count += conflict.locations.length;
        if (!textGroups[normalizedContent].variations.includes(conflict.text)) {
          textGroups[normalizedContent].variations.push(conflict.text);
        }
      });
      
      Object.entries(textGroups).forEach(([content, group]) => {
        print(`   - "${content}" (${group.count} uses)`, 'white');
        if (group.variations.length > 1) {
          print(`     Variations: ${group.variations.join(', ')}`, 'dim');
        }
      });
      console.log();
    });
    
    print('Press Enter to continue...', 'dim');
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
  }

  // Save resolved conflicts
  async saveResolvedConflicts() {
    // In a real implementation, you might want to save to a file
    // For now, just update the fallbackTexts
    Object.assign(this.fallbackTexts, this.resolvedConflicts);
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

  // Scan entire project
  async scanProject() {
    print('🔍 Scanning project for translation usage...', 'cyan');
    
    this.usedKeys.clear();
    this.fallbackTexts = {};
    this.fallbackConflicts = {};
    this.keyUsageMap.clear();
    this.keyChanges = {};
    
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