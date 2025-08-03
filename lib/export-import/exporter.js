// === PROJECT EXPORTER ===
// Handles project export functionality with enhanced UX

const fs = require('fs');
const path = require('path');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, waitForEnter } = require('../core/terminal');
const { parseGitignore, matchesGitignorePattern } = require('../utils/gitignore');
const { fileExists, isDirectory, walkDirectory } = require('../core/fileSystem');

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

// File browser for selecting directories
async function selectDirectory(startDir = process.cwd(), message = 'Select directory:') {
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
      `${message} (current: ${currentDir})`,
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

// Main export function with enhanced UX
async function exportProject() {
  printHeader();
  print('📤 EXPORT PROJECT', 'yellow');
  console.log();

  // Select directory to export
  const selectedDir = await selectDirectory(process.cwd(), 'Select directory to export');
  
  if (!selectedDir) {
    print('❌ No directory selected', 'red');
    await waitForEnter();
    return;
  }

  // Confirm selection
  printHeader();
  print(`📁 Selected directory: ${selectedDir}`, 'cyan');
  console.log();
  
  const confirm = await askConfirmMenu('Export this directory?');
  if (!confirm) {
    print('\n❌ Export cancelled', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return;
  }

  // Check for .gitignore
  let useGitignore = false;
  const gitignorePath = path.join(selectedDir, '.gitignore');
  
  if (fileExists(gitignorePath)) {
    printHeader();
    print('📋 Found .gitignore file', 'yellow');
    console.log();
    
    useGitignore = await askConfirmMenu('Use .gitignore patterns for filtering?');
    
    if (useGitignore) {
      print('\n✅ .gitignore patterns will be applied', 'green');
    } else {
      print('\n⚠️  .gitignore patterns will be ignored', 'yellow');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Perform export
  printHeader();
  print('🔄 Exporting project...', 'yellow');
  console.log();
  
  const outputFile = path.join(process.cwd(), `export_${Date.now()}.txt`);
  const result = await performExport(selectedDir, outputFile, useGitignore);
  
  if (result.success) {
    print(`\n✅ Export successful!`, 'green');
    print(`📊 Exported ${result.fileCount} files (${result.totalSize}MB)`, 'cyan');
    print(`💾 Output saved to: ${outputFile}`, 'cyan');
    
    console.log();
    const openFile = await askConfirmMenu('Would you like to open the export file?', false);
    
    if (openFile) {
      const { exec } = require('child_process');
      const command = process.platform === 'win32' ? 'start' : 
                      process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${command} "${outputFile}"`);
    }
  } else {
    print(`\n❌ Export failed: ${result.error}`, 'red');
  }

  print('\nPress Enter to return to main menu...', 'dim');
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
    const { buildFolderTree } = require('../utils/treeParser');
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

module.exports = { exportProject, selectDirectory };