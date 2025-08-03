#!/usr/bin/env node

// === PROJECT TOOL - MAIN ENTRY POINT ===
// Version 4.0.0 - Export/Import + Translation Management

const fs = require('fs');
const path = require('path');
const TranslationManager = require('./lib/translation/manager');
const { exportProject } = require('./lib/export-import/exporter');
const { importProject } = require('./lib/export-import/importer');
const { createFromTree } = require('./lib/export-import/treeBuilder');
const { SimpleMenu } = require('./lib/core/menu');
const { printHeader, print, clearScreen } = require('./lib/core/terminal');
const { createEnvTemplate, loadEnvFile } = require('./lib/utils/env');
const { askQuestion, askConfirm } = require('./lib/core/input');

// Setup API keys
async function setupApiKeys() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    print('\n📝 No .env file found. Let\'s set up your API keys.', 'yellow');
    print('This will improve translation quality significantly.', 'dim');
    print('You can skip this step and use the free API.\n', 'dim');
    
    const setupNow = await askConfirm('Would you like to set up API keys now?');
    
    if (setupNow) {
      const envContent = [];
      
      // OpenAI API Key
      print('\n🔑 OpenAI API Key (recommended)', 'cyan');
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
      
      if (envContent.length > 0) {
        fs.writeFileSync(envPath, envContent.join('\n'), 'utf8');
        print('\n✅ API keys saved to .env file', 'green');
      } else {
        print('\n⚠️  No API keys provided. Using free translation service.', 'yellow');
      }
    }
  }
}

// Main menu
async function mainMenu() {
  // Create .env template on first run
  createEnvTemplate();
  
  while (true) {
    printHeader();
    const menu = new SimpleMenu(
      '🚀 Select an option:',
      [
        { name: 'Export Project', value: 'export' },
        { name: 'Import Project', value: 'import' },
        { name: 'Create Structure from Tree', value: 'tree' },
        { name: '🌐 Manage Translations (Advanced Sync)', value: 'translations' },
        { name: '🔑 Setup API Keys', value: 'setup_api' },
        { name: 'Exit', value: 'exit' }
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
        await createFromTree();
        break;
      case 'translations':
        const translationManager = new TranslationManager();
        await translationManager.manage();
        break;
      case 'setup_api':
        await setupApiKeys();
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      case 'exit':
        printHeader();
        print('👋 Thank you for using Project Tool!', 'green');
        print('Star us on GitHub: https://github.com/AliSaadat-ir/interactive-project-tool', 'dim');
        process.exit(0);
    }
  }
}

// Start the application
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Project Tool v4.0.0');
    console.log('Export/Import projects and manage translations with ease');
    console.log('');
    console.log('Usage: project-tool [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version information');
    console.log('  --sync         Sync all translation files');
    console.log('  --check        Check translation consistency');
    console.log('  --setup        Setup API keys');
    console.log('');
    console.log('Features:');
    console.log('  - Export/Import JavaScript projects');
    console.log('  - Create folder structure from tree diagrams');
    console.log('  - Full translation synchronization');
    console.log('  - Automatic translation with AI');
    console.log('  - TypeScript types management');
    console.log('');
    console.log('More info: https://github.com/AliSaadat-ir/interactive-project-tool');
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('4.0.0');
    process.exit(0);
  }
  
  if (args.includes('--setup')) {
    await setupApiKeys();
    process.exit(0);
  }
  
  if (args.includes('--sync')) {
    const translationManager = new TranslationManager();
    await translationManager.quickSync();
    process.exit(0);
  }
  
  if (args.includes('--check')) {
    const translationManager = new TranslationManager();
    await translationManager.checkConsistency();
    process.exit(0);
  }
  
  try {
    // Check for first run
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath) && !fs.existsSync('.env.example')) {
      await setupApiKeys();
    }
    
    await mainMenu();
  } catch (error) {
    print(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle clean exit
process.on('SIGINT', () => {
  print('\n\n👋 Exiting...', 'yellow');
  process.exit(0);
});

// Run the application
main();