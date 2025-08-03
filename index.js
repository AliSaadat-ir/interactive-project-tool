#!/usr/bin/env node

// === TRANSLATION TOOL - MAIN ENTRY POINT ===
// Version 3.0.0 - Enhanced with full synchronization

const TranslationManager = require('./lib/translation/manager');
const { exportProject } = require('./lib/export-import/exporter');
const { importProject } = require('./lib/export-import/importer');
const { createFromTree } = require('./lib/export-import/treeBuilder');
const { SimpleMenu } = require('./lib/core/menu');
const { printHeader, print, clearScreen } = require('./lib/core/terminal');
const { createEnvTemplate } = require('./lib/utils/env');

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
      case 'exit':
        printHeader();
        print('👋 Thank you for using Translation Tool!', 'green');
        print('Goodbye!', 'cyan');
        process.exit(0);
    }
  }
}

// Start the application
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Translation Tool v3.0.0');
    console.log('');
    console.log('Usage: translation-tool [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --version, -v  Show version information');
    console.log('  --sync         Sync all translation files');
    console.log('  --check        Check translation consistency');
    console.log('');
    console.log('Features:');
    console.log('  - Full synchronization between all language files');
    console.log('  - Automatic update when English text changes');
    console.log('  - TypeScript types management');
    console.log('  - OpenAI integration for translations');
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('3.0.0');
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