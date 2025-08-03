// === INPUT UTILITIES ===
// Handles user input operations

const readline = require('readline');
const { colors } = require('./terminal');

// Ask a question and get answer
function askQuestion(question) {
  return new Promise((resolve) => {
    // Ensure stdin is not in raw mode
    if (process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
    }
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
    
    rl.question(colors.cyan + question + colors.reset, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Ask yes/no question
async function askConfirm(question, defaultYes = true) {
  const suffix = defaultYes ? ' (Y/n): ' : ' (y/N): ';
  const answer = await askQuestion(question + suffix);
  
  if (!answer) {
    return defaultYes;
  }
  
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

// Get multi-line input
function getMultilineInput(endMarker = 'DONE') {
  return new Promise((resolve) => {
    console.log(colors.dim + `(Type "${endMarker}" on a new line to finish)` + colors.reset);
    
    // Ensure stdin is not in raw mode
    if (process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
    }
    
    const lines = [];
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    rl.on('line', (line) => {
      if (line.trim().toUpperCase() === endMarker.toUpperCase()) {
        rl.close();
      } else {
        lines.push(line);
      }
    });
    
    rl.on('close', () => {
      resolve(lines.join('\n'));
    });
  });
}

// Select from list
async function selectFromList(items, message = 'Select an item:') {
  const { SimpleMenu } = require('./menu');
  
  const options = items.map((item, index) => ({
    name: typeof item === 'string' ? item : item.name,
    value: typeof item === 'string' ? item : item.value || item
  }));
  
  const menu = new SimpleMenu(message, options);
  return await menu.show();
}

// Pause execution
function pause(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  askQuestion,
  askConfirm,
  getMultilineInput,
  selectFromList,
  pause
};