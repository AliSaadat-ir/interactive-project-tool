// === ENHANCED TRANSLATION SCANNER ===
// lib/translation/scanner.js

const fs = require('fs');
const path = require('path');
const { print, printHeader, clearScreen } = require('../core/terminal');
const { SimpleMenu } = require('../core/menu');
const { askQuestion } = require('../core/input');

// Save/Exit menu for conflict resolution
class SaveExitMenu extends SimpleMenu {
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
          resolve(this.options[this.selectedIndex]);
        } else if (key === '\u001b[A') { // Up arrow
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
        } else if (key === '\u001b[B') { // Down arrow
          this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
          this.render();
        }
      };

      process.stdin.on('data', handleKeypress);
    });
  }
}

// Enhanced menu with details display and exit option
class DetailedConflictMenu extends SimpleMenu {
  constructor(title, options, details = {}, conflictInfo = {}) {
    super(title, options);
    this.details = details;
    this.conflictInfo = conflictInfo;
  }

  async show() {
    return new Promise((resolve) => {
      this.render();

      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleKeypress = async (key) => {
        if (key === '\u0003') { // Ctrl+C
          // Show save/exit options
          clearScreen();
          print('💾 You pressed Ctrl+C', 'yellow');
          console.log();
          
          const saveExitMenu = new SaveExitMenu(
            'What would you like to do?',
            [
              { name: '💾 Save progress and exit to menu', value: 'save_exit' },
              { name: '🗑️  Discard changes and exit to menu', value: 'discard_exit' },
              { name: '↩️  Continue resolving conflicts', value: 'continue' }
            ]
          );
          
          const choice = await saveExitMenu.show();
          
          process.stdin.setRawMode(true);
          process.stdin.resume();
          
          if (choice.value !== 'continue') {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            process.stdin.removeListener('data', handleKeypress);
            resolve({ action: choice.value });
          } else {
            this.render();
          }
        } else if (key === '\r' || key === '\n') { // Enter
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handleKeypress);
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
    
    // Show conflict progress
    if (this.conflictInfo.current && this.conflictInfo.total) {
      print(`📊 Conflict ${this.conflictInfo.current} of ${this.conflictInfo.total} (Resolved: ${this.conflictInfo.resolved})`, 'cyan');
      console.log();
    }
    
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

    // Show file details below options
    const selectedOption = this.options[this.selectedIndex];
    if (this.details[selectedOption.value] && 
        selectedOption.value !== 'custom' && 
        selectedOption.value !== 'skip' &&
        selectedOption.value !== 'change_key') {
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
    print('Press Ctrl+C for save/exit options', 'cyan');
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
      pendingChanges: {},
      sessionStartTime: new Date().toISOString()
    };
    this.conflictStateFile = path.join(this.projectRoot, '.translation-conflicts-state.json');
    this.changedKeys = new Map(); // Track changed keys to avoid re-processing
    this.projectToolIgnorePatterns = [];
    this.hasLoadedIgnorePatterns = false;
  }

  // Load .projecttoolignore patterns
  loadProjectToolIgnore() {
    const projectToolIgnorePath = path.join(this.projectRoot, '.projecttoolignore');
    
    if (fs.existsSync(projectToolIgnorePath)) {
      this.projectToolIgnorePatterns = this.parseIgnoreFile(projectToolIgnorePath);
      this.hasLoadedIgnorePatterns = true;
      return true;
    }
    
    // If .projecttoolignore doesn't exist, try to create it from .gitignore
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    if (!this.hasLoadedIgnorePatterns && fs.existsSync(gitignorePath)) {
      print('📋 Creating .projecttoolignore from .gitignore...', 'cyan');
      
      try {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const header = `# Project Tool Ignore File
# This file was auto-generated from .gitignore
# You can modify it to customize ignore patterns for the project tool
# It works similarly to .gitignore but is specific to the project tool

`;
        fs.writeFileSync(projectToolIgnorePath, header + gitignoreContent, 'utf8');
        this.projectToolIgnorePatterns = this.parseIgnoreFile(projectToolIgnorePath);
        this.hasLoadedIgnorePatterns = true;
        print('✅ Created .projecttoolignore from .gitignore', 'green');
        return true;
      } catch (error) {
        print(`⚠️  Could not create .projecttoolignore: ${error.message}`, 'yellow');
      }
    }
    
    return false;
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
    
    // Check existing keys to avoid duplicates
    const existingKeys = new Set([...this.usedKeys, ...this.changedKeys.values()]);
    
    // Try numeric suffixes first
    let suffix = 1;
    while (suggestions.length < count) {
      const newKey = `${baseKey}${suffix}`;
      if (!existingKeys.has(newKey)) {
        suggestions.push(newKey);
      }
      suffix++;
    }
    
    // Add descriptive suffixes if needed
    const descriptiveSuffixes = ['Alt', 'Alternative', 'Variant', 'Version2', 'Secondary', 'Option'];
    for (const desc of descriptiveSuffixes) {
      if (suggestions.length >= count) break;
      const newKey = `${baseKey}${desc}`;
      if (!existingKeys.has(newKey)) {
        suggestions.push(newKey);
      }
    }
    
    return suggestions;
  }

  // Apply key changes and update files
  async applyKeyChanges(keyChanges) {
    const changedFiles = new Map(); // filepath -> changes
    
    for (const [oldKey, changes] of Object.entries(keyChanges)) {
      for (const change of changes) {
        const { newKey, text, locations } = change;
        
        // Update internal structures
        this.usedKeys.add(newKey);
        this.fallbackTexts[newKey] = text;
        
        // Track changed keys
        this.changedKeys.set(oldKey, newKey);
        
        // Track file changes
        for (const location of locations) {
          const filePath = path.join(this.projectRoot, location.file);
          if (!changedFiles.has(filePath)) {
            changedFiles.set(filePath, []);
          }
          changedFiles.get(filePath).push({ oldKey, newKey, line: location.line });
        }
        
        // Update key usage map
        if (!this.keyUsageMap.has(newKey)) {
          this.keyUsageMap.set(newKey, []);
        }
        this.keyUsageMap.get(newKey).push(...locations);
      }
    }
    
    // Apply changes to files
    for (const [filePath, changes] of changedFiles) {
      await this.updateFileWithKeyChanges(filePath, changes);
    }
    
    return changedFiles.size;
  }

  // Update a single file with key changes
  async updateFileWithKeyChanges(filePath, changes) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Sort changes by line number in reverse order to avoid offset issues
      changes.sort((a, b) => b.line - a.line);
      
      for (const change of changes) {
        const { oldKey, newKey } = change;
        
        // Replace key patterns
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
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      print(`  ✅ Updated ${path.relative(this.projectRoot, filePath)}`, 'green');
      
    } catch (error) {
      print(`  ❌ Failed to update ${path.relative(this.projectRoot, filePath)}: ${error.message}`, 'red');
    }
  }

  // Save conflict resolution state
  async saveConflictState() {
    const state = {
      timestamp: new Date().toISOString(),
      sessionStartTime: this.conflictResolutionState.sessionStartTime,
      totalConflicts: this.conflictResolutionState.totalConflicts,
      resolvedConflicts: this.conflictResolutionState.resolvedConflicts,
      pendingChanges: this.conflictResolutionState.pendingChanges,
      resolvedConflicts: this.resolvedConflicts,
      keyChanges: this.keyChanges,
      remainingConflicts: this.fallbackConflicts,
      changedKeys: Array.from(this.changedKeys.entries())
    };
    
    try {
      fs.writeFileSync(this.conflictStateFile, JSON.stringify(state, null, 2), 'utf8');
      return true;
    } catch (error) {
      print(`⚠️  Could not save conflict state: ${error.message}`, 'yellow');
      return false;
    }
  }

  // Load conflict resolution state
  async loadConflictState() {
    try {
      if (fs.existsSync(this.conflictStateFile)) {
        const state = JSON.parse(fs.readFileSync(this.conflictStateFile, 'utf8'));
        
        // Check if state is from the same session (within last hour)
        const stateAge = Date.now() - new Date(state.timestamp).getTime();
        if (stateAge < 3600000) { // 1 hour
          this.conflictResolutionState = {
            totalConflicts: state.totalConflicts || 0,
            resolvedConflicts: state.resolvedConflicts || 0,
            pendingChanges: state.pendingChanges || {},
            sessionStartTime: state.sessionStartTime || new Date().toISOString()
          };
          this.resolvedConflicts = state.resolvedConflicts || {};
          this.keyChanges = state.keyChanges || {};
          
          // Restore changed keys map
          if (state.changedKeys) {
            this.changedKeys = new Map(state.changedKeys);
          }
          
          // Apply remaining conflicts
          if (state.remainingConflicts) {
            Object.assign(this.fallbackConflicts, state.remainingConflicts);
          }
          
          return true;
        }
      }
    } catch (error) {
      // Ignore load errors
    }
    return false;
  }

  // Clear conflict state
  clearConflictState() {
    try {
      if (fs.existsSync(this.conflictStateFile)) {
        fs.unlinkSync(this.conflictStateFile);
      }
    } catch (error) {
      // Ignore errors
    }
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

  // Enhanced resolve fallback conflicts with better flow
  async resolveFallbackConflicts() {
    printHeader();
    print('🔧 RESOLVE FALLBACK CONFLICTS', 'yellow');
    console.log();
    
    // Load previous state if available
    const hasState = await this.loadConflictState();
    if (hasState) {
      print('📂 Found previous conflict resolution session', 'cyan');
      print(`   Resolved: ${this.conflictResolutionState.resolvedConflicts} conflicts`, 'dim');
      console.log();
    }
    
    const conflictKeys = Object.keys(this.fallbackConflicts);
    this.conflictResolutionState.totalConflicts = conflictKeys.length;
    
    if (conflictKeys.length === 0) {
      print('✅ No conflicts to resolve!', 'green');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { saved: true, completed: true };
    }
    
    print(`📊 Found ${conflictKeys.length} keys with conflicts`, 'cyan');
    print('💡 You can save and exit at any time with Ctrl+C', 'cyan');
    console.log();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let keyIndex = 0;
    
    // Process conflicts one by one
    while (keyIndex < conflictKeys.length) {
      const key = conflictKeys[keyIndex];
      
      // Skip if key was already changed
      if (this.changedKeys.has(key)) {
        keyIndex++;
        continue;
      }
      
      const conflicts = this.fallbackConflicts[key];
      
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
        `🔑 Key: "${key}"\nFound different fallback texts:`,
        options,
        details,
        {
          current: keyIndex + 1,
          total: conflictKeys.length,
          resolved: this.conflictResolutionState.resolvedConflicts
        }
      );
      
      const selected = await menu.show();
      
      // Handle save/exit actions
      if (selected.action === 'save_exit') {
        await this.saveConflictState();
        print('\n💾 Progress saved!', 'green');
        print('✅ You can continue later from where you left off.', 'cyan');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { saved: true, completed: false };
      } else if (selected.action === 'discard_exit') {
        this.clearConflictState();
        print('\n🗑️  Changes discarded!', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { saved: false, completed: false };
      }
      
      // Handle conflict resolution
      let resolved = false;
      
      if (selected.value === 'change_key') {
        // Handle key changes
        const keyChangeResult = await this.handleKeyChange(key, textGroups);
        if (keyChangeResult.changed) {
          // Apply changes immediately
          await this.applyKeyChanges({ [key]: keyChangeResult.changes });
          
          // Remove this conflict as it's resolved
          delete this.fallbackConflicts[key];
          this.conflictResolutionState.resolvedConflicts++;
          resolved = true;
          
          print(`\n✅ Applied ${keyChangeResult.count} key changes`, 'green');
          
          // Update the usedKeys with new keys
          keyChangeResult.changes.forEach(change => {
            this.usedKeys.add(change.newKey);
            this.fallbackTexts[change.newKey] = change.text;
          });
        }
      } else if (selected.value === 'custom') {
        const customText = await askQuestion('Enter custom fallback text: ');
        if (customText.trim()) {
          this.fallbackTexts[key] = customText.trim();
          this.resolvedConflicts[key] = this.fallbackTexts[key];
          delete this.fallbackConflicts[key];
          this.conflictResolutionState.resolvedConflicts++;
          resolved = true;
          print(`✅ Set custom text: "${this.fallbackTexts[key]}"`, 'green');
        }
      } else if (selected.value === 'skip') {
        // Use first found text
        this.fallbackTexts[key] = Object.keys(textGroups)[0];
        print(`⏭️  Skipped (using: "${this.fallbackTexts[key]}")`, 'yellow');
        keyIndex++;
      } else {
        // Selected a specific text
        this.fallbackTexts[key] = selected.value;
        this.resolvedConflicts[key] = selected.value;
        delete this.fallbackConflicts[key];
        this.conflictResolutionState.resolvedConflicts++;
        resolved = true;
        print(`✅ Selected: "${this.fallbackTexts[key]}"`, 'green');
      }
      
      // Save state after each resolution
      if (resolved) {
        await this.saveConflictState();
        // If conflict was resolved, don't increment index as array has changed
      } else if (selected.value !== 'skip') {
        // Only increment if we didn't skip
        keyIndex++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // All conflicts resolved
    this.clearConflictState();
    
    printHeader();
    print('✅ All conflicts resolved!', 'green');
    print(`📊 Total resolved: ${this.conflictResolutionState.resolvedConflicts} conflicts`, 'cyan');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { saved: true, completed: true };
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
      value: content,
      group: group
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
    const changes = [];
    
    for (let i = 0; i < selectedTexts.length; i++) {
      const text = selectedTexts[i];
      const group = textGroups[text];
      
      printHeader();
      print(`🔑 Assign new key for: "${text}"`, 'cyan');
      console.log();
      
      const keyOptions = suggestions.map(key => ({ name: key, value: key }));
      keyOptions.push({ name: '✏️  Enter custom key', value: 'custom' });
      
      const keyMenu = new SimpleMenu('Select new key:', keyOptions);
      const selectedKey = await keyMenu.show();
      
      let newKey;
      if (selectedKey.value === 'custom') {
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
      
      changes.push({
        newKey: newKey,
        text: text,
        locations: group.locations
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Keep the original key for texts not selected
    const remainingTexts = Object.keys(textGroups).filter(t => !selectedTexts.includes(t));
    if (remainingTexts.length > 0) {
      this.fallbackTexts[baseKey] = remainingTexts[0];
      print(`\n📌 Keeping original key "${baseKey}" for: "${remainingTexts[0]}"`, 'cyan');
    }
    
    return { 
      changed: true, 
      count: selectedTexts.length,
      changes: changes 
    };
  }

  // Clear resolved conflicts (call before new scan)
  clearResolvedConflicts() {
    this.clearConflictState();
    this.resolvedConflicts = {};
    this.keyChanges = {};
    this.changedKeys.clear();
    this.conflictResolutionState = {
      totalConflicts: 0,
      resolvedConflicts: 0,
      pendingChanges: {},
      sessionStartTime: new Date().toISOString()
    };
  }

  // Parse ignore file
  parseIgnoreFile(filePath) {
    const patterns = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          patterns.push(line);
        }
      });
    } catch (error) {
      print(`⚠️  Error reading ignore file: ${error.message}`, 'yellow');
    }
    
    return patterns;
  }

  // Check if path should be ignored
  shouldIgnore(filePath, patterns) {
    const relativePath = path.relative(this.projectRoot, filePath);
    
    for (const pattern of patterns) {
      // Simple pattern matching (can be enhanced)
      if (relativePath.includes(pattern)) {
        return true;
      }
      
      // Glob pattern support
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(relativePath)) {
          return true;
        }
      }
    }
    
    return false;
  }

  // Scan entire project
  async scanProject() {
    print('🔍 Scanning project for translation usage...', 'cyan');
    
    // Clear previous scan data
    this.usedKeys.clear();
    this.fallbackTexts = {};
    this.fallbackConflicts = {};
    this.keyUsageMap.clear();
    
    // Load .projecttoolignore patterns
    const hasIgnoreFile = this.loadProjectToolIgnore();
    
    if (hasIgnoreFile) {
      print('📋 Using .projecttoolignore patterns', 'cyan');
    }
    
    const srcDirs = ['components', 'app', 'src', 'pages', 'lib', 'utils'];
    
    for (const dir of srcDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        await this.scanDirectory(fullPath, this.projectToolIgnorePatterns);
      }
    }
    
    const rootFiles = fs.readdirSync(this.projectRoot);
    for (const file of rootFiles) {
      const fullPath = path.join(this.projectRoot, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile() && this.fileExtensions.includes(path.extname(file))) {
        if (!this.shouldIgnore(fullPath, this.projectToolIgnorePatterns)) {
          await this.scanFile(fullPath);
        }
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
  async scanDirectory(dir, ignorePatterns = []) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldIgnore(fullPath, ignorePatterns)) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !this.excludeDirs.includes(item)) {
          await this.scanDirectory(fullPath, ignorePatterns);
        } else if (stat.isFile() && this.fileExtensions.includes(path.extname(item))) {
          await this.scanFile(fullPath);
        }
      }
    } catch (error) {
      if (error.code === 'EACCES') {
        print(`⚠️  Access denied to directory: ${dir}`, 'yellow');
      }
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
            if (this.conflictResolutionState.totalConflicts === 0) { // Only show when not in conflict resolution
              print(`  ℹ️  Dynamic translation key found in ${relativePath}: t[${expression}]`, 'dim');
            }
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

  // Get all resolved conflicts
  getResolvedConflicts() {
    return this.resolvedConflicts;
  }

  // Get pending key changes
  getPendingKeyChanges() {
    return this.keyChanges;
  }
}

module.exports = TranslationScanner;