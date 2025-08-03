// === TREE STRUCTURE BUILDER ===
// Creates folder/file structure from tree diagrams

const fs = require('fs');
const path = require('path');
const { SimpleMenu } = require('../core/menu');
const { print, printHeader, waitForEnter } = require('../core/terminal');
const { getMultilineInput, askConfirm } = require('../core/input');
const { createDirectory, fileExists } = require('../core/fileSystem');

// Parse tree structure from text
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
    
    // Calculate depth based on indent
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
  let folders = 0;
  let files = 0;
  
  function traverse(items) {
    items.forEach(item => {
      if (item.type === 'directory') {
        folders++;
      } else {
        files++;
      }
      
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  }
  
  traverse(structure);
  return { folders, files, total: folders + files };
}

// Create file/folder structure
function createStructureFromTree(structure, basePath) {
  const stats = { folders: 0, files: 0 };
  
  function createItems(items, currentPath) {
    items.forEach(item => {
      const itemPath = path.join(currentPath, item.name);
      
      if (item.type === 'directory') {
        if (!fileExists(itemPath)) {
          createDirectory(itemPath);
          stats.folders++;
        }
        
        if (item.children && item.children.length > 0) {
          createItems(item.children, itemPath);
        }
      } else {
        // Create empty file
        if (!fileExists(itemPath)) {
          const dir = path.dirname(itemPath);
          createDirectory(dir);
          fs.writeFileSync(itemPath, '');
          stats.files++;
        }
      }
    });
  }
  
  createItems(structure, basePath);
  return stats;
}

// Select destination directory
async function selectTreeDestination(startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (true) {
    const menu = new SimpleMenu(
      `Current directory: ${currentDir}`,
      [
        { name: '📁 Create structure here', value: 'use_current' },
        { name: '📂 Browse folders', value: 'browse' },
        { name: '❌ Cancel', value: 'cancel' }
      ]
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'use_current':
        return currentDir;
        
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

// Main tree builder function
async function createFromTree() {
  printHeader();
  print('🌳 CREATE STRUCTURE FROM TREE', 'yellow');
  console.log();
  
  print('Enter the folder tree structure:', 'cyan');
  print('Example:', 'dim');
  print('project-name', 'dim');
  print('├── src/', 'dim');
  print('│   └── index.js', 'dim');
  print('└── package.json', 'dim');
  console.log();
  
  const treeText = await getMultilineInput('DONE');
  
  if (!treeText.trim()) {
    print('\n❌ No tree structure provided!', 'red');
    await waitForEnter();
    return;
  }
  
  // Parse the tree
  const structure = parseTreeStructure(treeText);
  
  if (structure.length === 0) {
    print('\n❌ Invalid tree structure!', 'red');
    await waitForEnter();
    return;
  }
  
  // Show parsed structure
  printHeader();
  print('📋 Parsed structure:', 'cyan');
  console.log();
  
  const counts = countTreeItems(structure);
  print(`Root folder: ${structure[0].name}`, 'yellow');
  print(`Folders: ${counts.folders}`, 'cyan');
  print(`Files: ${counts.files}`, 'cyan');
  print(`Total items: ${counts.total}`, 'cyan');
  console.log();
  
  // Select destination
  print('Select destination for the structure:', 'cyan');
  const destination = await selectTreeDestination();
  
  if (!destination) {
    print('\n❌ Cancelled', 'yellow');
    await waitForEnter();
    return;
  }
  
  // Check if root folder already exists
  const rootPath = path.join(destination, structure[0].name);
  if (fileExists(rootPath)) {
    print(`\n⚠️ Folder "${structure[0].name}" already exists!`, 'yellow');
    const overwrite = await askConfirm('Continue anyway?');
    if (!overwrite) {
      return;
    }
  }
  
  // Confirm creation
  printHeader();
  const confirm = await askConfirm(`Create structure in: ${destination}?`);
  
  if (!confirm) {
    return;
  }
  
  // Create the structure
  printHeader();
  print('🔄 Creating structure...', 'yellow');
  
  try {
    const stats = createStructureFromTree(structure, destination);
    
    print(`\n✅ Structure created successfully!`, 'green');
    print(`📁 Created ${stats.folders} folders`, 'cyan');
    print(`📄 Created ${stats.files} files`, 'cyan');
    print(`📍 Location: ${rootPath}`, 'cyan');
  } catch (error) {
    print(`\n❌ Failed to create structure: ${error.message}`, 'red');
  }
  
  await waitForEnter();
}

module.exports = { createFromTree };