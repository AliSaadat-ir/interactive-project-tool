// === MENU SYSTEM ===
// Interactive menu with arrow key navigation and improved clearing

const { print, forceClearScreen, colors, hideCursor, showCursor } = require('./terminal');

class SimpleMenu {
  constructor(title, options) {
    this.title = title;
    this.options = options;
    this.selectedIndex = 0;
  }

  async show() {
    return new Promise((resolve) => {
      this.render();
      hideCursor();

      // Set up key handling
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleKeypress = (key) => {
        if (key === '\u0003') { // Ctrl+C
          showCursor();
          process.exit();
        } else if (key === '\r' || key === '\n') { // Enter
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handleKeypress);
          showCursor();
          resolve(this.options[this.selectedIndex]);
        } else if (key === '\u001b[A') { // Up arrow
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
        } else if (key === '\u001b[B') { // Down arrow
          this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
          this.render();
        } else if (key >= '1' && key <= '9') { // Number keys
          const index = parseInt(key) - 1;
          if (index < this.options.length) {
            this.selectedIndex = index;
            this.render();
          }
        }
      };

      process.stdin.on('data', handleKeypress);
    });
  }

  render() {
    // FIXED: Use forceClearScreen for complete clearing
    forceClearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        print(`  ▶ ${index + 1}. ${option.name}`, 'green');
      } else {
        print(`    ${index + 1}. ${option.name}`, 'white');
      }
    });

    console.log();
    print('Use ↑↓ arrows or number keys to select, Enter to confirm', 'dim');
    print('Press Ctrl+C to exit', 'dim');
  }
}

// FIXED: Enhanced multi-select menu with better clearing
class MultiSelectMenu extends SimpleMenu {
  constructor(title, options) {
    super(title, options);
    this.selected = new Set();
  }

  async show() {
    return new Promise((resolve) => {
      this.render();
      hideCursor();

      // Set up key handling
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const handleKeypress = (key) => {
        if (key === '\u0003') { // Ctrl+C
          showCursor();
          process.exit();
        } else if (key === '\r' || key === '\n') { // Enter
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handleKeypress);
          showCursor();
          resolve(Array.from(this.selected));
        } else if (key === '\u001b[A') { // Up arrow
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.render();
        } else if (key === '\u001b[B') { // Down arrow
          this.selectedIndex = Math.min(this.options.length - 1, this.selectedIndex + 1);
          this.render();
        } else if (key === ' ') { // Space to toggle selection
          const currentOption = this.options[this.selectedIndex];
          if (this.selected.has(currentOption.value)) {
            this.selected.delete(currentOption.value);
          } else {
            this.selected.add(currentOption.value);
          }
          this.render();
        } else if (key.toLowerCase() === 'a') { // 'A' to select/deselect all
          if (this.selected.size === this.options.length) {
            this.selected.clear();
          } else {
            this.options.forEach(option => {
              this.selected.add(option.value);
            });
          }
          this.render();
        }
      };

      process.stdin.on('data', handleKeypress);
    });
  }

  render() {
    // FIXED: Use forceClearScreen for complete clearing
    forceClearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.options.forEach((option, index) => {
      const isSelected = this.selected.has(option.value);
      const checkbox = isSelected ? '[✓]' : '[ ]';
      
      if (index === this.selectedIndex) {
        print(`  ▶ ${checkbox} ${option.name}`, 'green');
      } else {
        print(`    ${checkbox} ${option.name}`, isSelected ? 'cyan' : 'white');
      }
    });

    console.log();
    print(`Selected: ${this.selected.size} item(s)`, 'cyan');
    console.log();
    print('Use ↑↓ arrows to navigate, Space to select/deselect', 'dim');
    print('Press A to select/deselect all, Enter to confirm', 'dim');
    print('Press Ctrl+C to cancel', 'dim');
  }
}

// FIXED: Confirmation menu with better clearing
class ConfirmationMenu extends SimpleMenu {
  constructor(question, defaultYes = true) {
    const options = [
      { name: defaultYes ? '✓ Yes (default)' : 'Yes', value: true },
      { name: !defaultYes ? '✗ No (default)' : 'No', value: false }
    ];
    super(question, options);
    this.selectedIndex = defaultYes ? 0 : 1;
  }

  render() {
    // FIXED: Use forceClearScreen for complete clearing
    forceClearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        print(`  ▶ ${option.name}`, 'green');
      } else {
        print(`    ${option.name}`, 'white');
      }
    });

    console.log();
    print('Use ↑↓ arrows to select, Enter to confirm', 'dim');
    print('Press Ctrl+C to exit', 'dim');
  }
}

// FIXED: Progress menu for long operations
class ProgressMenu {
  constructor(title) {
    this.title = title;
    this.steps = [];
    this.currentStep = 0;
  }

  addStep(description) {
    this.steps.push({ description, completed: false });
  }

  markStepComplete(index) {
    if (index < this.steps.length) {
      this.steps[index].completed = true;
      this.currentStep = Math.max(this.currentStep, index + 1);
      this.render();
    }
  }

  render() {
    forceClearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.steps.forEach((step, index) => {
      const status = step.completed ? '✅' : (index === this.currentStep ? '🔄' : '⏳');
      const color = step.completed ? 'green' : (index === this.currentStep ? 'cyan' : 'dim');
      print(`  ${status} ${step.description}`, color);
    });
    
    console.log();
  }
}

module.exports = { 
  SimpleMenu, 
  MultiSelectMenu, 
  ConfirmationMenu, 
  ProgressMenu 
};