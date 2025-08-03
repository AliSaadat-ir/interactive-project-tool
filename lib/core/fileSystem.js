// === FILE SYSTEM UTILITIES ===
// Handles file and directory operations

const fs = require('fs');
const path = require('path');

// Read directory with filtering
function readDirectory(dir, options = {}) {
  const {
    excludeDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode'],
    excludeFiles = ['.gitignore', 'package-lock.json', 'yarn.lock'],
    includeHidden = false
  } = options;

  try {
    return fs.readdirSync(dir).filter(item => {
      if (!includeHidden && item.startsWith('.') && item !== '.env') {
        return false;
      }
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        return !excludeDirs.includes(item);
      } else {
        return !excludeFiles.includes(item);
      }
    });
  } catch (error) {
    return [];
  }
}

// Create directory recursively
function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Check if path is directory
function isDirectory(path) {
  try {
    return fs.statSync(path).isDirectory();
  } catch {
    return false;
  }
}

// Check if file exists
function fileExists(path) {
  return fs.existsSync(path);
}

// Read file content
function readFile(path, encoding = 'utf8') {
  try {
    return fs.readFileSync(path, encoding);
  } catch (error) {
    return null;
  }
}

// Write file content
function writeFile(path, content, encoding = 'utf8') {
  try {
    const dir = path.dirname(path);
    createDirectory(dir);
    fs.writeFileSync(path, content, encoding);
    return true;
  } catch (error) {
    return false;
  }
}

// Get file size in MB
function getFileSize(path) {
  try {
    const stats = fs.statSync(path);
    return (stats.size / 1024 / 1024).toFixed(2);
  } catch {
    return 0;
  }
}

// Walk directory tree
function* walkDirectory(dir, options = {}) {
  const items = readDirectory(dir, options);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    yield { path: fullPath, isDirectory: stat.isDirectory(), name: item };
    
    if (stat.isDirectory()) {
      yield* walkDirectory(fullPath, options);
    }
  }
}

module.exports = {
  readDirectory,
  createDirectory,
  isDirectory,
  fileExists,
  readFile,
  writeFile,
  getFileSize,
  walkDirectory
};