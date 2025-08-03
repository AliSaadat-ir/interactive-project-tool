// === TERMINAL UTILITIES ===
// Handles terminal display and colors

const readline = require('readline');

// ANSI color codes
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
  print('║   TRANSLATION TOOL v3.0                ║', 'cyan');
  print('║   Advanced Synchronization Support     ║', 'cyan');
  print('╚════════════════════════════════════════╝', 'cyan');
  console.log();
}

// Wait for Enter key
function waitForEnter() {
  print('\nPress Enter to continue...', 'dim');
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

// Ask a question
function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    rl.question(colors.cyan + question + colors.reset, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Show progress bar
function showProgress(current, total, message = '') {
  const percentage = Math.round((current / total) * 100);
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  const empty = barLength - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    `${colors.cyan}[${bar}] ${percentage}% ${message}${colors.reset}`
  );
  
  if (current === total) {
    console.log(); // New line when complete
  }
}

module.exports = {
  colors,
  clearScreen,
  print,
  printHeader,
  waitForEnter,
  askQuestion,
  showProgress
};