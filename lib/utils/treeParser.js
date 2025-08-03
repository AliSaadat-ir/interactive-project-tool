// === TREE PARSER UTILITIES ===
// Parses tree structure text into structured data

const fs = require('fs');
const path = require('path');

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

// Build folder tree for display
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

module.exports = {
  parseTreeStructure,
  countTreeItems,
  createStructureFromTree,
  buildFolderTree
};