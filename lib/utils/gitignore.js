// === GITIGNORE PARSER ===
// Parses and applies .gitignore patterns

const fs = require('fs');
const path = require('path');

// Parse .gitignore file
function parseGitignore(gitignorePath) {
  const patterns = [];
  
  if (!fs.existsSync(gitignorePath)) {
    return patterns;
  }
  
  try {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const lines = content.split(/\r?\n/);
    
    lines.forEach(line => {
      // Trim whitespace
      line = line.trim();
      
      // Ignore empty lines and comments
      if (line && !line.startsWith('#')) {
        patterns.push(parsePattern(line));
      }
    });
  } catch (error) {
    console.error(`Error reading .gitignore: ${error.message}`);
  }
  
  return patterns;
}

// Parse a single pattern
function parsePattern(pattern) {
  let isNegation = false;
  let isDirectory = false;
  let isGlob = false;
  
  // Check for negation
  if (pattern.startsWith('!')) {
    isNegation = true;
    pattern = pattern.substring(1);
  }
  
  // Check if directory only
  if (pattern.endsWith('/')) {
    isDirectory = true;
    pattern = pattern.slice(0, -1);
  }
  
  // Check if glob pattern
  if (pattern.includes('*') || pattern.includes('?') || pattern.includes('[')) {
    isGlob = true;
  }
  
  return {
    pattern,
    original: pattern,
    isNegation,
    isDirectory,
    isGlob,
    regex: isGlob ? globToRegex(pattern) : null
  };
}

// Convert glob pattern to regex
function globToRegex(glob) {
  let regex = glob
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/{{DOUBLE_STAR}}/g, '.*');
  
  return new RegExp(`^${regex}$`);
}

// Check if a path matches a gitignore pattern
function matchesGitignorePattern(itemPath, pattern, isDirectory, rootDir) {
  const relativePath = path.relative(rootDir, itemPath).replace(/\\/g, '/');
  const basename = path.basename(itemPath);
  const parsed = typeof pattern === 'string' ? parsePattern(pattern) : pattern;
  
  // Directory-only patterns
  if (parsed.isDirectory && !isDirectory) {
    return false;
  }
  
  // Exact match
  if (!parsed.isGlob) {
    // Pattern with path separator
    if (parsed.pattern.includes('/')) {
      return relativePath === parsed.pattern || 
             relativePath.startsWith(parsed.pattern + '/');
    }
    
    // Simple pattern (matches anywhere)
    return basename === parsed.pattern ||
           relativePath.split('/').some(part => part === parsed.pattern);
  }
  
  // Glob pattern
  if (parsed.regex) {
    // Test against full path and basename
    return parsed.regex.test(relativePath) || 
           parsed.regex.test(basename);
  }
  
  return false;
}

// Apply gitignore patterns to a list of files
function applyGitignorePatterns(files, patterns, rootDir) {
  const ignored = new Set();
  
  files.forEach(file => {
    let isIgnored = false;
    
    // Check each pattern in order
    for (const pattern of patterns) {
      const matches = matchesGitignorePattern(
        file.path,
        pattern,
        file.isDirectory,
        rootDir
      );
      
      if (matches) {
        if (pattern.isNegation) {
          isIgnored = false;
        } else {
          isIgnored = true;
        }
      }
    }
    
    if (isIgnored) {
      ignored.add(file.path);
    }
  });
  
  return files.filter(file => !ignored.has(file.path));
}

module.exports = {
  parseGitignore,
  parsePattern,
  matchesGitignorePattern,
  applyGitignorePatterns
};