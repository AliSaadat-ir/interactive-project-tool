#!/usr/bin/env node

// === PROJECT TOOL v4.3.0 - ENHANCED VERSION ===
// Export/Import + Translation Management with Extended Settings

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
    autoOpenFolder: false,
    openFolderInsteadOfFile: false,
    preferredIde: 'auto',
    preferredFileManager: 'auto',
    showHiddenFiles: false,
    excludePatterns: [],
    customExportPath: '',
    exportFilePrefix: 'export',
    maxExportFiles: 50,
    confirmBeforeDelete: true,
    translationReportFormat: 'both', // markdown, json, both
    autoBackupBeforeSync: true,
    showDetailedLogs: false,
    firstRun: true
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
      mymemory: true
    }
  };
}

// Setup API keys
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
      return false;
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
  return true;
}

// Detect currently running IDEs/editors
async function detectRunningIDEs() {
  const { exec } = require('child_process');
  const runningIDEs = [];
  
  return new Promise((resolve) => {
    let command;
    
    if (process.platform === 'win32') {
      command = 'tasklist /FO CSV';
    } else if (process.platform === 'darwin') {
      command = 'ps aux';
    } else {
      command = 'ps aux';
    }
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve(runningIDEs);
        return;
      }
      
      const output = stdout.toLowerCase();
      
      // Extended IDE map with Trae
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
        'emacs': ['emacs'],
        'trae': ['trae', 'trae.exe']
      };
      
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

// Open file or folder with appropriate application
async function openFileOrFolder(targetPath, settings, isFolder = false) {
  const { exec } = require('child_process');
  
  // Determine if we should open folder instead of file
  if (!isFolder && settings.openFolderInsteadOfFile) {
    targetPath = path.dirname(targetPath);
    isFolder = true;
  }
  
  if (isFolder) {
    // Open folder with file manager
    return openFolderWithExplorer(targetPath, settings);
  } else {
    // Open file with IDE
    return openFileWithIDE(targetPath, settings);
  }
}

// Open folder with file explorer
async function openFolderWithExplorer(folderPath, settings) {
  const { exec } = require('child_process');
  
  print('📂 Opening folder...', 'dim');
  
  const commands = [];
  
  // Add preferred file manager first
  if (settings.preferredFileManager !== 'auto') {
    commands.push(settings.preferredFileManager);
  }
  
  // Add platform-specific commands
  if (process.platform === 'win32') {
    commands.push('explorer');
  } else if (process.platform === 'darwin') {
    commands.push('open');
  } else {
    commands.push('xdg-open', 'nautilus', 'dolphin', 'thunar');
  }
  
  // Try each command
  for (const command of commands) {
    try {
      await new Promise((resolve, reject) => {
        exec(`${command} "${folderPath}"`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      print(`📁 Opened folder with ${command}`, 'green');
      return true;
    } catch (error) {
      continue;
    }
  }
  
  print(`⚠️  Could not open folder automatically. Location: ${folderPath}`, 'yellow');
  return false;
}

// Open file with IDE
async function openFileWithIDE(filePath, settings) {
  const { exec } = require('child_process');
  
  print('🔍 Detecting running IDEs...', 'dim');
  
  const runningIDEs = await detectRunningIDEs();
  const openCommands = [];
  
  if (runningIDEs.length > 0) {
    openCommands.push(...runningIDEs);
    print(`📍 Found running IDE(s): ${runningIDEs.join(', ')}`, 'cyan');
  }
  
  if (settings.preferredIde !== 'auto' && !runningIDEs.includes(settings.preferredIde)) {
    openCommands.push(settings.preferredIde);
  }
  
  const commonIDEs = [];
  if (process.platform === 'win32') {
    commonIDEs.push('code', 'notepad++', 'trae', 'notepad');
  } else if (process.platform === 'darwin') {
    commonIDEs.push('code', 'subl', 'atom', 'trae', 'open');
  } else {
    commonIDEs.push('code', 'subl', 'gedit', 'kate', 'trae', 'xdg-open');
  }
  
  for (const ide of commonIDEs) {
    if (!openCommands.includes(ide)) {
      openCommands.push(ide);
    }
  }
  
  for (const command of openCommands) {
    try {
      await new Promise((resolve, reject) => {
        exec(`${command} "${filePath}"`, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      
      const isRunning = runningIDEs.includes(command);
      const status = isRunning ? '(currently running)' : '(launching)';
      print(`📖 Opening file with ${command} ${status}`, 'green');
      return true;
    } catch (error) {
      continue;
    }
  }
  
  print(`⚠️  Could not open file automatically. File location: ${filePath}`, 'yellow');
  return false;
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

// Enhanced settings menu
async function showSettingsMenu() {
  const settings = loadSettings();
  const env = loadEnvFromInstallDir();
  const apiStatus = checkApiKeysStatus(env);
  
  while (true) {
    printHeader();
    print('⚙️  SETTINGS', 'yellow');
    console.log();
    
    const menuOptions = [
      { 
        name: '🌐 Translation Settings', 
        value: 'translation_settings', 
        detail: 'Configure translation APIs, report formats, and backup options\nManage how translations are processed and saved'
      },
      { 
        name: '📂 File & Folder Settings', 
        value: 'file_settings',
        detail: 'Control how files and folders are opened\nConfigure IDE preferences and file manager options'
      },
      { 
        name: '📤 Export/Import Settings', 
        value: 'export_settings',
        detail: 'Customize export file naming and locations\nSet patterns for file exclusion and limits'
      },
      { 
        name: '🔑 API Keys Management', 
        value: 'api_keys',
        detail: `OpenAI: ${apiStatus.hasOpenAI ? '✅ Configured' : '❌ Not set'}\nGoogle: ${apiStatus.hasGoogle ? '✅ Configured' : '❌ Not set'}`
      },
      { 
        name: '🎨 Display Settings', 
        value: 'display_settings',
        detail: 'Control verbosity and logging levels\nCustomize terminal output preferences'
      },
      { 
        name: '🔄 Reset to Defaults', 
        value: 'reset',
        detail: 'Reset all settings to default values\nThis will not affect your API keys'
      },
      { 
        name: '↩️  Back to Main Menu', 
        value: 'back',
        detail: 'Return to the main menu'
      }
    ];
    
    const menu = new DetailedSettingsMenu(
      'Select a setting category:',
      menuOptions
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'translation_settings':
        await configureTranslationSettings(settings);
        break;
      case 'file_settings':
        await configureFileSettings(settings);
        break;
      case 'export_settings':
        await configureExportSettings(settings);
        break;
      case 'api_keys':
        const updated = await setupApiKeys();
        if (updated) {
          Object.assign(env, loadEnvFromInstallDir());
        }
        break;
      case 'display_settings':
        await configureDisplaySettings(settings);
        break;
      case 'reset':
        await resetSettings();
        break;
      case 'back':
        return;
    }
  }
}

// Configure translation settings
async function configureTranslationSettings(settings) {
  while (true) {
    printHeader();
    print('🌐 TRANSLATION SETTINGS', 'yellow');
    console.log();
    
    const menuOptions = [
      {
        name: `Default Translation API: ${settings.defaultTranslationApi}`,
        value: 'default_api',
        detail: 'Choose which translation API to use by default'
      },
      {
        name: `Report Format: ${settings.translationReportFormat}`,
        value: 'report_format',
        detail: 'Choose format for translation reports (markdown/json/both)'
      },
      {
        name: `Auto-backup before sync: ${settings.autoBackupBeforeSync ? 'Enabled' : 'Disabled'}`,
        value: 'auto_backup',
        detail: 'Automatically backup translations before synchronization'
      },
      {
        name: '↩️  Back',
        value: 'back'
      }
    ];
    
    const menu = new DetailedSettingsMenu(
      'Configure translation options:',
      menuOptions
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'default_api':
        await configureApiSettings(settings);
        break;
      case 'report_format':
        await configureReportFormat(settings);
        break;
      case 'auto_backup':
        settings.autoBackupBeforeSync = !settings.autoBackupBeforeSync;
        saveSettings(settings);
        print(`\n✅ Auto-backup ${settings.autoBackupBeforeSync ? 'enabled' : 'disabled'}`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'back':
        return;
    }
  }
}

// Configure file settings
async function configureFileSettings(settings) {
  while (true) {
    printHeader();
    print('📂 FILE & FOLDER SETTINGS', 'yellow');
    console.log();
    
    const menuOptions = [
      {
        name: `Auto-open reports: ${settings.autoOpenReports ? 'Enabled' : 'Disabled'}`,
        value: 'auto_open_reports',
        detail: 'Automatically open generated reports after creation'
      },
      {
        name: `Open folder instead of file: ${settings.openFolderInsteadOfFile ? 'Enabled' : 'Disabled'}`,
        value: 'open_folder_instead',
        detail: 'Open containing folder instead of the file itself'
      },
      {
        name: `Preferred IDE: ${settings.preferredIde}`,
        value: 'preferred_ide',
        detail: 'Default IDE/editor for opening files'
      },
      {
        name: `Preferred File Manager: ${settings.preferredFileManager}`,
        value: 'preferred_file_manager',
        detail: 'Default application for browsing folders'
      },
      {
        name: `Show hidden files: ${settings.showHiddenFiles ? 'Enabled' : 'Disabled'}`,
        value: 'show_hidden',
        detail: 'Show hidden files in file browsers'
      },
      {
        name: '↩️  Back',
        value: 'back'
      }
    ];
    
    const menu = new DetailedSettingsMenu(
      'Configure file and folder options:',
      menuOptions
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'auto_open_reports':
        settings.autoOpenReports = !settings.autoOpenReports;
        saveSettings(settings);
        print(`\n✅ Auto-open reports ${settings.autoOpenReports ? 'enabled' : 'disabled'}`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'open_folder_instead':
        settings.openFolderInsteadOfFile = !settings.openFolderInsteadOfFile;
        saveSettings(settings);
        print(`\n✅ Open folder instead ${settings.openFolderInsteadOfFile ? 'enabled' : 'disabled'}`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'preferred_ide':
        await configurePreferredIDE(settings);
        break;
      case 'preferred_file_manager':
        await configurePreferredFileManager(settings);
        break;
      case 'show_hidden':
        settings.showHiddenFiles = !settings.showHiddenFiles;
        saveSettings(settings);
        print(`\n✅ Show hidden files ${settings.showHiddenFiles ? 'enabled' : 'disabled'}`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'back':
        return;
    }
  }
}

// Configure export settings
async function configureExportSettings(settings) {
  while (true) {
    printHeader();
    print('📤 EXPORT/IMPORT SETTINGS', 'yellow');
    console.log();
    
    const menuOptions = [
      {
        name: `Export file prefix: "${settings.exportFilePrefix}"`,
        value: 'export_prefix',
        detail: 'Prefix for exported files (e.g., export_20250804.txt)'
      },
      {
        name: `Custom export path: ${settings.customExportPath || 'Current directory'}`,
        value: 'export_path',
        detail: 'Default location for saving export files'
      },
      {
        name: `Max export files: ${settings.maxExportFiles}`,
        value: 'max_files',
        detail: 'Maximum number of export files to keep'
      },
      {
        name: `Confirm before delete: ${settings.confirmBeforeDelete ? 'Enabled' : 'Disabled'}`,
        value: 'confirm_delete',
        detail: 'Ask for confirmation before deleting files'
      },
      {
        name: 'Exclude patterns',
        value: 'exclude_patterns',
        detail: `${settings.excludePatterns.length} custom patterns defined`
      },
      {
        name: '↩️  Back',
        value: 'back'
      }
    ];
    
    const menu = new DetailedSettingsMenu(
      'Configure export/import options:',
      menuOptions
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'export_prefix':
        await configureExportPrefix(settings);
        break;
      case 'export_path':
        await configureExportPath(settings);
        break;
      case 'max_files':
        await configureMaxFiles(settings);
        break;
      case 'confirm_delete':
        settings.confirmBeforeDelete = !settings.confirmBeforeDelete;
        saveSettings(settings);
        print(`\n✅ Confirm before delete ${settings.confirmBeforeDelete ? 'enabled' : 'disabled'}`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'exclude_patterns':
        await configureExcludePatterns(settings);
        break;
      case 'back':
        return;
    }
  }
}

// Configure display settings
async function configureDisplaySettings(settings) {
  while (true) {
    printHeader();
    print('🎨 DISPLAY SETTINGS', 'yellow');
    console.log();
    
    const menuOptions = [
      {
        name: `Show detailed logs: ${settings.showDetailedLogs ? 'Enabled' : 'Disabled'}`,
        value: 'detailed_logs',
        detail: 'Show verbose output during operations'
      },
      {
        name: '↩️  Back',
        value: 'back'
      }
    ];
    
    const menu = new DetailedSettingsMenu(
      'Configure display options:',
      menuOptions
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'detailed_logs':
        settings.showDetailedLogs = !settings.showDetailedLogs;
        saveSettings(settings);
        print(`\n✅ Detailed logs ${settings.showDetailedLogs ? 'enabled' : 'disabled'}`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'back':
        return;
    }
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
    { 
      name: 'Auto (Best Available)', 
      value: 'auto',
      detail: 'Automatically choose the best available API\nPriority: OpenAI > Google > MyMemory' 
    },
    { 
      name: apiStatus.hasOpenAI ? 'OpenAI GPT-3.5 ✅' : 'OpenAI GPT-3.5 (Not configured)', 
      value: 'openai',
      detail: 'High-quality translations with context awareness\nRequires API key from OpenAI' 
    },
    { 
      name: apiStatus.hasGoogle ? 'Google Translate ✅' : 'Google Translate (Not configured)', 
      value: 'google',
      detail: 'Professional translation service\nRequires API key from Google Cloud' 
    },
    { 
      name: 'MyMemory (Free)', 
      value: 'mymemory',
      detail: 'Free translation service with rate limits\nNo API key required, basic quality' 
    }
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

// Configure report format
async function configureReportFormat(settings) {
  printHeader();
  print('📄 REPORT FORMAT SETTINGS', 'yellow');
  console.log();
  
  const options = [
    { name: 'Markdown only', value: 'markdown' },
    { name: 'JSON only', value: 'json' },
    { name: 'Both formats', value: 'both' }
  ];
  
  const menu = new SimpleMenu('Choose report format:', options);
  const selected = await menu.show();
  
  settings.translationReportFormat = selected.value;
  saveSettings(settings);
  
  print(`\n✅ Report format set to: ${selected.name}`, 'green');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure preferred IDE
async function configurePreferredIDE(settings) {
  printHeader();
  print('📝 PREFERRED IDE/EDITOR', 'yellow');
  console.log();
  
  const ideOptions = [
    { name: 'Auto-detect (try common IDEs)', value: 'auto' },
    { name: 'Visual Studio Code', value: 'code' },
    { name: 'Sublime Text', value: 'subl' },
    { name: 'Atom', value: 'atom' },
    { name: 'WebStorm', value: 'webstorm' },
    { name: 'IntelliJ IDEA', value: 'intellij' },
    { name: 'Trae', value: 'trae' },
    { name: 'Notepad++ (Windows)', value: 'notepad++' },
    { name: 'System default editor', value: process.platform === 'win32' ? 'notepad' : 
                                            process.platform === 'darwin' ? 'open' : 'xdg-open' },
    { name: 'Custom command', value: 'custom' }
  ];
  
  const menu = new SimpleMenu('Choose preferred IDE/editor:', ideOptions);
  const selected = await menu.show();
  
  if (selected.value === 'custom') {
    const customCommand = await askQuestion('Enter custom command: ');
    settings.preferredIde = customCommand.trim() || 'auto';
  } else {
    settings.preferredIde = selected.value;
  }
  
  saveSettings(settings);
  
  print(`\n✅ Preferred IDE set to: ${settings.preferredIde}`, 'green');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure preferred file manager
async function configurePreferredFileManager(settings) {
  printHeader();
  print('📁 PREFERRED FILE MANAGER', 'yellow');
  console.log();
  
  const options = [
    { name: 'Auto-detect (system default)', value: 'auto' }
  ];
  
  if (process.platform === 'win32') {
    options.push({ name: 'Windows Explorer', value: 'explorer' });
  } else if (process.platform === 'darwin') {
    options.push({ name: 'Finder', value: 'open' });
  } else {
    options.push(
      { name: 'Nautilus (GNOME)', value: 'nautilus' },
      { name: 'Dolphin (KDE)', value: 'dolphin' },
      { name: 'Thunar (XFCE)', value: 'thunar' }
    );
  }
  
  options.push({ name: 'Custom command', value: 'custom' });
  
  const menu = new SimpleMenu('Choose preferred file manager:', options);
  const selected = await menu.show();
  
  if (selected.value === 'custom') {
    const customCommand = await askQuestion('Enter custom command: ');
    settings.preferredFileManager = customCommand.trim() || 'auto';
  } else {
    settings.preferredFileManager = selected.value;
  }
  
  saveSettings(settings);
  
  print(`\n✅ Preferred file manager set to: ${settings.preferredFileManager}`, 'green');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure export prefix
async function configureExportPrefix(settings) {
  printHeader();
  print('📝 EXPORT FILE PREFIX', 'yellow');
  console.log();
  
  print(`Current prefix: "${settings.exportFilePrefix}"`, 'cyan');
  print('Example: export_20250804_1425.txt', 'dim');
  console.log();
  
  const newPrefix = await askQuestion('Enter new prefix (or press Enter to keep current): ');
  
  if (newPrefix.trim()) {
    settings.exportFilePrefix = newPrefix.trim();
    saveSettings(settings);
    print(`\n✅ Export prefix set to: "${settings.exportFilePrefix}"`, 'green');
  } else {
    print('\n❌ Prefix not changed', 'yellow');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure export path
async function configureExportPath(settings) {
  printHeader();
  print('📁 CUSTOM EXPORT PATH', 'yellow');
  console.log();
  
  print(`Current path: ${settings.customExportPath || 'Current directory'}`, 'cyan');
  console.log();
  
  const menu = new SimpleMenu(
    'Choose export path option:',
    [
      { name: 'Use current directory (default)', value: 'current' },
      { name: 'Enter custom path', value: 'custom' },
      { name: 'Browse and select', value: 'browse' }
    ]
  );
  
  const choice = await menu.show();
  
  switch (choice.value) {
    case 'current':
      settings.customExportPath = '';
      break;
    case 'custom':
      const customPath = await askQuestion('Enter export path: ');
      if (customPath.trim() && fs.existsSync(customPath.trim())) {
        settings.customExportPath = customPath.trim();
      } else {
        print('\n❌ Invalid path', 'red');
        await new Promise(resolve => setTimeout(resolve, 1500));
        return;
      }
      break;
    case 'browse':
      const { selectDirectory } = require('./lib/core/fileSystem');
      const selected = await selectDirectory(process.cwd(), 'Select export directory:');
      if (selected) {
        settings.customExportPath = selected;
      }
      break;
  }
  
  saveSettings(settings);
  print(`\n✅ Export path updated`, 'green');
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure max files
async function configureMaxFiles(settings) {
  printHeader();
  print('📊 MAXIMUM EXPORT FILES', 'yellow');
  console.log();
  
  print(`Current limit: ${settings.maxExportFiles} files`, 'cyan');
  console.log();
  
  const newLimit = await askQuestion('Enter new limit (10-1000): ');
  const limit = parseInt(newLimit);
  
  if (!isNaN(limit) && limit >= 10 && limit <= 1000) {
    settings.maxExportFiles = limit;
    saveSettings(settings);
    print(`\n✅ Max export files set to: ${settings.maxExportFiles}`, 'green');
  } else {
    print('\n❌ Invalid limit. Please enter a number between 10 and 1000.', 'red');
  }
  
  await new Promise(resolve => setTimeout(resolve, 1500));
}

// Configure exclude patterns
async function configureExcludePatterns(settings) {
  while (true) {
    printHeader();
    print('🚫 EXCLUDE PATTERNS', 'yellow');
    console.log();
    
    if (settings.excludePatterns.length > 0) {
      print('Current patterns:', 'cyan');
      settings.excludePatterns.forEach((pattern, index) => {
        print(`  ${index + 1}. ${pattern}`, 'white');
      });
      console.log();
    } else {
      print('No custom exclude patterns defined.', 'dim');
      console.log();
    }
    
    const menu = new SimpleMenu(
      'Manage exclude patterns:',
      [
        { name: 'Add pattern', value: 'add' },
        { name: 'Remove pattern', value: 'remove' },
        { name: 'Clear all patterns', value: 'clear' },
        { name: '↩️  Back', value: 'back' }
      ]
    );
    
    const choice = await menu.show();
    
    switch (choice.value) {
      case 'add':
        const pattern = await askQuestion('Enter pattern (e.g., *.log, temp/): ');
        if (pattern.trim()) {
          settings.excludePatterns.push(pattern.trim());
          saveSettings(settings);
          print(`\n✅ Added pattern: ${pattern.trim()}`, 'green');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'remove':
        if (settings.excludePatterns.length > 0) {
          const removeMenu = new SimpleMenu(
            'Select pattern to remove:',
            settings.excludePatterns.map((p, i) => ({ name: p, value: i }))
          );
          const toRemove = await removeMenu.show();
          settings.excludePatterns.splice(toRemove.value, 1);
          saveSettings(settings);
          print(`\n✅ Pattern removed`, 'green');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'clear':
        settings.excludePatterns = [];
        saveSettings(settings);
        print(`\n✅ All patterns cleared`, 'green');
        await new Promise(resolve => setTimeout(resolve, 1000));
        break;
      case 'back':
        return;
    }
  }
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
      autoOpenFolder: false,
      openFolderInsteadOfFile: false,
      preferredIde: 'auto',
      preferredFileManager: 'auto',
      showHiddenFiles: false,
      excludePatterns: [],
      customExportPath: '',
      exportFilePrefix: 'export',
      maxExportFiles: 50,
      confirmBeforeDelete: true,
      translationReportFormat: 'both',
      autoBackupBeforeSync: true,
      showDetailedLogs: false,
      firstRun: false
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
  
  const setupKeys = await askConfirmMenu('Would you like to setup API keys for better translation quality?');
  
  if (setupKeys) {
    await setupApiKeys();
  }
  
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

// Enhanced main menu
async function mainMenu() {
  let env = loadEnvFromInstallDir();
  let settings = await firstRunSetup();
  
  const apiStatus = checkApiKeysStatus(env);
  
  while (true) {
    printHeader();
    
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
        env = loadEnvFromInstallDir();
        settings = loadSettings();
        const translationManager = new TranslationManager(env, settings, openFileOrFolder);
        await translationManager.manage();
        break;
        
      case 'settings':
        await showSettingsMenu();
        env = loadEnvFromInstallDir();
        settings = loadSettings();
        break;
        
      case 'exit':
        await exitProgram();
        return;
    }
  }
}

// Enhanced tree creation
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
  
  const { parseTreeStructure, countTreeItems } = require('./lib/utils/treeParser');
  const structure = parseTreeStructure(treeText);
  
  if (structure.length === 0) {
    print('\n❌ Could not parse the tree structure!', 'red');
    print('Make sure to use the correct tree characters (├── │ └──)', 'dim');
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }
  
  printHeader();
  print('✅ Tree Structure Parsed Successfully!', 'green');
  console.log();
  
  const counts = countTreeItems(structure);
  print(`📁 Root folder: ${structure[0].name}`, 'yellow');
  print(`📊 Total folders: ${counts.folders}`, 'cyan');
  print(`📄 Total files: ${counts.files}`, 'cyan');
  print(`🔢 Total items: ${counts.total}`, 'cyan');
  console.log();
  
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
  
  const rootPath = path.join(destination, structure[0].name);
  if (fs.existsSync(rootPath)) {
    print(`\n⚠️  Folder "${structure[0].name}" already exists!`, 'yellow');
    const overwrite = await askConfirmMenu('Continue and merge with existing structure?');
    if (!overwrite) {
      return;
    }
  }
  
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
  
  printHeader();
  print('🔄 Creating folder structure...', 'yellow');
  
  try {
    const { createStructureFromTree } = require('./lib/utils/treeParser');
    const stats = createStructureFromTree(structure, destination);
    
    print(`\n✅ Structure created successfully!`, 'green');
    print(`📁 Created ${stats.folders} folders`, 'cyan');
    print(`📄 Created ${stats.files} files`, 'cyan');
    print(`📍 Location: ${rootPath}`, 'cyan');
    
    console.log();
    const settings = loadSettings();
    
    if (settings.openFolderInsteadOfFile || settings.autoOpenFolder) {
      const openFolder = await askConfirmMenu('Would you like to open the created folder?');
      
      if (openFolder) {
        await openFolderWithExplorer(rootPath, settings);
      }
    }
  } catch (error) {
    print(`\n❌ Failed to create structure: ${error.message}`, 'red');
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// Fixed exit program
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
  // If not confirmed, return to main menu (function will return naturally)
}

// Enhanced main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('4.3.0');
    process.exit(0);
  }
  
  if (args.includes('--setup')) {
    await setupApiKeys();
    process.exit(0);
  }
  
  if (args.includes('--sync') || args.includes('--check')) {
    const env = loadEnvFromInstallDir();
    const settings = loadSettings();
    const translationManager = new TranslationManager(env, settings, openFileOrFolder);
    
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

// Show help
function showHelp() {
  console.log(`
Project Tool v4.3.0 - Enhanced Export/Import & Translation Manager
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
  ⚙️ Extended Settings  Comprehensive customization options

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