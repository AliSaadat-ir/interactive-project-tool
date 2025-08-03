// === EXPORT FILE MANAGER ===
// Manages export files with deletion capabilities

const fs = require('fs');
const path = require('path');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, clearScreen, waitForEnter } = require('../core/terminal');
const { fileExists, getFileSize } = require('../core/fileSystem');
const { getFormattedDateTime } = require('../utils/date');

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

// Multi-select menu for batch operations
class MultiSelectMenu extends SimpleMenu {
  constructor(title, options) {
    super(title, options);
    this.selected = new Set();
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
          if (currentOption.value !== 'select_all' && currentOption.value !== 'done') {
            if (this.selected.has(currentOption.value)) {
              this.selected.delete(currentOption.value);
            } else {
              this.selected.add(currentOption.value);
            }
            this.render();
          }
        } else if (key.toLowerCase() === 'a') { // 'A' to select/deselect all
          if (this.selected.size === this.options.filter(o => o.value !== 'select_all' && o.value !== 'done').length) {
            this.selected.clear();
          } else {
            this.options.forEach(option => {
              if (option.value !== 'select_all' && option.value !== 'done') {
                this.selected.add(option.value);
              }
            });
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
      const prefix = option.value === 'select_all' || option.value === 'done' ? '' : checkbox + ' ';
      
      if (index === this.selectedIndex) {
        print(`  ▶ ${prefix}${option.name}`, 'green');
      } else {
        print(`    ${prefix}${option.name}`, isSelected ? 'cyan' : 'white');
      }
    });

    console.log();
    print(`Selected: ${this.selected.size} file(s)`, 'cyan');
    console.log();
    print('Use ↑↓ arrows to navigate, Space to select/deselect', 'dim');
    print('Press A to select/deselect all, Enter to confirm', 'dim');
    print('Press Ctrl+C to cancel', 'dim');
  }
}

// Main export file manager
async function manageExportFiles() {
  while (true) {
    printHeader();
    print('📁 EXPORT FILE MANAGER', 'yellow');
    console.log();
    
    const menu = new SimpleMenu(
      'What would you like to do?',
      [
        { name: '🗑️  Delete Single Export File', value: 'delete_single' },
        { name: '🗑️  Delete Multiple Export Files', value: 'delete_multiple' },
        { name: '📂 Browse and Manage by Folder', value: 'browse_folder' },
        { name: '🧹 Clean All Export Files (Current Directory)', value: 'clean_all' },
        { name: '↩️  Back to Main Menu', value: 'back' }
      ]
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'delete_single':
        await deleteSingleFile();
        break;
      case 'delete_multiple':
        await deleteMultipleFiles();
        break;
      case 'browse_folder':
        await browseAndManage();
        break;
      case 'clean_all':
        await cleanAllExportFiles();
        break;
      case 'back':
        return;
    }
  }
}

// Delete single export file
async function deleteSingleFile(startDir = process.cwd()) {
  printHeader();
  print('🗑️  DELETE SINGLE EXPORT FILE', 'yellow');
  console.log();
  
  const exportFiles = findExportFiles(startDir);
  
  if (exportFiles.length === 0) {
    print('❌ No export files found in current directory', 'red');
    await waitForEnter();
    return;
  }
  
  const options = exportFiles.map(file => {
    const stats = fs.statSync(file.path);
    const size = (stats.size / 1024).toFixed(1);
    const date = new Date(stats.mtime).toLocaleString();
    
    return {
      name: `📄 ${file.name} (${size}KB) - ${date}`,
      value: file.path
    };
  });
  
  options.push({ name: '❌ Cancel', value: 'cancel' });
  
  const menu = new SimpleMenu('Select file to delete:', options);
  const selected = await menu.show();
  
  if (selected.value === 'cancel') {
    return;
  }
  
  // Show file preview
  printHeader();
  print('📄 File Details:', 'cyan');
  console.log();
  print(`Name: ${path.basename(selected.value)}`, 'white');
  print(`Path: ${selected.value}`, 'dim');
  print(`Size: ${getFileSize(selected.value)}MB`, 'white');
  
  // Read first few lines
  try {
    const content = fs.readFileSync(selected.value, 'utf8');
    const lines = content.split('\n').slice(0, 5);
    console.log();
    print('Preview:', 'cyan');
    lines.forEach(line => print(line.substring(0, 80), 'dim'));
    if (content.split('\n').length > 5) {
      print('...', 'dim');
    }
  } catch (error) {
    print('Could not read file preview', 'red');
  }
  
  console.log();
  const confirm = await askConfirmMenu('Delete this file?', false);
  
  if (confirm) {
    try {
      fs.unlinkSync(selected.value);
      print('\n✅ File deleted successfully!', 'green');
    } catch (error) {
      print(`\n❌ Error deleting file: ${error.message}`, 'red');
    }
  } else {
    print('\n❌ Deletion cancelled', 'yellow');
  }
  
  await waitForEnter();
}

// Delete multiple export files
async function deleteMultipleFiles(startDir = process.cwd()) {
  printHeader();
  print('🗑️  DELETE MULTIPLE EXPORT FILES', 'yellow');
  console.log();
  
  const exportFiles = findExportFiles(startDir);
  
  if (exportFiles.length === 0) {
    print('❌ No export files found in current directory', 'red');
    await waitForEnter();
    return;
  }
  
  const options = exportFiles.map(file => {
    const stats = fs.statSync(file.path);
    const size = (stats.size / 1024).toFixed(1);
    const date = new Date(stats.mtime).toLocaleDateString();
    
    return {
      name: `${file.name} (${size}KB) - ${date}`,
      value: file.path
    };
  });
  
  const menu = new MultiSelectMenu('Select files to delete (Space to select, A for all):', options);
  const selected = await menu.show();
  
  if (selected.length === 0) {
    print('\n❌ No files selected', 'yellow');
    await waitForEnter();
    return;
  }
  
  // Show summary
  printHeader();
  print(`📊 Selected ${selected.length} file(s) for deletion:`, 'cyan');
  console.log();
  
  let totalSize = 0;
  selected.forEach((filePath, index) => {
    const stats = fs.statSync(filePath);
    totalSize += stats.size;
    print(`  ${index + 1}. ${path.basename(filePath)} (${(stats.size / 1024).toFixed(1)}KB)`, 'white');
  });
  
  console.log();
  print(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'yellow');
  console.log();
  
  const confirm = await askConfirmMenu(`Delete ${selected.length} file(s)?`, false);
  
  if (confirm) {
    let deleted = 0;
    let failed = 0;
    
    for (const filePath of selected) {
      try {
        fs.unlinkSync(filePath);
        deleted++;
      } catch (error) {
        failed++;
        print(`❌ Failed to delete ${path.basename(filePath)}: ${error.message}`, 'red');
      }
    }
    
    console.log();
    print(`✅ Deleted: ${deleted} file(s)`, 'green');
    if (failed > 0) {
      print(`❌ Failed: ${failed} file(s)`, 'red');
    }
  } else {
    print('\n❌ Deletion cancelled', 'yellow');
  }
  
  await waitForEnter();
}

// Browse folders and manage export files
async function browseAndManage() {
  let currentDir = process.cwd();
  
  while (true) {
    printHeader();
    print('📂 BROWSE AND MANAGE EXPORT FILES', 'yellow');
    print(`Current: ${currentDir}`, 'dim');
    console.log();
    
    // Count export files in current directory
    const exportFiles = findExportFiles(currentDir);
    if (exportFiles.length > 0) {
      print(`📄 Found ${exportFiles.length} export file(s) in this directory`, 'cyan');
      console.log();
    }
    
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
    
    // Add navigation and action options
    const options = [];
    
    if (exportFiles.length > 0) {
      options.push(
        { name: `🗑️  Delete export files in this folder (${exportFiles.length} files)`, value: 'delete_here' },
        { name: '📋 View export files in this folder', value: 'view_here' }
      );
    }
    
    if (currentDir !== path.parse(currentDir).root) {
      options.push({
        name: '⬆️ .. (Parent Directory)',
        value: '..'
      });
    }
    
    options.push(...items);
    options.push({ name: '↩️  Back', value: 'back' });
    
    const menu = new SimpleMenu('Select action or navigate:', options);
    const selected = await menu.show();
    
    if (selected.value === 'back') {
      return;
    } else if (selected.value === '..') {
      currentDir = path.dirname(currentDir);
    } else if (selected.value === 'delete_here') {
      await deleteFilesInDirectory(currentDir);
    } else if (selected.value === 'view_here') {
      await viewExportFiles(currentDir);
    } else {
      currentDir = path.join(currentDir, selected.value);
    }
  }
}

// View export files in a directory
async function viewExportFiles(directory) {
  printHeader();
  print(`📄 Export Files in: ${directory}`, 'cyan');
  console.log();
  
  const exportFiles = findExportFiles(directory);
  
  exportFiles.forEach((file, index) => {
    const stats = fs.statSync(file.path);
    const size = (stats.size / 1024).toFixed(1);
    const date = new Date(stats.mtime).toLocaleString();
    
    print(`${index + 1}. ${file.name}`, 'white');
    print(`   Size: ${size}KB | Modified: ${date}`, 'dim');
  });
  
  await waitForEnter();
}

// Delete files in a specific directory
async function deleteFilesInDirectory(directory) {
  const exportFiles = findExportFiles(directory);
  
  if (exportFiles.length === 0) {
    print('❌ No export files found', 'red');
    await waitForEnter();
    return;
  }
  
  printHeader();
  print(`🗑️  Delete Export Files in: ${directory}`, 'yellow');
  console.log();
  print(`Found ${exportFiles.length} export file(s):`, 'cyan');
  
  let totalSize = 0;
  exportFiles.forEach((file, index) => {
    const stats = fs.statSync(file.path);
    totalSize += stats.size;
    print(`  ${index + 1}. ${file.name} (${(stats.size / 1024).toFixed(1)}KB)`, 'white');
  });
  
  console.log();
  print(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'yellow');
  console.log();
  
  const confirm = await askConfirmMenu(`Delete all ${exportFiles.length} export file(s)?`, false);
  
  if (confirm) {
    let deleted = 0;
    let failed = 0;
    
    for (const file of exportFiles) {
      try {
        fs.unlinkSync(file.path);
        deleted++;
      } catch (error) {
        failed++;
        print(`❌ Failed to delete ${file.name}: ${error.message}`, 'red');
      }
    }
    
    console.log();
    print(`✅ Deleted: ${deleted} file(s)`, 'green');
    if (failed > 0) {
      print(`❌ Failed: ${failed} file(s)`, 'red');
    }
  } else {
    print('\n❌ Deletion cancelled', 'yellow');
  }
  
  await waitForEnter();
}

// Clean all export files in current directory
async function cleanAllExportFiles() {
  const currentDir = process.cwd();
  const exportFiles = findExportFiles(currentDir);
  
  if (exportFiles.length === 0) {
    print('✅ No export files to clean in current directory', 'green');
    await waitForEnter();
    return;
  }
  
  printHeader();
  print('🧹 CLEAN ALL EXPORT FILES', 'yellow');
  console.log();
  print(`Found ${exportFiles.length} export file(s) in current directory:`, 'cyan');
  console.log();
  
  let totalSize = 0;
  exportFiles.forEach((file, index) => {
    const stats = fs.statSync(file.path);
    totalSize += stats.size;
    if (index < 10) {
      print(`  ${file.name} (${(stats.size / 1024).toFixed(1)}KB)`, 'white');
    }
  });
  
  if (exportFiles.length > 10) {
    print(`  ... and ${exportFiles.length - 10} more files`, 'dim');
  }
  
  console.log();
  print(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'yellow');
  console.log();
  
  print('⚠️  This will delete ALL export files in the current directory!', 'red');
  const confirm = await askConfirmMenu(`Delete all ${exportFiles.length} export file(s)?`, false);
  
  if (confirm) {
    // Double confirmation for safety
    const doubleConfirm = await askConfirmMenu('Are you absolutely sure? This cannot be undone!', false);
    
    if (doubleConfirm) {
      let deleted = 0;
      let failed = 0;
      
      for (const file of exportFiles) {
        try {
          fs.unlinkSync(file.path);
          deleted++;
        } catch (error) {
          failed++;
          print(`❌ Failed to delete ${file.name}: ${error.message}`, 'red');
        }
      }
      
      console.log();
      print(`✅ Deleted: ${deleted} file(s)`, 'green');
      if (failed > 0) {
        print(`❌ Failed: ${failed} file(s)`, 'red');
      }
      print(`💾 Freed up: ${(totalSize / 1024 / 1024).toFixed(2)}MB`, 'cyan');
    } else {
      print('\n❌ Deletion cancelled', 'yellow');
    }
  } else {
    print('\n❌ Deletion cancelled', 'yellow');
  }
  
  await waitForEnter();
}

// Find export files in a directory
function findExportFiles(directory) {
  try {
    const files = fs.readdirSync(directory);
    const exportFiles = files
      .filter(file => file.startsWith('export_') && file.endsWith('.txt'))
      .map(file => ({
        name: file,
        path: path.join(directory, file)
      }));
    
    return exportFiles.sort((a, b) => {
      const statA = fs.statSync(a.path);
      const statB = fs.statSync(b.path);
      return statB.mtime - statA.mtime; // Sort by newest first
    });
  } catch (error) {
    return [];
  }
}

module.exports = {
  manageExportFiles
};