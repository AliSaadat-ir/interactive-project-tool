// === CONSTANTS ===
// Shared constants across the application

// File extensions
const FILE_EXTENSIONS = {
  javascript: ['.js', '.jsx', '.mjs'],
  typescript: ['.ts', '.tsx'],
  styles: ['.css', '.scss', '.sass', '.less'],
  markup: ['.html', '.xml'],
  config: ['.json', '.yml', '.yaml'],
  documentation: ['.md', '.txt'],
  dotfiles: ['.env', '.babelrc', '.eslintrc']
};

// All included extensions
const INCLUDE_EXTENSIONS = [
  ...FILE_EXTENSIONS.javascript,
  ...FILE_EXTENSIONS.typescript,
  ...FILE_EXTENSIONS.styles,
  ...FILE_EXTENSIONS.markup,
  ...FILE_EXTENSIONS.config,
  ...FILE_EXTENSIONS.documentation,
  '.config.js'
];

// Directories to ignore
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.vscode',
  '.idea',
  'coverage',
  '.cache',
  'tmp',
  'temp'
];

// Files to ignore
const IGNORE_FILES = [
  '.gitignore',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  'Thumbs.db'
];

// Translation patterns
const TRANSLATION_PATTERNS = [
  // t.key || 'fallback' patterns
  /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
  /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
  /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]\s*\|\|\s*['"`]([^'"`]+)['"`]/g,
  
  // {t.key || 'fallback'} in JSX
  /\{t\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*['"`]([^'"`]+)['"`]\}/g,
  /\{t\['([a-zA-Z_][a-zA-Z0-9_]*)'\]\s*\|\|\s*['"`]([^'"`]+)['"`]\}/g,
  
  // Simple patterns (without fallback)
  /\bt\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  /\bt\['([a-zA-Z_][a-zA-Z0-9_]*)'\]/g,
  /\bt\["([a-zA-Z_][a-zA-Z0-9_]*)"\]/g,
  
  // $t patterns (Vue style)
  /\$t\.([a-zA-Z_][a-zA-Z0-9_]*)/g,
  /\$t\(['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\)/g
];

// Language codes
const LANGUAGE_CODES = {
  en: 'English',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  hi: 'Hindi',
  fa: 'Persian/Farsi',
  ur: 'Urdu'
};

// API configurations
const API_CONFIG = {
  openai: {
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 2000,
    batchSize: 50
  },
  google: {
    batchSize: 1
  },
  mymemory: {
    batchSize: 1,
    rateLimit: 100 // ms between requests
  }
};

module.exports = {
  FILE_EXTENSIONS,
  INCLUDE_EXTENSIONS,
  IGNORE_DIRS,
  IGNORE_FILES,
  TRANSLATION_PATTERNS,
  LANGUAGE_CODES,
  API_CONFIG
};