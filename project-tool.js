#!/usr/bin/env node

// === INTERACTIVE PROJECT EXPORT/IMPORT TOOL v1.3 ===
// Save this as: project-tool.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for better terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m'
};

// Clear screen
function clearScreen() {
  console.clear();
}

// Print colored text
function print(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// Print header
function printHeader() {
  clearScreen();
  print('╔════════════════════════════════════════╗', 'cyan');
  print('║   PROJECT EXPORT/IMPORT TOOL v1.3      ║', 'cyan');
  print('╚════════════════════════════════════════╝', 'cyan');
  console.log();
}

// Simple menu without external dependencies
class SimpleMenu {
  constructor(title, options) {
    this.title = title;
    this.options = options;
    this.selectedIndex = 0;
  }

  async show() {
    return new Promise((resolve) => {
      printHeader();
      print(this.title, 'yellow');
      console.log();

      // Display options
      this.options.forEach((option, index) => {
        if (index === this.selectedIndex) {
          print(`  ▶ ${index + 1}. ${option.name}`, 'green');
        } else {
          print(`    ${index + 1}. ${option.name}`, 'white');
        }
      });

      console.log();
      print('Use arrow keys ↑↓ or number keys to select, Enter to confirm', 'dim');
      print('Press Ctrl+C to exit', 'dim');

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
          resolve(this.options[this.selectedIndex]);
        } else if (key === '\u001b[A') { // Up arrow
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.redraw();
        } else if (key === '\u001b[B') { // Down arrow
          this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
          this.redraw();
        } else if (key >= '1' && key <= '9') { // Number keys
          const index = parseInt(key) - 1;
          if (index < this.options.length) {
            this.selectedIndex = index;
            this.redraw();
          }
        }
      };

      process.stdin.on('data', handleKeypress);
    });
  }

  redraw() {
    // Clear screen for Windows compatibility
    clearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        print(`  ▶ ${index + 1}. ${option.name}`, 'green');
      } else {
        print(`    ${index + 1}. ${option.name}`, 'white');
      }
    });

    console.log();
    print('Use arrow keys ↑↓ or number keys to select, Enter to confirm', 'dim');
    print('Press Ctrl+C to exit', 'dim');
  }
}

// File selector - improved version
async function selectFile(directory, message, allowDirectories = false, filterExportFiles = false) {
  try {
    const items = fs.readdirSync(directory).filter(item => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        return allowDirectories;
      }
      
      if (filterExportFiles) {
        // Only show .txt files that contain "export" in the name
        return stat.isFile() && item.endsWith('.txt') && item.toLowerCase().includes('export');
      }
      
      return stat.isFile() && (item.endsWith('.txt') || item.endsWith('.log'));
    });

    // If filtering export files and no files found, show directories
    if (filterExportFiles && items.filter(item => {
      const stat = fs.statSync(path.join(directory, item));
      return stat.isFile();
    }).length === 0) {
      // Show only directories for navigation
      const dirs = fs.readdirSync(directory).filter(item => {
        const stat = fs.statSync(path.join(directory, item));
        return stat.isDirectory();
      });
      
      const options = dirs.map(item => ({
        name: `📁 ${item}`,
        value: item,
        isDirectory: true
      }));
      
      // Add parent directory option
      if (directory !== '/' && directory !== path.parse(directory).root) {
        options.unshift({
          name: '⬆️  .. (Parent Directory)',
          value: '..',
          isDirectory: true
        });
      }
      
      print('No export files found in this directory. Navigate to find export files.', 'yellow');
      const menu = new SimpleMenu(message, options);
      return await menu.show();
    }

    const options = items.map(item => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      const isDir = stat.isDirectory();
      const size = isDir ? '' : ` (${(stat.size / 1024).toFixed(1)}KB)`;
      return {
        name: `${isDir ? '📁' : '📄'} ${item}${size}`,
        value: item,
        isDirectory: isDir
      };
    });

    // Add parent directory option if not at root
    if (directory !== '/' && directory !== path.parse(directory).root) {
      options.unshift({
        name: '⬆️  .. (Parent Directory)',
        value: '..',
        isDirectory: true
      });
    }

    const menu = new SimpleMenu(message, options);
    return await menu.show();
  } catch (error) {
    print(`Error reading directory: ${error.message}`, 'red');
    return null;
  }
}

// Ask question with better PowerShell compatibility
async function askQuestion(question) {
  return new Promise((resolve) => {
    // Ensure stdin is not in raw mode
    if (process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
    }
    
    // Create a new readline interface for this question
    const rlQuestion = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    rlQuestion.question(colors.cyan + question + colors.reset, (answer) => {
      rlQuestion.close();
      resolve(answer);
    });
  });
}

// Wait for Enter key
function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

// Collect multi-line input for tree structure
async function collectTreeInput() {
  return new Promise((resolve) => {
    print('Enter the folder tree structure:', 'cyan');
    print('(Paste your tree, then type "DONE" on a new line to finish)', 'dim');
    print('Example:', 'dim');
    print('project-name', 'dim');
    print('├── src/', 'dim');
    print('│   └── index.js', 'dim');
    print('└── package.json', 'dim');
    print('DONE', 'dim');
    console.log();
    
    // Ensure stdin is not in raw mode
    if (process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
    }
    
    const lines = [];
    const rlTree = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false // Important for PowerShell
    });
    
    rlTree.on('line', (line) => {
      if (line.trim().toUpperCase() === 'DONE') {
        rlTree.close();
      } else {
        lines.push(line);
      }
    });
    
    rlTree.on('close', () => {
      resolve(lines.join('\n'));
    });
  });
}

// Build folder tree for a directory
function buildFolderTree(dir, prefix = '', isLast = true) {
  const items = fs.readdirSync(dir).filter(item => {
    const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode'];
    const IGNORE_FILES = ['.gitignore', 'package-lock.json', 'yarn.lock'];
    
    const fullPath = path.join(dir, item);
    
    try {
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        return !IGNORE_DIRS.includes(item);
      } else {
        return !IGNORE_FILES.includes(item);
      }
    } catch (error) {
      return false;
    }
  });

  let tree = '';
  
  if (items.length === 0) {
    tree += prefix + '└── (empty)\n';
    return tree;
  }
  
  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (error) {
      return;
    }
    
    const isDirectory = stat.isDirectory();
    const isLastItem = index === items.length - 1;
    
    const linePrefix = prefix + (isLast ? '    ' : '│   ');
    const marker = isLastItem ? '└── ' : '├── ';
    
    tree += prefix + marker + item;
    if (isDirectory) {
      tree += '/\n';
      tree += buildFolderTree(fullPath, linePrefix, isLastItem);
    } else {
      tree += '\n';
    }
  });
  
  return tree;
}

// Parse tree structure from text - improved version
function parseTreeStructure(treeText) {
  const lines = treeText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const structure = [];
  const stack = [];
  
  lines.forEach((line, index) => {
    // Remove duplicate lines (PowerShell paste issue)
    if (index > 0 && line === lines[index - 1]) {
      return;
    }
    
    // Calculate indent level
    let indent = 0;
    let i = 0;
    
    // Count leading spaces and tree characters
    while (i < line.length) {
      if (line[i] === ' ') {
        indent++;
      } else if (line[i] === '│' || line[i] === '├' || line[i] === '└' || line[i] === '─') {
        // Skip tree drawing characters
      } else {
        break;
      }
      i++;
    }
    
    // Extract name
    const name = line.substring(i).trim();
    if (!name) return;
    
    // Determine if it's a directory
    const isDirectory = name.endsWith('/');
    const cleanName = isDirectory ? name.slice(0, -1) : name;
    
    // Calculate depth based on indent (approximate)
    const depth = Math.floor(indent / 4);
    
    const item = {
      name: cleanName,
      type: isDirectory ? 'directory' : 'file',
      children: []
    };
    
    // First item is root
    if (structure.length === 0) {
      item.type = 'directory'; // Root is always a directory
      structure.push(item);
      stack.push({ item, depth: 0 });
    } else {
      // Find parent based on depth
      while (stack.length > 1 && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }
      
      if (stack.length > 0) {
        const parent = stack[stack.length - 1].item;
        parent.children.push(item);
        stack.push({ item, depth });
      }
    }
  });
  
  return structure;
}

// Count items in tree structure
function countTreeItems(structure) {
  let count = 0;
  
  function traverse(items) {
    items.forEach(item => {
      count++;
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  }
  
  traverse(structure);
  return count;
}

// Create file/folder structure from parsed tree
function createStructureFromTree(structure, basePath) {
  const stats = { folders: 0, files: 0 };
  
  function createItems(items, currentPath) {
    items.forEach(item => {
      const itemPath = path.join(currentPath, item.name);
      
      if (item.type === 'directory') {
        if (!fs.existsSync(itemPath)) {
          fs.mkdirSync(itemPath, { recursive: true });
          stats.folders++;
        }
        
        if (item.children && item.children.length > 0) {
          createItems(item.children, itemPath);
        }
      } else {
        // Create empty file
        if (!fs.existsSync(itemPath)) {
          const dir = path.dirname(itemPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(itemPath, '');
          stats.files++;
        }
      }
    });
  }
  
  createItems(structure, basePath);
  return stats;
}

// Export functionality
async function exportProject() {
  printHeader();
  print('📤 EXPORT PROJECT', 'yellow');
  console.log();

  // Ask for directory to export
  print('Select directory to export:', 'cyan');
  
  let currentDir = process.cwd();
  let selectedDir = null;

  while (!selectedDir) {
    const selected = await selectFile(currentDir, `Current: ${currentDir}`, true);
    
    if (!selected) break;

    if (selected.value === '..') {
      currentDir = path.dirname(currentDir);
    } else if (selected.isDirectory) {
      currentDir = path.join(currentDir, selected.value);
    } else {
      print('Please select a directory, not a file!', 'red');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Ask for confirmation
    printHeader();
    const confirmMenu = new SimpleMenu(
      `Export directory: ${currentDir}?`,
      [
        { name: 'Yes, export this directory', value: 'yes' },
        { name: 'No, select another directory', value: 'no' },
        { name: 'Cancel', value: 'cancel' }
      ]
    );
    
    const confirm = await confirmMenu.show();
    
    if (confirm.value === 'yes') {
      selectedDir = currentDir;
    } else if (confirm.value === 'cancel') {
      return;
    }
  }

  if (!selectedDir) return;

  // Check for .gitignore file
  let useGitignore = false;
  const gitignorePath = path.join(selectedDir, '.gitignore');
  
  if (fs.existsSync(gitignorePath)) {
    printHeader();
    print('📋 Found .gitignore file in the selected directory', 'yellow');
    console.log();
    
    const gitignoreMenu = new SimpleMenu(
      'Would you like to use .gitignore patterns for filtering?',
      [
        { name: 'Yes, use .gitignore patterns', value: 'yes' },
        { name: 'No, use default filters only', value: 'no' }
      ]
    );
    
    const gitignoreChoice = await gitignoreMenu.show();
    useGitignore = gitignoreChoice.value === 'yes';
    
    if (useGitignore) {
      print('\n✅ .gitignore patterns will be applied', 'green');
    } else {
      print('\n⚠️  .gitignore patterns will be ignored', 'yellow');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Perform export
  printHeader();
  print('🔄 Exporting project...', 'yellow');
  
  const outputFile = path.join(process.cwd(), `export_${Date.now()}.txt`);
  const result = await performExport(selectedDir, outputFile, useGitignore);
  
  if (result.success) {
    print(`\n✅ Export successful!`, 'green');
    print(`📊 Exported ${result.fileCount} files (${result.totalSize}MB)`, 'cyan');
    print(`💾 Output saved to: ${outputFile}`, 'cyan');
  } else {
    print(`\n❌ Export failed: ${result.error}`, 'red');
  }

  print('\nPress Enter to return to main menu...', 'dim');
  await waitForEnter();
}

// Import functionality
async function importProject() {
  printHeader();
  print('📥 IMPORT PROJECT', 'yellow');
  console.log();

  // Step 1: Select file to import
  print('Step 1: Select export file to import', 'cyan');
  print('(Looking for .txt files with "export" in the name)', 'dim');
  console.log();
  
  let currentDir = process.cwd();
  let selectedFile = null;
  
  while (!selectedFile) {
    const selected = await selectFile(currentDir, `Current: ${currentDir}`, true, true);
    
    if (!selected) {
      print('No selection made!', 'red');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }
    
    if (selected.value === '..') {
      currentDir = path.dirname(currentDir);
    } else if (selected.isDirectory) {
      currentDir = path.join(currentDir, selected.value);
    } else {
      // It's a file
      selectedFile = selected;
    }
  }

  const inputFile = path.join(currentDir, selectedFile.value);
  
  // Step 2: Select destination directory
  printHeader();
  print(`📄 Import from: ${selectedFile.value}`, 'green');
  console.log();
  print('Step 2: Choose destination for imported files', 'cyan');
  
  currentDir = process.cwd();
  let selectedDestination = null;
  let createNewFolder = false;
  let newFolderName = '';

  while (!selectedDestination) {
    const destinationMenu = new SimpleMenu(
      `Current directory: ${currentDir}`,
      [
        { name: '📁 Use this directory', value: 'use_current' },
        { name: '🆕 Create new folder here', value: 'create_new' },
        { name: '📂 Browse folders', value: 'browse' },
        { name: '❌ Cancel', value: 'cancel' }
      ]
    );
    
    const choice = await destinationMenu.show();
    
    if (choice.value === 'cancel') {
      return;
    } else if (choice.value === 'use_current') {
      selectedDestination = currentDir;
    } else if (choice.value === 'create_new') {
      printHeader();
      print(`📄 Import from: ${selectedFile.value}`, 'green');
      print(`📁 Parent directory: ${currentDir}`, 'cyan');
      console.log();
      
      const folderName = await askQuestion('Enter name for new folder (default: recovered): ');
      newFolderName = folderName.trim() || 'recovered';
      
      // Check if folder already exists
      const proposedPath = path.join(currentDir, newFolderName);
      if (fs.existsSync(proposedPath)) {
        print(`\n⚠️  Folder "${newFolderName}" already exists!`, 'yellow');
        
        const overwriteMenu = new SimpleMenu(
          'What would you like to do?',
          [
            { name: 'Use existing folder', value: 'use' },
            { name: 'Choose different name', value: 'rename' },
            { name: 'Cancel', value: 'cancel' }
          ]
        );
        
        const overwriteChoice = await overwriteMenu.show();
        
        if (overwriteChoice.value === 'use') {
          selectedDestination = proposedPath;
          createNewFolder = false;
        } else if (overwriteChoice.value === 'cancel') {
          return;
        }
        // If 'rename', loop continues
      } else {
        selectedDestination = proposedPath;
        createNewFolder = true;
      }
    } else if (choice.value === 'browse') {
      // Browse directories
      const browseResult = await selectFile(currentDir, `Browse from: ${currentDir}`, true);
      
      if (browseResult) {
        if (browseResult.value === '..') {
          currentDir = path.dirname(currentDir);
        } else if (browseResult.isDirectory) {
          currentDir = path.join(currentDir, browseResult.value);
        }
      }
    }
  }

  // Step 3: Confirm import settings
  printHeader();
  print('Step 3: Confirm import settings', 'cyan');
  console.log();
  print(`📄 Source file: ${selectedFile.value}`, 'white');
  print(`📁 Destination: ${selectedDestination}`, 'white');
  if (createNewFolder) {
    print(`🆕 New folder will be created`, 'green');
  }
  console.log();

  const confirmMenu = new SimpleMenu(
    'Start import with these settings?',
    [
      { name: 'Yes, start import', value: 'yes' },
      { name: 'No, cancel', value: 'no' }
    ]
  );
  
  const confirm = await confirmMenu.show();
  
  if (confirm.value !== 'yes') {
    print('\n❌ Import cancelled', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return;
  }

  // Create directory if needed
  if (createNewFolder && !fs.existsSync(selectedDestination)) {
    try {
      fs.mkdirSync(selectedDestination, { recursive: true });
      print('\n✅ Created new directory', 'green');
    } catch (error) {
      print(`\n❌ Failed to create directory: ${error.message}`, 'red');
      await waitForEnter();
      return;
    }
  }

  // Perform import
  printHeader();
  print('🔄 Importing project...', 'yellow');
  console.log();
  
  const result = await performImport(inputFile, selectedDestination);
  
  if (result.success) {
    print(`\n✅ Import successful!`, 'green');
    print(`📊 Imported ${result.fileCount} files (${result.totalSize}MB)`, 'cyan');
    print(`📁 Files imported to: ${selectedDestination}`, 'cyan');
    print(`📄 From file: ${selectedFile.value}`, 'cyan');
  } else {
    print(`\n❌ Import failed: ${result.error}`, 'red');
  }

  print('\nPress Enter to return to main menu...', 'dim');
  await waitForEnter();
}

// Create structure from tree
async function createFromTree() {
  printHeader();
  print('🌳 CREATE STRUCTURE FROM TREE', 'yellow');
  console.log();
  
  const treeText = await collectTreeInput();
  
  if (!treeText.trim()) {
    print('\n❌ No tree structure provided!', 'red');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  
  // Parse the tree
  const structure = parseTreeStructure(treeText);
  
  if (structure.length === 0) {
    print('\n❌ Invalid tree structure!', 'red');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  
  // Show parsed structure
  printHeader();
  print('📋 Parsed structure:', 'cyan');
  console.log();
  print(`Root folder: ${structure[0].name}`, 'yellow');
  print(`Total items: ${countTreeItems(structure)}`, 'cyan');
  console.log();
  
  // Select destination
  print('Select destination for the structure:', 'cyan');
  
  let currentDir = process.cwd();
  let selectedDestination = null;
  
  while (!selectedDestination) {
    const destinationMenu = new SimpleMenu(
      `Current directory: ${currentDir}`,
      [
        { name: '📁 Create structure here', value: 'use_current' },
        { name: '📂 Browse folders', value: 'browse' },
        { name: '❌ Cancel', value: 'cancel' }
      ]
    );
    
    const choice = await destinationMenu.show();
    
    if (choice.value === 'cancel') {
      return;
    } else if (choice.value === 'use_current') {
      selectedDestination = currentDir;
    } else if (choice.value === 'browse') {
      const browseResult = await selectFile(currentDir, `Browse from: ${currentDir}`, true);
      
      if (browseResult) {
        if (browseResult.value === '..') {
          currentDir = path.dirname(currentDir);
        } else if (browseResult.isDirectory) {
          currentDir = path.join(currentDir, browseResult.value);
        }
      }
    }
  }
  
  // Confirm creation
  printHeader();
  const confirmMenu = new SimpleMenu(
    `Create structure in: ${selectedDestination}?`,
    [
      { name: 'Yes, create structure', value: 'yes' },
      { name: 'No, cancel', value: 'no' }
    ]
  );
  
  const confirm = await confirmMenu.show();
  
  if (confirm.value !== 'yes') {
    return;
  }
  
  // Create the structure
  printHeader();
  print('🔄 Creating structure...', 'yellow');
  
  try {
    const stats = createStructureFromTree(structure, selectedDestination);
    
    print(`\n✅ Structure created successfully!`, 'green');
    print(`📁 Created ${stats.folders} folders`, 'cyan');
    print(`📄 Created ${stats.files} files`, 'cyan');
    print(`📍 Location: ${path.join(selectedDestination, structure[0].name)}`, 'cyan');
  } catch (error) {
    print(`\n❌ Failed to create structure: ${error.message}`, 'red');
  }
  
  print('\nPress Enter to return to main menu...', 'dim');
  await waitForEnter();
}

// Parse .gitignore file
function parseGitignore(gitignorePath) {
  const ignorePatterns = [];
  
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // Trim whitespace
      line = line.trim();
      
      // Ignore empty lines and comments
      if (line && !line.startsWith('#')) {
        ignorePatterns.push(line);
      }
    });
  }
  
  return ignorePatterns;
}

// Check if a path matches a gitignore pattern
function matchesGitignorePattern(itemPath, pattern, isDirectory, rootDir) {
  const relativePath = path.relative(rootDir, itemPath);
  const basename = path.basename(itemPath);
  
  // Directory-only patterns (ending with /)
  if (pattern.endsWith('/')) {
    return isDirectory && (basename === pattern.slice(0, -1) || relativePath === pattern.slice(0, -1));
  }
  
  // Patterns with path separators
  if (pattern.includes('/')) {
    return relativePath.startsWith(pattern) || relativePath === pattern;
  }
  
  // Wildcard patterns
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(basename) || regex.test(relativePath);
  }
  
  // Exact match
  return basename === pattern || relativePath === pattern;
}

// Actual export logic
async function performExport(sourceDir, outputFile, useGitignore = false) {
  try {
    const INCLUDE_EXTS = [
      '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html',
      '.json', '.md', '.config.js', '', '.babelrc', '.env', '.yml', '.yaml'
    ];

    const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode'];
    const IGNORE_FILES = ['.gitignore', 'package-lock.json', 'yarn.lock'];

    // Parse gitignore if requested
    const gitignorePatterns = useGitignore ? parseGitignore(path.join(sourceDir, '.gitignore')) : [];

    const output = [];
    let fileCount = 0;
    let totalSize = 0;

    output.push(`// === PROJECT EXPORT ===`);
    output.push(`// Exported at: ${new Date().toISOString()}`);
    output.push(`// Source directory: ${sourceDir}`);
    output.push(`// Using .gitignore: ${useGitignore}`);
    output.push(`// ==================\n\n`);

    function walk(dir) {
      const items = fs.readdirSync(dir).filter(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        const isDirectory = stat.isDirectory();
        
        // Check gitignore patterns first if enabled
        if (useGitignore && gitignorePatterns.length > 0) {
          for (const pattern of gitignorePatterns) {
            if (matchesGitignorePattern(fullPath, pattern, isDirectory, sourceDir)) {
              return false;
            }
          }
        }
        
        if (isDirectory) {
          return !IGNORE_DIRS.includes(item);
        } else {
          const ext = path.extname(item);
          return (INCLUDE_EXTS.includes(ext) || item.startsWith('.')) && !IGNORE_FILES.includes(item);
        }
      });

      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relPath = path.relative(sourceDir, fullPath);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else {
          fileCount++;
          totalSize += stat.size;
          const content = fs.readFileSync(fullPath, 'utf8');
          output.push(`// File: ${relPath}\n${content}\n`);
        }
      });
    }

    walk(sourceDir);
    
    // Always add folder tree
    output.push('\n// === Folder Tree ===');
    const projectName = path.basename(sourceDir);
    output.push(projectName);
    const tree = buildFolderTree(sourceDir);
    output.push(tree);
    
    fs.writeFileSync(outputFile, output.join('\n'), 'utf8');

    return {
      success: true,
      fileCount,
      totalSize: (totalSize / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Actual import logic
async function performImport(inputFile, outputDir) {
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    const parts = content.split(/\/\/ File: (.+)/g);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let fileCount = 0;
    let totalSize = 0;

    for (let i = 1; i < parts.length; i += 2) {
      const relativePath = parts[i].trim();
      const fileContent = parts[i + 1];

      if (fileContent.includes('=== Folder Tree ===')) break;

      const fullPath = path.join(outputDir, relativePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const contentToWrite = fileContent.trimStart();
      fs.writeFileSync(fullPath, contentToWrite);
      
      fileCount++;
      totalSize += Buffer.byteLength(contentToWrite, 'utf8');
    }

    return {
      success: true,
      fileCount,
      totalSize: (totalSize / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main menu
async function mainMenu() {
  while (true) {
    const menu = new SimpleMenu(
      '🚀 Select an option:',
      [
        { name: 'Export Project', value: 'export' },
        { name: 'Import Project', value: 'import' },
        { name: 'Create Structure from Tree', value: 'tree' },
        { name: 'Exit', value: 'exit' }
      ]
    );

    const choice = await menu.show();

    switch (choice.value) {
      case 'export':
        await exportProject();
        break;
      case 'import':
        await importProject();
        break;
      case 'tree':
        await createFromTree();
        break;
      case 'exit':
        printHeader();
        print('👋 Thank you for using Project Tool!', 'green');
        print('Goodbye!', 'cyan');
        process.exit(0);
    }
  }
}

// Start the application
async function main() {
  try {
    await mainMenu();
  } catch (error) {
    print(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle clean exit
process.on('SIGINT', () => {
  print('\n\n👋 Exiting...', 'yellow');
  process.exit(0);
});

// Run the application
main();