// === PROJECT IMPORTER ===
// Handles project import functionality with enhanced UX

const fs = require('fs');
const path = require('path');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, waitForEnter } = require('../core/terminal');
const { askQuestion } = require('../core/input');
const { fileExists, createDirectory } = require('../core/fileSystem');

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

// Select export file
async function selectExportFile(startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (true) {
    // Get all items in directory
    const items = fs.readdirSync(currentDir).filter(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        return true;
      }
      
      // Only show .txt files with "export" in name
      return stat.isFile() && 
             item.endsWith('.txt') && 
             item.toLowerCase().includes('export');
    });

    const options = items.map(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      const isDir = stat.isDirectory();
      const size = isDir ? '' : ` (${(stat.size / 1024).toFixed(1)}KB)`;
      
      return {
        name: `${isDir ? '📁' : '📄'} ${item}${size}`,
        value: item,
        isDirectory: isDir
      };
    });

    // Add parent directory option
    if (currentDir !== path.parse(currentDir).root) {
      options.unshift({
        name: '⬆️ .. (Parent Directory)',
        value: '..',
        isDirectory: true
      });
    }

    // Show message if no export files found
    if (options.filter(opt => !opt.isDirectory).length === 0) {
      print('No export files found in this directory', 'yellow');
    }

    const menu = new SimpleMenu(
      `Select export file (current: ${currentDir})`,
      options
    );
    
    const selected = await menu.show();
    
    if (selected.value === '..') {
      currentDir = path.dirname(currentDir);
    } else if (selected.isDirectory) {
      currentDir = path.join(currentDir, selected.value);
    } else {
      return path.join(currentDir, selected.value);
    }
  }
}

// Select destination directory with enhanced options
async function selectDestination(startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (true) {
    const menu = new SimpleMenu(
      `Current directory: ${currentDir}`,
      [
        { name: '📁 Use this directory', value: 'use_current' },
        { name: '🆕 Create new folder here', value: 'create_new' },
        { name: '📂 Browse folders', value: 'browse' },
        { name: '❌ Cancel', value: 'cancel' }
      ]
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'use_current':
        return { path: currentDir, create: false };
        
      case 'create_new':
        printHeader();
        const folderName = await askQuestion('Enter name for new folder (default: recovered): ');
        const name = folderName.trim() || 'recovered';
        const newPath = path.join(currentDir, name);
        
        if (fileExists(newPath)) {
          print(`\n⚠️ Folder "${name}" already exists!`, 'yellow');
          const useExisting = await askConfirmMenu('Use existing folder?');
          if (useExisting) {
            return { path: newPath, create: false };
          }
        } else {
          return { path: newPath, create: true };
        }
        break;
        
      case 'browse':
        const dirs = fs.readdirSync(currentDir)
          .filter(item => {
            try {
              return fs.statSync(path.join(currentDir, item)).isDirectory();
            } catch {
              return false;
            }
          });
        
        const options = dirs.map(dir => ({
          name: `📁 ${dir}`,
          value: dir
        }));
        
        if (currentDir !== path.parse(currentDir).root) {
          options.unshift({
            name: '⬆️ .. (Parent Directory)',
            value: '..'
          });
        }
        
        const dirMenu = new SimpleMenu('Select directory:', options);
        const selected = await dirMenu.show();
        
        if (selected.value === '..') {
          currentDir = path.dirname(currentDir);
        } else {
          currentDir = path.join(currentDir, selected.value);
        }
        break;
        
      case 'cancel':
        return null;
    }
  }
}

// Main import function with enhanced UX
async function importProject() {
  printHeader();
  print('📥 IMPORT PROJECT', 'yellow');
  console.log();

  // Step 1: Select export file
  print('Step 1: Select export file to import', 'cyan');
  print('(Looking for .txt files with "export" in the name)', 'dim');
  console.log();
  
  const inputFile = await selectExportFile();
  
  if (!inputFile) {
    print('❌ No file selected', 'red');
    await waitForEnter();
    return;
  }

  // Step 2: Select destination
  printHeader();
  print(`📄 Import from: ${path.basename(inputFile)}`, 'green');
  console.log();
  print('Step 2: Choose destination for imported files', 'cyan');
  
  const destination = await selectDestination();
  
  if (!destination) {
    print('\n❌ Import cancelled', 'yellow');
    await waitForEnter();
    return;
  }

  // Step 3: Confirm
  printHeader();
  print('Step 3: Confirm import settings', 'cyan');
  console.log();
  print(`📄 Source file: ${path.basename(inputFile)}`, 'white');
  print(`📁 Destination: ${destination.path}`, 'white');
  if (destination.create) {
    print(`🆕 New folder will be created`, 'green');
  }
  console.log();

  const confirm = await askConfirmMenu('Start import with these settings?');
  
  if (!confirm) {
    print('\n❌ Import cancelled', 'yellow');
    await waitForEnter();
    return;
  }

  // Create directory if needed
  if (destination.create) {
    try {
      createDirectory(destination.path);
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
  
  const result = await performImport(inputFile, destination.path);
  
  if (result.success) {
    print(`\n✅ Import successful!`, 'green');
    print(`📊 Imported ${result.fileCount} files (${result.totalSize}MB)`, 'cyan');
    print(`📁 Files imported to: ${destination.path}`, 'cyan');
    
    console.log();
    const openFolder = await askConfirmMenu('Would you like to open the imported folder?', false);
    
    if (openFolder) {
      const { exec } = require('child_process');
      const command = process.platform === 'win32' ? 'start' : 
                      process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${command} "${destination.path}"`);
    }
  } else {
    print(`\n❌ Import failed: ${result.error}`, 'red');
  }

  print('\nPress Enter to return to main menu...', 'dim');
  await waitForEnter();
}

// Perform the actual import
async function performImport(inputFile, outputDir) {
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    const parts = content.split(/\/\/ File: (.+)/g);

    let fileCount = 0;
    let totalSize = 0;

    for (let i = 1; i < parts.length; i += 2) {
      const relativePath = parts[i].trim();
      const fileContent = parts[i + 1];

      // Skip if we hit the folder tree section
      if (fileContent && fileContent.includes('=== Folder Tree ===')) break;

      const fullPath = path.join(outputDir, relativePath);
      const dir = path.dirname(fullPath);

      // Create directory if needed
      createDirectory(dir);

      // Write file
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

module.exports = { importProject };