// === PROJECT EXPORTER ===
// Handles project export functionality

const fs = require('fs');
const path = require('path');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, waitForEnter } = require('../core/terminal');
const { askConfirm } = require('../core/input');
const { parseGitignore, matchesGitignorePattern } = require('../utils/gitignore');
const { fileExists, isDirectory, walkDirectory } = require('../core/fileSystem');

// File browser for selecting directories
async function selectDirectory(startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (true) {
    const items = fs.readdirSync(currentDir)
      .filter(item => {
        try {
          const stat = fs.statSync(path.join(currentDir, item));
          return stat.isDirectory();
        } catch {
          return false;
        }
      })
      .map(item => ({
        name: `📁 ${item}`,
        value: item
      }));
    
    // Add parent directory option
    if (currentDir !== path.parse(currentDir).root) {
      items.unshift({
        name: '⬆️ .. (Parent Directory)',
        value: '..'
      });
    }
    
    // Add current directory option
    items.unshift({
      name: '📍 Use this directory',
      value: '.'
    });
    
    const menu = new SimpleMenu(
      `Select directory to export (current: ${currentDir})`,
      items
    );
    
    const selected = await menu.show();
    
    if (selected.value === '.') {
      return currentDir;
    } else if (selected.value === '..') {
      currentDir = path.dirname(currentDir);
    } else {
      currentDir = path.join(currentDir, selected.value);
    }
  }
}

// Main export function
async function exportProject() {
  printHeader();
  print('📤 EXPORT PROJECT', 'yellow');
  console.log();

  // Select directory to export
  const selectedDir = await selectDirectory();
  
  if (!selectedDir) {
    print('❌ No directory selected', 'red');
    await waitForEnter();
    return;
  }

  // Confirm selection
  printHeader();
  print(`📁 Selected directory: ${selectedDir}`, 'cyan');
  
  const confirm = await askConfirm('Export this directory?');
  if (!confirm) {
    return;
  }

  // Check for .gitignore
  let useGitignore = false;
  const gitignorePath = path.join(selectedDir, '.gitignore');
  
  if (fileExists(gitignorePath)) {
    print('\n📋 Found .gitignore file', 'yellow');
    useGitignore = await askConfirm('Use .gitignore patterns for filtering?');
  }

  // Perform export
  print('\n🔄 Exporting project...', 'yellow');
  
  const outputFile = path.join(process.cwd(), `export_${Date.now()}.txt`);
  const result = await performExport(selectedDir, outputFile, useGitignore);
  
  if (result.success) {
    print(`\n✅ Export successful!`, 'green');
    print(`📊 Exported ${result.fileCount} files (${result.totalSize}MB)`, 'cyan');
    print(`💾 Output saved to: ${outputFile}`, 'cyan');
  } else {
    print(`\n❌ Export failed: ${result.error}`, 'red');
  }

  await waitForEnter();
}

// Perform the actual export
async function performExport(sourceDir, outputFile, useGitignore = false) {
  try {
    const INCLUDE_EXTS = [
      '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html',
      '.json', '.md', '.config.js', '.babelrc', '.env', '.yml', '.yaml'
    ];

    const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode'];
    const IGNORE_FILES = ['.gitignore', 'package-lock.json', 'yarn.lock'];

    const gitignorePatterns = useGitignore ? parseGitignore(path.join(sourceDir, '.gitignore')) : [];

    const output = [];
    let fileCount = 0;
    let totalSize = 0;

    // Add header
    output.push(`// === PROJECT EXPORT ===`);
    output.push(`// Exported at: ${new Date().toISOString()}`);
    output.push(`// Source directory: ${sourceDir}`);
    output.push(`// Using .gitignore: ${useGitignore}`);
    output.push(`// ==================\n\n`);

    // Walk directory and collect files
    function walk(dir) {
      const items = fs.readdirSync(dir).filter(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        const isDir = stat.isDirectory();
        
        // Check gitignore patterns
        if (useGitignore && gitignorePatterns.length > 0) {
          for (const pattern of gitignorePatterns) {
            if (matchesGitignorePattern(fullPath, pattern, isDir, sourceDir)) {
              return false;
            }
          }
        }
        
        if (isDir) {
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
    
    // Add folder tree
    output.push('\n// === Folder Tree ===');
    const projectName = path.basename(sourceDir);
    output.push(projectName);
    const tree = buildFolderTree(sourceDir);
    output.push(tree);
    
    // Write output file
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

// Build folder tree
function buildFolderTree(dir, prefix = '', isLast = true) {
  const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode'];
  const IGNORE_FILES = ['.gitignore', 'package-lock.json', 'yarn.lock'];
  
  const items = fs.readdirSync(dir).filter(item => {
    const fullPath = path.join(dir, item);
    
    try {
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        return !IGNORE_DIRS.includes(item);
      } else {
        return !IGNORE_FILES.includes(item);
      }
    } catch {
      return false;
    }
  });

  let tree = '';
  
  if (items.length === 0) {
    return tree;
  }
  
  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
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

module.exports = { exportProject };