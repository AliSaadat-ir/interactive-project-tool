// === TERMINAL UTILITIES ===
// Handles terminal display and colors with improved clearing

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

// FIXED: Improved clear screen function
function clearScreen() {
  // Clear screen and move cursor to top-left
  process.stdout.write('\x1b[2J\x1b[H');
  
  // Alternative method for better compatibility
  if (process.platform === 'win32') {
    // For Windows, also clear the scrollback buffer
    process.stdout.write('\x1b[3J');
  }
  
  // Ensure the cursor is at the top
  process.stdout.write('\x1b[1;1H');
}

// FIXED: Force clear with buffer reset
function forceClearScreen() {
  // Clear entire screen including scrollback buffer
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
  
  // Move cursor to home position
  process.stdout.write('\x1b[1;1H');
  
  // Clear any remaining artifacts
  process.stdout.write('\x1b[0m');
}

// Print colored text
function print(text, color = 'reset') {
  console.log(colors[color] + text + colors.reset);
}

// FIXED: Print header with forced clear
function printHeader() {
  forceClearScreen();
  print('╔════════════════════════════════════════╗', 'cyan');
  print('║   PROJECT TOOL v4.2.1                 ║', 'cyan');
  print('║   Enhanced Export/Import & Translation ║', 'cyan');
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

// Clear line and move cursor
function clearLine() {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
}

// Clear from cursor to end of screen
function clearToEnd() {
  process.stdout.write('\x1b[0J');
}

// Hide cursor
function hideCursor() {
  process.stdout.write('\x1b[?25l');
}

// Show cursor
function showCursor() {
  process.stdout.write('\x1b[?25h');
}

// Move cursor to position
function moveCursor(x, y) {
  process.stdout.write(`\x1b[${y};${x}H`);
}

// FIXED: Ensure proper cleanup on exit
process.on('exit', () => {
  showCursor();
  process.stdout.write(colors.reset);
});

process.on('SIGINT', () => {
  showCursor();
  process.stdout.write(colors.reset);
  process.exit(0);
});

module.exports = {
  colors,
  clearScreen,
  forceClearScreen,
  print,
  printHeader,
  waitForEnter,
  askQuestion,
  showProgress,
  clearLine,
  clearToEnd,
  hideCursor,
  showCursor,
  moveCursor
};