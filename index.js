#!/usr/bin/env node

// === PROJECT TOOL v4.2.1 - ENHANCED VERSION ===
// Export/Import + Translation Management with Better UX

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get installation directory for .env file
const INSTALL_DIR = path.dirname(require.main.filename);
const ENV_PATH = path.join(INSTALL_DIR, '.env');
const SETTINGS_PATH = path.join(INSTALL_DIR, 'settings.json');

// Load environment from installation directory
function loadEnvFromInstallDir() {
  const env = {};
  
  if (fs.existsSync(ENV_PATH)) {
    try {
      const content = fs.readFileSync(ENV_PATH, 'utf8');
      const lines = content.split(/\r?\n/);
      
      lines.forEach((line) => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) return;
        
        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();
        
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        env[key] = value;
      });
    } catch (error) {
      console.error(`Error reading .env: ${error.message}`);
    }
  }
  
  return env;
}

// Load settings from installation directory
function loadSettings() {
  const defaultSettings = {
    defaultTranslationApi: 'auto',
    autoOpenReports: true,
    firstRun: true,
    preferredIde: 'auto'
  };
  
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      const content = fs.readFileSync(SETTINGS_PATH, 'utf8');
      return { ...defaultSettings, ...JSON.parse(content) };
    } catch (error) {
      console.error(`Error reading settings: ${error.message}`);
    }
  }
  
  return defaultSettings;
}

// Save settings to installation directory
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error saving settings: ${error.message}`);
    return false;
  }
}

// Initialize modules
const TranslationManager = require('./lib/translation/manager');
const { exportProject } = require('./lib/export-import/exporter');
const { importProject } = require('./lib/export-import/importer');
const { createFromTree } = require('./lib/export-import/treeBuilder');
const { manageExportFiles } = require('./lib/export-import/exportFileManager');
const { SimpleMenu } = require('./lib/core/menu');
const { printHeader, print, clearScreen } = require('./lib/core/terminal');
const { askQuestion } = require('./lib/core/input');

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

// Check API keys status
function checkApiKeysStatus(env) {
  const hasOpenAI = !!(env.OPENAI_API_KEY);
  const hasGoogle = !!(env.GOOGLE_TRANSLATE_API_KEY);
  
  return {
    hasOpenAI,
    hasGoogle,
    hasAnyKey: hasOpenAI || hasGoogle,
    availableApis: {
      openai: hasOpenAI,
      google: hasGoogle,
      mymemory: true // Always available
    }
  };
}

// Setup API keys in installation directory
async function setupApiKeys() {
  printHeader();
  print('🔑 API KEY SETUP', 'yellow');
  print(`Configuration will be saved to: ${ENV_PATH}`, 'dim');
  console.log();
  
  if (fs.existsSync(ENV_PATH)) {
    print('📝 Existing .env file found.', 'cyan');
    const overwrite = await askConfirmMenu('Do you want to update the existing configuration?');
    
    if (!overwrite) {
      print('\n⚠️  Setup cancelled', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return false; // Return false to indicate no changes
    }
  }
  
  print('\n📝 Let\'s set up your API keys for better translation quality.', 'yellow');
  print('You can skip any key and use the free API instead.\n', 'dim');
  
  const envContent = [];
  envContent.push('# Translation Tool Configuration');
  envContent.push(`# Created: ${new Date().toISOString()}`);
  envContent.push('');
  
  // OpenAI API Key
  print('🔑 OpenAI API Key (recommended for best quality)', 'cyan');
  print('Get your key from: https://platform.openai.com/api-keys', 'dim');
  const openaiKey = await askQuestion('Enter your OpenAI API key (or press Enter to skip): ');
  
  if (openaiKey.trim()) {
    envContent.push(`# OpenAI API Key`);
    envContent.push(`OPENAI_API_KEY=${openaiKey.trim()}`);
    envContent.push('');
  }
  
  // Google Translate API Key
  print('\n🔑 Google Translate API Key (optional)', 'cyan');
  print('Get your key from: https://console.cloud.google.com/apis/credentials', 'dim');
  const googleKey = await askQuestion('Enter your Google Translate API key (or press Enter to skip): ');
  
  if (googleKey.trim()) {
    envContent.push(`# Google Translate API Key`);
    envContent.push(`GOOGLE_TRANSLATE_API_KEY=${googleKey.trim()}`);
    envContent.push('');
  }
  
  // Save configuration
  try {
    fs.writeFileSync(ENV_PATH, envContent.join('\n'), 'utf8');
    print('\n✅ API keys saved successfully!', 'green');
    print(`📁 Configuration location: ${ENV_PATH}`, 'dim');
  } catch (error) {
    print(`\n❌ Failed to save configuration: ${error.message}`, 'red');
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true; // Return true to indicate changes were made
}

// Detect currently running IDEs/editors
async function detectRunningIDEs() {
  const { exec } = require('child_process');
  const runningIDEs = [];
  
  return new Promise((resolve) => {
    let command;
    
    if (process.platform === 'win32') {
      // Windows: Use tasklist to find running processes
      command = 'tasklist /FO CSV';
    } else if (process.platform === 'darwin') {
      // macOS: Use ps to find running processes
      command = 'ps aux';
    } else {
      // Linux: Use ps to find running processes
      command = 'ps aux';
    }
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve(runningIDEs);
        return;
      }
      
      const output = stdout.toLowerCase();
      
      // Check for common IDEs and editors
      const ideMap = {
        'code': ['code', 'vscode', 'visual studio code'],
        'subl': ['subl', 'sublime', 'sublime_text'],
        'atom': ['atom'],
        'webstorm': ['webstorm'],
        'phpstorm': ['phpstorm'],
        'intellij': ['intellij', 'idea'],
        'notepad++': ['notepad++', 'notepad++.exe'],
        'gedit': ['gedit'],
        'kate': ['kate'],
        'nano': ['nano'],
        'vim': ['vim'],
        'emacs': ['emacs']
      };
      
      // Check which IDEs are running
      for (const [command, processNames] of Object.entries(ideMap)) {
        for (const processName of processNames) {
          if (output.includes(processName)) {
            if (!runningIDEs.includes(command)) {
              runningIDEs.push(command);
            }
          }
        }
      }
      
      resolve(runningIDEs);
    });
  });
}

// Open file with appropriate application - Enhanced with running IDE detection
async function openFileWithIDE(filePath, settings) {
  const { exec } = require('child_process');
  
  print('🔍 Detecting running IDEs...', 'dim');
  
  // First priority: Detect currently running IDEs
  const runningIDEs = await detectRunningIDEs();
  
  const openCommands = [];
  
  // Add running IDEs first (highest priority)
  if (runningIDEs.length > 0) {
    openCommands.push(...runningIDEs);
    print(`📍 Found running IDE(s): ${runningIDEs.join(', ')}`, 'cyan');
  }
  
  // Second priority: User's preferred IDE (if not already in running IDEs)
  if (settings.preferredIde !== 'auto' && !runningIDEs.includes(settings.preferredIde)) {
    openCommands.push(settings.preferredIde);
  }
  
  // Third priority: Common IDEs and editors based on platform
  const commonIDEs = [];
  if (process.platform === 'win32') {
    commonIDEs.push('code', 'notepad++', 'notepad');
  } else if (process.platform === 'darwin') {
    commonIDEs.push('code', 'subl', 'atom', 'open');
  } else {
    commonIDEs.push('code', 'subl', 'gedit', 'kate', 'xdg-open');
  }
  
  // Add common IDEs that aren't already in the list
  for (const ide of commonIDEs) {
    if (!openCommands.includes(ide)) {
      openCommands.push(ide);
    }
  }
  
  // Try each command in order
  for (const command of openCommands) {
    try {
      await new Promise((resolve, reject) => {
        if (command === 'open' || command === 'xdg-open') {
          exec(`${command} "${filePath}"`, (error) => {
            if (error) reject(error);
            else resolve();
          });
        } else {
          exec(`${command} "${filePath}"`, (error) => {
            if (error) reject(error);
            else resolve();
          });
        }
      });
      
      const isRunning = runningIDEs.includes(command);
      const status = isRunning ? '(currently running)' : '(launching)';
      print(`📖 Opening file with ${command} ${status}`, 'green');
      return true;
    } catch (error) {
      // Continue to next command
      continue;
    }
  }
  
  print(`⚠️  Could not open file automatically. File location: ${filePath}`, 'yellow');
  return false;
}

// Settings menu with details
async function showSettingsMenu() {
  const settings = loadSettings();
  const env = loadEnvFromInstallDir();
  const apiStatus = checkApiKeysStatus(env);
  
  while (true) {
    printHeader();
    print('⚙️  SETTINGS', 'yellow');
    console.log();
    
    const menuOptions = [
      { name: '🌐 Translation API Settings', value: 'api_settings', 
        detail: `Current: ${settings.defaultTranslationApi}\nChoose default API for translations` },
      { name: '🔑 API Keys Management', value: 'api_keys',
        detail: `OpenAI: ${apiStatus.hasOpenAI ? '✅ Configured' : '❌ Not set'}\nGoogle: ${apiStatus.hasGoogle ? '✅ Configured' : '❌ Not set'}` },
      { name: '📖 Report Opening Settings', value: 'report_settings',
        detail: `Auto-open: ${settings.autoOpenReports ? 'Enabled' : 'Disabled'}\nPreferred IDE: ${settings.preferredIde}` },
      { name: '🔄 Reset to Defaults', value: 'reset',
        detail: 'Reset all settings to default values\nThis will not affect your API keys' },
      { name: '↩️  Back to Main Menu', value: 'back',
        detail: 'Return to the main menu' }
    ];
    
    const menu = new DetailedSettingsMenu(
      'Select a setting to configure:',
      menuOptions
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'api_settings':
        await configureApiSettings(settings);
        break;
      case 'api_keys':
        const updated = await setupApiKeys();
        if (updated) {
          // Reload environment after API key update
          Object.assign(env, loadEnvFromInstallDir());
        }
        break;
      case 'report_settings':
        await configureReportSettings(settings);
        break;
      case 'reset':
        await resetSettings();
        break;
      case 'back':
        return;
    }
  }
}

// Detailed settings menu class
class DetailedSettingsMenu extends SimpleMenu {
  constructor(title, options) {
    super(title, options);
    this.selectedIndex = 0;
  }

  render() {
    clearScreen();
    print(this.title, 'yellow');
    console.log();
    
    this.options.forEach((option, index) => {
      if (index === this.selectedIndex) {
        print(`  ▶ ${index + 1}. ${option.name}`, 'green');
      } else {
        print(`    ${index + 1}. ${option.name}`, 'white');
      }
    });

    // Show details for selected option
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption.detail) {
      console.log();
      print('───────────────────────────────────────', 'dim');
      print('📋 Details:', 'cyan');
      const details = selectedOption.detail.split('\n');
      details.forEach(detail => {
        print(`   ${detail}`, 'dim');
      });
      print('───────────────────────────────────────', 'dim');
    }

    console.log();
    print('Use ↑↓ arrows or number keys to select, Enter to confirm', 'dim');
    print('Press Ctrl+C to exit', 'dim');
  }
}

// Configure API settings
async function configureApiSettings(settings) {
  const env = loadEnvFromInstallDir();
  const apiStatus = checkApiKeysStatus(env);
  
  printHeader();
  print('🌐 TRANSLATION API SETTINGS', 'yellow');
  console.log();
  
  const apiOptions = [
    { name: 'Auto (Best Available)', value: 'auto',
      detail: 'Automatically choose the best available API\nPriority: OpenAI > Google > MyMemory' },
    { name: apiStatus.hasOpenAI ? 'OpenAI GPT-3.5 ✅' : 'OpenAI GPT-3.5 (Not configured)', 
      value: 'openai',
      detail: 'High-quality translations with context awareness\nRequires API key from OpenAI' },
    { name: apiStatus.hasGoogle ? 'Google Translate ✅' : 'Google Translate (Not configured)', 
      value: 'google',
      detail: 'Professional translation service\nRequires API key from Google Cloud' },
    { name: 'MyMemory (Free)', value: 'mymemory',
      detail: 'Free translation service with rate limits\nNo API key required, basic quality' }
  ];
  
  const menu = new DetailedSettingsMenu(
    'Choose default translation API:',
    apiOptions
  );
  
  const selected = await menu.show();
  
  settings.defaultTranslationApi = selected.value;
  saveSettings(settings);
  
  print(`\n✅ Default API set to: ${selected.name}`, 'green');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure report settings
async function configureReportSettings(settings) {
  printHeader();
  print('📖 REPORT OPENING SETTINGS', 'yellow');
  console.log();
  
  // Auto-open setting
  const autoOpenMenu = new SimpleMenu(
    'Auto-open reports after generation?',
    [
      { name: 'Yes, always open reports automatically', value: true },
      { name: 'No, just show file location', value: false }
    ]
  );
  
  const autoOpen = await autoOpenMenu.show();
  settings.autoOpenReports = autoOpen.value;
  
  // IDE preference
  printHeader();
  print('📖 PREFERRED IDE/EDITOR', 'yellow');
  console.log();
  
  const ideOptions = [
    { name: 'Auto-detect (try common IDEs)', value: 'auto' },
    { name: 'Visual Studio Code', value: 'code' },
    { name: 'Sublime Text', value: 'subl' },
    { name: 'Atom', value: 'atom' },
    { name: 'System default editor', value: process.platform === 'win32' ? 'notepad' : 
                                            process.platform === 'darwin' ? 'open' : 'xdg-open' }
  ];
  
  const ideMenu = new SimpleMenu('Choose preferred IDE/editor:', ideOptions);
  const selectedIde = await ideMenu.show();
  settings.preferredIde = selectedIde.value;
  
  saveSettings(settings);
  
  print('\n✅ Report settings updated!', 'green');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Reset settings
async function resetSettings() {
  printHeader();
  print('🔄 RESET SETTINGS', 'yellow');
  console.log();
  
  const confirm = await askConfirmMenu(
    'Reset all settings to default values?\n(This will not affect your API keys)',
    false
  );
  
  if (confirm) {
    const defaultSettings = {
      defaultTranslationApi: 'auto',
      autoOpenReports: true,
      firstRun: false,
      preferredIde: 'auto'
    };
    
    saveSettings(defaultSettings);
    print('\n✅ Settings reset to defaults!', 'green');
  } else {
    print('\n❌ Reset cancelled', 'yellow');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// First run setup
async function firstRunSetup() {
  const settings = loadSettings();
  
  if (!settings.firstRun) {
    return settings;
  }
  
  printHeader();
  print('🎉 Welcome to Project Tool!', 'green');
  print('This is your first time using the tool. Let\'s get you set up!', 'dim');
  console.log();
  
  // API Setup
  const setupKeys = await askConfirmMenu('Would you like to setup API keys for better translation quality?');
  
  if (setupKeys) {
    await setupApiKeys();
  }
  
  // API Selection
  printHeader();
  print('🌐 Choose your preferred translation API:', 'cyan');
  console.log();
  
  const env = loadEnvFromInstallDir();
  const apiStatus = checkApiKeysStatus(env);
  
  const apiOptions = [
    { name: 'Auto (Recommended)', value: 'auto' },
    { name: apiStatus.hasOpenAI ? 'OpenAI GPT-3.5' : 'OpenAI GPT-3.5 (Not configured)', value: 'openai' },
    { name: 'MyMemory (Free)', value: 'mymemory' }
  ];
  
  const apiMenu = new SimpleMenu('Select default translation API:', apiOptions);
  const selectedApi = await apiMenu.show();
  
  settings.defaultTranslationApi = selectedApi.value;
  settings.firstRun = false;
  saveSettings(settings);
  
  print('\n✅ Setup complete! You can change these settings anytime from the main menu.', 'green');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return settings;
}

// Enhanced main menu with better UX
async function mainMenu() {
  // Load environment and settings
  let env = loadEnvFromInstallDir();
  let settings = await firstRunSetup();
  
  // Check API keys status
  const apiStatus = checkApiKeysStatus(env);
  
  while (true) {
    printHeader();
    
    // Show API status tip
    if (!apiStatus.hasAnyKey) {
      print('💡 Tip: Setup API keys in Settings for better translation quality', 'yellow');
      console.log();
    }
    
    const menu = new SimpleMenu(
      '🚀 What would you like to do today?',
      [
        { name: '📤 Export Project to File', value: 'export' },
        { name: '📥 Import Project from File', value: 'import' },
        { name: '🌳 Create Structure from Tree Diagram', value: 'tree' },
        { name: '🗑️  Manage Export Files', value: 'manage_exports' },
        { name: '🌐 Manage Translations (Advanced)', value: 'translations' },
        { name: '⚙️  Settings', value: 'settings' },
        { name: '❌ Exit', value: 'exit' }
      ]
    );

    const choice = await menu.show();

    switch (choice.value) {
      case 'export':
        await exportProject();
        break;
        
      case 'import':
        await importProject();
        break;
        
      case 'tree':
        await createFromTreeEnhanced();
        break;
        
      case 'manage_exports':
        await manageExportFiles();
        break;
        
      case 'translations':
        // Reload environment and settings before translation management
        env = loadEnvFromInstallDir();
        settings = loadSettings();
        const translationManager = new TranslationManager(env, settings, openFileWithIDE);
        await translationManager.manage();
        break;
        
      case 'settings':
        await showSettingsMenu();
        // Reload environment after settings change
        env = loadEnvFromInstallDir();
        settings = loadSettings();
        break;
        
      case 'exit':
        await exitProgram();
        return;
    }
  }
}

// Enhanced tree creation with folder selection
async function createFromTreeEnhanced() {
  printHeader();
  print('🌳 CREATE STRUCTURE FROM TREE', 'yellow');
  console.log();
  
  print('📝 Enter your folder tree structure:', 'cyan');
  print('Tip: You can copy from your documentation or design files', 'dim');
  console.log();
  
  print('Example:', 'dim');
  print('my-project', 'dim');
  print('├── src/', 'dim');
  print('│   ├── components/', 'dim');
  print('│   │   └── Button.jsx', 'dim');
  print('│   └── index.js', 'dim');
  print('└── package.json', 'dim');
  console.log();
  
  const { getMultilineInput } = require('./lib/core/input');
  const treeText = await getMultilineInput('DONE');
  
  if (!treeText.trim()) {
    print('\n❌ No tree structure provided!', 'red');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  
  // Parse the tree
  const { parseTreeStructure, countTreeItems } = require('./lib/utils/treeParser');
  const structure = parseTreeStructure(treeText);
  
  if (structure.length === 0) {
    print('\n❌ Could not parse the tree structure!', 'red');
    print('Make sure to use the correct tree characters (├── │ └──)', 'dim');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  
  // Show parsed structure
  printHeader();
  print('✅ Tree Structure Parsed Successfully!', 'green');
  console.log();
  
  const counts = countTreeItems(structure);
  print(`📁 Root folder: ${structure[0].name}`, 'yellow');
  print(`📊 Total folders: ${counts.folders}`, 'cyan');
  print(`📄 Total files: ${counts.files}`, 'cyan');
  print(`🔢 Total items: ${counts.total}`, 'cyan');
  console.log();
  
  // Select destination with enhanced options
  const destinationMenu = new SimpleMenu(
    'Where would you like to create this structure?',
    [
      { name: '📍 Current directory', value: 'current' },
      { name: '🆕 Create in new parent folder', value: 'new_parent' },
      { name: '📂 Browse and select directory', value: 'browse' },
      { name: '❌ Cancel', value: 'cancel' }
    ]
  );
  
  const destChoice = await destinationMenu.show();
  
  if (destChoice.value === 'cancel') {
    return;
  }
  
  let destination = process.cwd();
  
  switch (destChoice.value) {
    case 'new_parent':
      printHeader();
      print('🆕 Create New Parent Folder', 'cyan');
      console.log();
      
      // Suggest default name based on root folder of tree structure
      const suggestedName = structure[0].name + '_workspace';
      const parentName = await askQuestion(`Enter parent folder name (default: ${suggestedName}): `);
      const finalName = parentName.trim() || suggestedName;
      
      destination = path.join(process.cwd(), finalName);
      
      if (fs.existsSync(destination)) {
        print(`\n⚠️  Folder "${finalName}" already exists!`, 'yellow');
        const useExisting = await askConfirmMenu('Use existing folder?');
        if (!useExisting) {
          return;
        }
      } else {
        fs.mkdirSync(destination, { recursive: true });
        print(`\n✅ Created parent folder: ${finalName}`, 'green');
      }
      break;
      
    case 'browse':
      const { selectDirectory } = require('./lib/core/fileSystem');
      const selected = await selectDirectory(process.cwd(), 'Select destination directory:');
      if (!selected) return;
      destination = selected;
      break;
  }
  
  // Check if root folder already exists
  const rootPath = path.join(destination, structure[0].name);
  if (fs.existsSync(rootPath)) {
    print(`\n⚠️  Folder "${structure[0].name}" already exists!`, 'yellow');
    const overwrite = await askConfirmMenu('Continue and merge with existing structure?');
    if (!overwrite) {
      return;
    }
  }
  
  // Final confirmation
  printHeader();
  print('📋 Ready to Create Structure', 'cyan');
  console.log();
  print(`📁 Root folder: ${structure[0].name}`, 'white');
  print(`📍 Location: ${destination}`, 'white');
  print(`📊 Will create: ${counts.folders} folders, ${counts.files} files`, 'white');
  console.log();
  
  const confirm = await askConfirmMenu('Proceed with creation?');
  
  if (!confirm) {
    print('\n❌ Structure creation cancelled', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 1500));
    return;
  }
  
  // Create the structure
  printHeader();
  print('🔄 Creating folder structure...', 'yellow');
  
  try {
    const { createStructureFromTree } = require('./lib/utils/treeParser');
    const stats = createStructureFromTree(structure, destination);
    
    print(`\n✅ Structure created successfully!`, 'green');
    print(`📁 Created ${stats.folders} folders`, 'cyan');
    print(`📄 Created ${stats.files} files`, 'cyan');
    print(`📍 Location: ${rootPath}`, 'cyan');
    
    // Ask if user wants to open the folder
    console.log();
    const openFolder = await askConfirmMenu('Would you like to open the created folder?');
    
    if (openFolder) {
      const { exec } = require('child_process');
      if (process.platform === 'win32') {
        // Windows: Use explorer to open folder
        exec(`explorer "${rootPath.replace(/\//g, '\\')}"`);
      } else if (process.platform === 'darwin') {
        // macOS
        exec(`open "${rootPath}"`);
      } else {
        // Linux
        exec(`xdg-open "${rootPath}"`);
      }
    }
  } catch (error) {
    print(`\n❌ Failed to create structure: ${error.message}`, 'red');
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Enhanced exit with confirmation
async function exitProgram() {
  printHeader();
  print('👋 Thank you for using Project Tool!', 'green');
  console.log();
  
  const confirmExit = await askConfirmMenu('Are you sure you want to exit?');
  
  if (confirmExit) {
    print('\n🌟 Star us on GitHub:', 'cyan');
    print('https://github.com/AliSaadat-ir/interactive-project-tool', 'dim');
    console.log();
    print('Goodbye! 👋', 'yellow');
    process.exit(0);
  }
}

// Enhanced main function with better error handling
async function main() {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('4.2.1');
    process.exit(0);
  }
  
  if (args.includes('--setup')) {
    await setupApiKeys();
    process.exit(0);
  }
  
  // Quick commands for translation
  if (args.includes('--sync') || args.includes('--check')) {
    const env = loadEnvFromInstallDir();
    const settings = loadSettings();
    const translationManager = new TranslationManager(env, settings, openFileWithIDE);
    
    if (args.includes('--sync')) {
      await translationManager.quickSync();
    } else {
      await translationManager.checkConsistency();
    }
    process.exit(0);
  }
  
  try {
    await mainMenu();
  } catch (error) {
    print(`\n❌ Critical Error: ${error.message}`, 'red');
    console.error(error.stack);
    
    print('\n💡 If this persists, please report an issue:', 'yellow');
    print('https://github.com/AliSaadat-ir/interactive-project-tool/issues', 'dim');
    
    process.exit(1);
  }
}

// Show help information
function showHelp() {
  console.log(`
Project Tool v4.2.1 - Enhanced Export/Import & Translation Manager
================================================================

USAGE:
  project-tool [options]

OPTIONS:
  --help, -h     Show this help message
  --version, -v  Show version information
  --setup        Setup or update API keys
  --sync         Quick sync all translation files
  --check        Check translation consistency

FEATURES:
  📤 Export Projects    Convert entire projects to single files
  📥 Import Projects    Restore projects with smart directory selection
  🌳 Tree Creation     Create folder structures from tree diagrams
  🌐 Translations      Full translation synchronization with AI
  🏗️ Translation Setup  Create i18n structure for new projects
  🔑 API Integration   OpenAI and Google Translate support

INTERACTIVE MODE:
  Run without options to enter interactive mode with full menu

EXAMPLES:
  project-tool                  # Start interactive mode
  project-tool --setup          # Configure API keys
  project-tool --sync           # Sync all translations
  project-tool --check          # Check translation consistency

MORE INFO:
  Repository: https://github.com/AliSaadat-ir/interactive-project-tool
  Issues: https://github.com/AliSaadat-ir/interactive-project-tool/issues
`);
}

// Handle clean exit
process.on('SIGINT', () => {
  print('\n\n🛑 Interrupted by user', 'yellow');
  print('👋 Goodbye!', 'cyan');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  print('\n❌ Unexpected Error:', 'red');
  console.error(error);
  
  print('\n💡 Please report this issue:', 'yellow');
  print('https://github.com/AliSaadat-ir/interactive-project-tool/issues', 'dim');
  
  process.exit(1);
});

// Run the application
main();