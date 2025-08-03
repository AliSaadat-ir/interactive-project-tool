// === TRANSLATION SCANNER ===
// Scans project files for translation key usage

const fs = require('fs');
const path = require('path');
const { print } = require('../core/terminal');

class TranslationScanner {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.usedKeys = new Set();
    this.fallbackTexts = {};
    this.keyUsageMap = new Map(); // key -> array of file locations
    this.fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    this.excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next'];
  }

  // Scan entire project
  async scanProject() {
    print('🔍 Scanning project for translation usage...', 'cyan');
    
    this.usedKeys.clear();
    this.fallbackTexts = {};
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
      keyUsageMap: this.keyUsageMap
    };
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

  // Scan a single file
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      // Patterns to match translation usage with improved detection
      const patterns = [
        // t.key || 'fallback' patterns (with fallback)
        /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
        /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
        /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
        /\bt\[`([a-zA-Z_][a-zA-Z0-9_]*)`\]\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
        
        // {t.key || 'fallback'} in JSX
        /\{t\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*['"`]([^'"`]+)['"`]\}/g,
        /\{t\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*['"`]([^'"`]+)['"`]\}/g,
        /\{t\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*['"`]([^'"`]+)['"`]\}/g,
        
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
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        const matches = content.matchAll(pattern);
        
        for (const match of matches) {
          const key = match[1];
          this.usedKeys.add(key);
          
          // Store fallback text if available (patterns 0-6 have fallback)
          if (i < 7 && match[2]) {
            // If we already have a fallback for this key, check if it's different
            if (this.fallbackTexts[key] && this.fallbackTexts[key] !== match[2]) {
              print(`  ⚠️  Key "${key}" has different fallback texts:`, 'yellow');
              print(`     "${this.fallbackTexts[key]}" vs "${match[2]}"`, 'dim');
            }
            this.fallbackTexts[key] = match[2];
          }
          
          // Track usage location
          if (!this.keyUsageMap.has(key)) {
            this.keyUsageMap.set(key, []);
          }
          
          // Find line number
          const position = match.index;
          let lineNumber = 1;
          let charCount = 0;
          
          for (let j = 0; j < lines.length; j++) {
            charCount += lines[j].length + 1; // +1 for newline
            if (charCount > position) {
              lineNumber = j + 1;
              break;
            }
          }
          
          this.keyUsageMap.get(key).push({
            file: relativePath,
            line: lineNumber
          });
        }
      }
      
      // Also check for dynamic keys (these need manual review)
      const dynamicPatterns = [
        /\bt\[([^'"`\]]+)\]/g, // t[variable]
        /\$t\(([^'"`\)]+)\)/g  // $t(variable)
      ];
      
      for (const pattern of dynamicPatterns) {
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
      locations: locations
    };
  }

  // Check if a key is used
  isKeyUsed(key) {
    return this.usedKeys.has(key);
  }
}

module.exports = TranslationScanner;