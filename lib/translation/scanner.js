// === TRANSLATION SCANNER ===
// Scans project files for translation key usage

const fs = require('fs');
const path = require('path');
const { print, printHeader, clearScreen } = require('../core/terminal');
const { SimpleMenu } = require('../core/menu');

// Enhanced menu with details display
class DetailedMenu extends SimpleMenu {
  constructor(title, options, details = {}) {
    super(title, options);
    this.details = details;
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
        selectedOption.value !== 'skip') {
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
    print('Press Ctrl+C to exit', 'dim');
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
  }

  // Extract the actual text content without quotes
  extractTextContent(text) {
    return text.replace(/^['"`]|['"`]$/g, '');
  }

  // FIXED: Proper quote parsing - matches opening and closing quotes
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
        // Found matching closing quote
        return {
          fullMatch: openQuote + content + openQuote,
          content: content,
          endIndex: i
        };
      } else if (char === '\\' && i + 1 < text.length) {
        // Handle escaped characters
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
    
    // No matching closing quote found
    return null;
  }

  // Check if there are conflicts
  hasConflicts() {
    return Object.keys(this.fallbackConflicts).length > 0;
  }

  // Scan entire project
  async scanProject() {
    print('🔍 Scanning project for translation usage...', 'cyan');
    
    this.usedKeys.clear();
    this.fallbackTexts = {};
    this.fallbackConflicts = {};
    this.keyUsageMap.clear();
    
    // Scan common source directories
    const srcDirs = ['components', 'app', 'src', 'pages', 'lib', 'utils'];
    
    for (const dir of srcDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        await this.scanDirectory(fullPath);
      }
    }
    
    // Also scan root level files
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

  // Deduplicate locations array
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
      // Sort by file name first, then by line number
      const fileCompare = a.file.localeCompare(b.file);
      if (fileCompare !== 0) return fileCompare;
      return a.line - b.line;
    });
  }

  // FIXED: Resolve fallback conflicts with smart grouping
  async resolveFallbackConflicts() {
    printHeader();
    print('🔧 RESOLVE FALLBACK CONFLICTS', 'yellow');
    console.log();
    
    const conflictKeys = Object.keys(this.fallbackConflicts);
    let resolvedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < conflictKeys.length; i++) {
      const key = conflictKeys[i];
      const conflicts = this.fallbackConflicts[key];
      
      printHeader();
      print(`📝 Conflict ${i + 1} of ${conflictKeys.length}`, 'cyan');
      print(`🔑 Key: "${key}"`, 'yellow');
      console.log();
      print('Found different fallback texts in your code:', 'white');
      console.log();
      
      // FIXED: Group by normalized text content (ignoring quote types but case-sensitive)
      const textGroups = {};
      conflicts.forEach(conflict => {
        const normalizedContent = this.extractTextContent(conflict.text);
        if (!textGroups[normalizedContent]) {
          textGroups[normalizedContent] = {
            variations: [],
            locations: []
          };
        }
        
        // Track this specific variation if not already present
        if (!textGroups[normalizedContent].variations.includes(conflict.text)) {
          textGroups[normalizedContent].variations.push(conflict.text);
        }
        
        textGroups[normalizedContent].locations.push(...conflict.locations);
      });
      
      // Create options from grouped texts
      const options = [];
      const details = {};
      
      Object.entries(textGroups).forEach(([content, group]) => {
        // Deduplicate locations
        group.locations = this.deduplicateLocations(group.locations);
        
        // Create display text showing all variations if multiple
        let displayText;
        if (group.variations.length > 1) {
          displayText = `"${content}" (variations: ${group.variations.join(', ')})`;
        } else {
          displayText = group.variations[0];
        }
        
        const optionName = `${displayText} (used in ${group.locations.length} location${group.locations.length > 1 ? 's' : ''})`;
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
      
      // Add custom and skip options
      options.push(
        { name: '✏️  Enter custom text', value: 'custom' },
        { name: '⏭️  Skip this conflict', value: 'skip' }
      );
      
      const menu = new DetailedMenu(
        'Select the fallback text to use:',
        options,
        details
      );
      
      const selected = await menu.show();
      
      if (selected.value === 'custom') {
        const { askQuestion } = require('../core/input');
        const customText = await askQuestion('Enter custom fallback text: ');
        this.fallbackTexts[key] = customText.trim() || Object.keys(textGroups)[0];
        resolvedCount++;
        print(`✅ Set custom text: "${this.fallbackTexts[key]}"`, 'green');
      } else if (selected.value === 'skip') {
        // Use the first found text as default
        this.fallbackTexts[key] = Object.keys(textGroups)[0];
        skippedCount++;
        print(`⏭️  Skipped (using first found: "${this.fallbackTexts[key]}")`, 'yellow');
      } else {
        this.fallbackTexts[key] = selected.value;
        resolvedCount++;
        print(`✅ Selected: "${this.fallbackTexts[key]}"`, 'green');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    printHeader();
    print('📊 Conflict Resolution Summary', 'cyan');
    console.log();
    print(`✅ Resolved: ${resolvedCount} conflicts`, 'green');
    print(`⏭️  Skipped: ${skippedCount} conflicts`, 'yellow');
    print(`📝 Total: ${conflictKeys.length} conflicts`, 'white');
    
    // Clear conflicts after resolution
    this.fallbackConflicts = {};
  }

  // Get line preview for a file
  getLinePreview(filePath, lineNumber) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      if (lineNumber > 0 && lineNumber <= lines.length) {
        const line = lines[lineNumber - 1].trim();
        // Truncate long lines
        return line.length > 60 ? line.substring(0, 57) + '...' : line;
      }
    } catch (error) {
      // Ignore errors
    }
    return '';
  }

  // Scan a directory recursively
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

  // FIXED: Scan a single file with improved quote handling
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      // FIXED: Improved patterns with better quote handling
      const patterns = [
        // t.key || 'fallback' patterns (with fallback)
        /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        /\bt\[`([a-zA-Z_][a-zA-Z0-9_]*)`\]\s*\|\|\s*(['"`][^'"`]*['"`])/g,
        
        // {t.key || 'fallback'} in JSX
        /\{t\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        /\{t\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        /\{t\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*(['"`][^'"`]*['"`])\}/g,
        
        // Simple patterns (without fallback)
        /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]/g,
        /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]/g,
        /\bt\[`([a-zA-Z_][a-zA-Z0-9_]*)`\]/g,
        
        // $t patterns (Vue style)
        /\$t\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
        /\$t\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g,
        
        // useTranslation hook patterns
        /translation\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g,
        /translate\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g
      ];
      
      // Track line numbers for better reporting
      const lines = content.split('\n');
      
      // Track processed matches to avoid duplicates
      const processedMatches = new Set();
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        pattern.lastIndex = 0; // Reset regex state
        const matches = content.matchAll(pattern);
        
        for (const match of matches) {
          const key = match[1];
          const position = match.index;
          
          // Create unique identifier for this match
          const matchId = `${key}-${position}`;
          if (processedMatches.has(matchId)) {
            continue; // Skip if already processed
          }
          processedMatches.add(matchId);
          
          this.usedKeys.add(key);
          
          // Find line number
          let lineNumber = 1;
          let charCount = 0;
          
          for (let j = 0; j < lines.length; j++) {
            charCount += lines[j].length + 1; // +1 for newline
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
          
          // For patterns with fallback text (patterns 0-6)
          if (i < 7 && match[2]) {
            const fullFallbackMatch = match[2]; // This includes quotes
            
            // FIXED: Parse the quoted string properly
            const parsedQuote = this.parseQuotedString(fullFallbackMatch, 0);
            if (parsedQuote) {
              const fallbackContent = parsedQuote.content;
              
              location.fallback = fullFallbackMatch;
              
              // Check for conflicts based on content only (case-sensitive)
              if (this.fallbackTexts[key]) {
                if (this.fallbackTexts[key] !== fallbackContent) {
                  // Track conflict with location
                  if (!this.fallbackConflicts[key]) {
                    this.fallbackConflicts[key] = [];
                    
                    // Add the original text with its locations
                    const originalLocations = this.keyUsageMap.get(key)
                      ?.filter(loc => {
                        if (loc.fallback) {
                          const originalParsed = this.parseQuotedString(loc.fallback, 0);
                          return originalParsed && originalParsed.content === this.fallbackTexts[key];
                        }
                        return false;
                      }) || [];
                    
                    if (originalLocations.length > 0) {
                      // Find the original fallback text with quotes
                      const originalWithQuotes = originalLocations[0].fallback;
                      this.fallbackConflicts[key].push({
                        text: originalWithQuotes,
                        locations: originalLocations
                      });
                    }
                  }
                  
                  // Check if this text variant is already tracked
                  let existingConflict = this.fallbackConflicts[key]
                    .find(c => {
                      const parsed = this.parseQuotedString(c.text, 0);
                      return parsed && parsed.content === fallbackContent;
                    });
                  
                  if (existingConflict) {
                    // Check if this exact location is already tracked
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
                // Store just the content (without quotes) as the fallback text
                this.fallbackTexts[key] = fallbackContent;
              }
            }
          }
          
          // Track usage location
          if (!this.keyUsageMap.has(key)) {
            this.keyUsageMap.set(key, []);
          }
          
          // Check if this exact location is already tracked
          const existingLocations = this.keyUsageMap.get(key);
          const locationExists = existingLocations.some(
            loc => loc.file === location.file && loc.line === location.line
          );
          
          if (!locationExists) {
            this.keyUsageMap.get(key).push(location);
          }
        }
      }
      
      // Also check for dynamic keys (these need manual review)
      const dynamicPatterns = [
        /\bt\[([^'"`\]]+)\]/g, // t[variable]
        /\$t\(([^'"`\)]+)\)/g  // $t(variable)
      ];
      
      for (const pattern of dynamicPatterns) {
        pattern.lastIndex = 0; // Reset regex state
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const expression = match[1];
          // Only flag if it's actually a variable (not a string literal we already caught)
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