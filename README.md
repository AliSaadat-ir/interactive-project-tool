# Interactive Project Tool v4.2

<div align="center">

![Version](https://img.shields.io/badge/version-4.2.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

**A powerful command-line tool that combines project export/import capabilities with advanced translation management, designed for seamless collaboration with AI assistants like Claude AI.**

[Features](#-key-features) • [Installation](#-installation) • [Usage](#-usage) • [Translation Management](#-translation-management) • [Settings](#-settings) • [Examples](#-examples)

</div>

---

## 🎯 Key Features

### 📤📥 **Project Export/Import**
- **Export Projects**: Convert your entire project into a single file for easy sharing
- **Import Projects**: Restore projects with advanced directory selection and management
- **Smart Filtering**: Automatic exclusion of unnecessary files (node_modules, build files, etc.)
- **Gitignore Support**: Option to use .gitignore patterns for intelligent filtering
- **Cross-Platform**: Works seamlessly on Windows, macOS, and Linux

### 🌳 **Structure Creation**
- **Tree to Structure**: Create folder/file structures from tree diagrams
- **Paste and Create**: Simply paste ASCII tree structures and generate real folders/files
- **Flexible Destinations**: Choose where to create structures with multiple options
- **Workspace Generation**: Auto-suggest workspace names based on project structure

### 🗑️ **File Management**
- **Export File Manager**: Clean up accumulated export files with ease
- **Batch Operations**: Select multiple files with intuitive Space key selection
- **Smart Filtering**: Automatically shows only relevant export files
- **Time Stamps**: Full date/time display for better file organization
- **Safe Deletion**: Multiple confirmation levels to prevent accidental deletions

### 🌐 **Advanced Translation Management**
- **Complete i18n Setup**: Create translation structure for projects without existing setup
- **14 Language Support**: English, Arabic, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Persian, Urdu
- **Smart Detection**: Auto-detect translation usage in existing codebases
- **AI-Powered Translation**: Integration with OpenAI GPT-3.5 and Google Translate
- **Synchronization**: Keep all language files perfectly in sync
- **TypeScript Support**: Auto-generate and update TypeScript type definitions
- **Conflict Resolution**: Intelligent handling of translation conflicts with quote variations
- **Usage Scanning**: Detect translation keys used throughout your codebase
- **Detailed Reports**: Generate comprehensive translation analysis reports

### ⚙️ **Settings & Customization**
- **Comprehensive Settings Menu**: Detailed configuration options with real-time descriptions
- **API Management**: Easy setup and switching between translation APIs
- **IDE Integration**: Smart detection of running IDEs with priority-based file opening
- **Auto-Open Reports**: Generated reports automatically open in your preferred editor
- **First-Run Setup**: Guided setup wizard for new users
- **Persistent Settings**: All preferences saved between sessions

### 🤖 **AI Assistant Integration**
- **Claude AI Optimized**: Perfect for collaboration with Claude AI
- **Export Format**: Specially designed export format for AI code analysis
- **Import Workflow**: Seamlessly import AI-generated code modifications
- **Structured Output**: Clean, parseable format for AI understanding

---

## 🚀 Installation

### Method 1: Clone and Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool

# Install globally
npm install -g .

# Run the tool
project-tool
```

### Method 2: Direct Download

```bash
# Download latest release
curl -L https://github.com/AliSaadat-ir/interactive-project-tool/archive/v4.2.0.tar.gz | tar xz
cd interactive-project-tool-4.2.0

# Install globally
npm install -g .
```

### Method 3: Development Setup

```bash
# Clone for development
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool

# Run directly (no global install)
node index.js

# Or make executable and run
chmod +x index.js
./index.js
```

### Requirements

- **Node.js**: 14.0.0 or higher
- **NPM**: Included with Node.js
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+, CentOS 7+)

---

## 📖 Usage

### Basic Commands

```bash
# Interactive mode (default)
project-tool

# Show help
project-tool --help
project-tool -h

# Show version
project-tool --version
project-tool -v

# Setup or update API keys
project-tool --setup

# Quick translation commands
project-tool --sync    # Sync all translation files
project-tool --check   # Check translation consistency
```

### First Run

On first run, Project Tool will guide you through:

1. **Welcome Screen**: Introduction to the tool
2. **API Key Setup**: Optional setup of translation APIs
3. **Default Preferences**: Choose default translation API
4. **Settings Confirmation**: Review and confirm initial settings

You can skip any step and configure later through the Settings menu.

---

## 🎮 Interactive Menus

### Main Menu

```
🚀 What would you like to do today?
  ▶ 1. 📤 Export Project to File
    2. 📥 Import Project from File
    3. 🌳 Create Structure from Tree Diagram
    4. 🗑️  Manage Export Files
    5. 🌐 Manage Translations (Advanced)
    6. ⚙️  Settings
    7. ❌ Exit
```

### Navigation Controls

| Key | Action |
|-----|--------|
| ↑ ↓ | Navigate menu items |
| 1-9 | Quick select by number |
| Enter | Confirm selection |
| Space | Toggle selection (in multi-select menus) |
| A | Select/deselect all (in multi-select menus) |
| Ctrl+C | Exit application |

---

## 📤 Export/Import Workflow

### Export Process

1. **Select Directory**: Navigate and choose project folder to export
2. **Gitignore Option**: Choose whether to use .gitignore patterns
3. **Processing**: Tool scans and processes all relevant files
4. **Output**: Generates timestamped export file (e.g., `export_20250804_1425.txt`)

#### Included File Types:
- **Code**: `.js`, `.jsx`, `.ts`, `.tsx`, `.vue`, `.py`, `.php`
- **Styles**: `.css`, `.scss`, `.sass`, `.less`
- **Markup**: `.html`, `.xml`, `.svg`
- **Config**: `.json`, `.yml`, `.yaml`, `.toml`
- **Documentation**: `.md`, `.txt`, `.rst`
- **Environment**: `.env`, `.env.example`

#### Automatically Excluded:
- `node_modules/`, `.git/`, `dist/`, `build/`, `.next/`
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Binary files (images, videos, executables)
- IDE specific files (`.vscode/`, `.idea/`)

### Import Process

1. **File Selection**: Choose export file from filtered list
2. **Destination Choice**: 
   - Use current directory
   - Create new folder (with custom name)
   - Browse and select existing directory
3. **Confirmation**: Review import settings
4. **Processing**: Extract and recreate project structure

---

## 🌳 Tree Structure Creation

Create complex folder structures from simple text diagrams:

### Input Example:
```
my-fullstack-app
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── user.controller.js
│   │   ├── models/
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   └── api.routes.js
│   │   └── app.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   └── App.jsx
│   └── package.json
├── shared/
│   └── types.ts
└── README.md
DONE
```

### Features:
- **Smart Parsing**: Handles various tree drawing characters
- **File Detection**: Automatically detects files vs directories
- **Workspace Creation**: Option to create parent workspace folder
- **Destination Options**: Multiple ways to choose where to create structure
- **Preview**: Shows what will be created before confirmation

---

## 🌐 Translation Management

### Supported Translation Patterns

The tool automatically detects various translation patterns in your code:

```javascript
// Direct property access
t.welcomeMessage
t.nav.home
t.buttons.submit

// Bracket notation
t['welcomeMessage']
t["nav.home"]

// With fallback text
t.welcomeMessage || 'Welcome to our app'
{t.nav.home || 'Home'}

// Vue.js style
$t.welcomeMessage
$t('nav.home')

// Function calls
translation('welcomeMessage')
translate('nav.home')
```

### Translation Structure Creation

For projects without existing translation setup:

1. **Language Selection**: Choose from 14 supported languages
2. **Location Choice**: Select where to create translation files
3. **Structure Generation**: Creates complete i18n setup
4. **Auto-Population**: Finds existing translation usage and adds keys

#### Generated Structure:
```
translations/
├── index.ts          # Main export file
├── types.ts          # TypeScript definitions
└── languages/
    ├── en.ts         # English (base language)
    ├── ar.ts         # Arabic
    ├── es.ts         # Spanish
    ├── fr.ts         # French
    └── [other languages]
```

### Translation Workflow

#### 1. Project Scanning
```bash
🔍 SCANNING PROJECT
✅ Found 45 unique translation keys
⚠️  Found keys with different fallback texts
📊 Analysis complete
```

#### 2. Synchronization Options
- **Full Sync**: Complete synchronization (recommended)
- **Add Missing**: Only add missing translations
- **Remove Unused**: Clean up unused keys
- **Generate Report**: Create detailed analysis

#### 3. API Translation
- **OpenAI GPT-3.5**: High-quality context-aware translations
- **Google Translate**: Professional translation service
- **MyMemory**: Free service with rate limits

### Conflict Resolution

When the same translation key has different fallback texts:

```javascript
// In ComponentA.jsx
{t.submitButton || 'Submit'}

// In ComponentB.jsx  
{t.submitButton || 'Send'}
```

The tool will:
1. **Detect Conflicts**: Find all variations
2. **Smart Grouping**: Group similar texts (ignoring quote differences)
3. **Interactive Resolution**: Let you choose the correct text
4. **Update All Files**: Apply the chosen text consistently

---

## ⚙️ Settings & Configuration

### Settings Menu Structure

```
⚙️  SETTINGS
  ▶ 1. 🌐 Translation API Settings
    2. 🔑 API Keys Management  
    3. 📖 Report Opening Settings
    4. 🔄 Reset to Defaults
    5. ↩️  Back to Main Menu
```

### Translation API Settings

Configure your preferred translation service:

- **Auto (Recommended)**: Automatically choose best available API
- **OpenAI GPT-3.5**: High-quality translations with context awareness
- **Google Translate**: Professional translation service (coming soon)
- **MyMemory (Free)**: Free service with rate limits

### API Keys Management

Secure storage and management of API credentials:

```bash
🔑 API KEY SETUP
Configuration will be saved to: /path/to/installation/.env

# OpenAI API Key (recommended for best quality)
Get your key from: https://platform.openai.com/api-keys
Enter your OpenAI API key (or press Enter to skip): 

# Google Translate API Key (optional)
Get your key from: https://console.cloud.google.com/apis/credentials
Enter your Google Translate API key (or press Enter to skip):
```

### Report Opening Settings

Control how generated reports are opened:

- **Auto-open**: Automatically open reports after generation
- **IDE Preference**: Choose preferred code editor
- **Smart Detection**: Detect and prioritize currently running IDEs

#### Supported IDEs/Editors:
- **Visual Studio Code** (code)
- **Sublime Text** (subl)
- **Atom** (atom)
- **WebStorm/PhpStorm/IntelliJ** (webstorm/phpstorm/intellij)
- **Notepad++** (Windows)
- **TextEdit/nano/vim** (System defaults)

### IDE Priority System

The tool uses intelligent IDE detection with priority:

1. **Currently Running IDEs**: Highest priority to already open editors
2. **User Preference**: Your configured preferred editor
3. **Common IDEs**: Platform-specific common editors
4. **System Default**: Fallback to system default text editor

Example workflow:
```bash
🔍 Detecting running IDEs...
📍 Found running IDE(s): code, subl
📖 Opening file with code (currently running)
```

---

## 🤖 Using with Claude AI

### Perfect Integration Workflow

1. **Export Your Project**:
```bash
project-tool
> Export Project
> Select your project directory
> Choose gitignore usage
# Generates: export_20250804_1425.txt
```

2. **Share with Claude AI**:
Upload the export file and use this optimized prompt:

```text
You are a code-export assistant that produces a single text file summarizing project structure and code contents. 

Output requirements:
1. For each included file (extensions: .js, .jsx, .ts, .tsx, .css, .scss, .html, .json, .md, .config.js, .babelrc, and dotfiles), insert:
   // File: relative/path/to/file
   (then the entire content of that file)

2. After listing all files, insert:
   // === Folder Tree ===
   Then a tree diagram using ASCII markers

3. Excluded: node_modules, .git, dist, build, .next, .vscode, .gitignore, package-lock.json

4. Output must be plain text in one file, no additional commentary.

Please analyze and suggest improvements for this codebase.
```

3. **Import Claude's Response**:
```bash
project-tool
> Import Project
> Select Claude's response file
> Choose destination (create new folder recommended)
> Confirm import
```

### Export File Format

The export format is specifically designed for AI understanding:

```text
// === PROJECT EXPORT ===
// Exported at: 2025-08-04 14:25:30 (Tehran +03:30)
// Source directory: /path/to/project
// Using .gitignore: true
// ==================

// File: src/components/Header.jsx
import React from 'react';

export const Header = () => {
  return (
    <header>
      <h1>My App</h1>
    </header>
  );
};

// File: src/App.jsx
[content...]

// === Folder Tree ===
my-app
├── src/
│   ├── components/
│   │   └── Header.jsx
│   └── App.jsx
└── package.json
```

---

## 📊 Examples & Use Cases

### 1. Code Review Preparation

```bash
# Export specific feature branch
project-tool
> Export Project
> Select feature directory
> Use gitignore patterns
# Share export_[timestamp].txt with reviewers
```

### 2. AI-Assisted Refactoring

```bash
# Export current state
project-tool  # Export → Share with AI → Get suggestions

# Import refactored version
project-tool  # Import → Create new folder → Compare changes
```

### 3. Project Template Creation

```bash
# Create template structure
project-tool
> Create Structure from Tree
> Paste your template structure
> Create in templates/ folder
```

### 4. Translation Management

```bash
# Initial setup for new project
project-tool
> Manage Translations
> Create Translation Structure
> Select languages: English, Arabic, French
> Choose location: src/i18n

# Regular maintenance
project-tool --sync  # Quick sync all translations
```

### 5. Team Collaboration

```bash
# Team member A: Export current work
project-tool > Export Project

# Team member B: Import and continue
project-tool > Import Project > Create workspace
```

---

## 🔧 Advanced Configuration

### Environment Variables

The tool uses a dedicated .env file in the installation directory to avoid conflicts:

```bash
# Installation directory: ~/.npm-global/lib/node_modules/project-tool/.env
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_TRANSLATE_API_KEY=your-google-key-here
```

### Settings File

User preferences are stored in `settings.json`:

```json
{
  "defaultTranslationApi": "auto",
  "autoOpenReports": true,
  "firstRun": false,
  "preferredIde": "code"
}
```

### Custom File Types

To include additional file types in exports, you can modify the `INCLUDE_EXTENSIONS` in the source:

```javascript
const INCLUDE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.rb', '.go', '.rs',  // Add more languages
  '.vue', '.svelte',           // Add framework files
  '.css', '.scss', '.less'
];
```

---

## 🐛 Troubleshooting

### Common Issues

#### Installation Problems

**"Command not found" after global install**
```bash
# Check npm global path
npm config get prefix

# Add to PATH (Linux/macOS)
export PATH="$PATH:$(npm config get prefix)/bin"

# Add to PATH (Windows)
# Add %APPDATA%\npm to your PATH environment variable
```

**Permission errors on Linux/macOS**
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npx instead
npx project-tool
```

#### Export/Import Issues

**Large projects causing memory issues**
```bash
# Use gitignore filtering
# Exclude large directories manually
# Split into smaller exports if needed
```

**Import failing with "Invalid file format"**
```bash
# Ensure the file was exported by this tool
# Check file encoding (should be UTF-8)
# Verify file wasn't corrupted during transfer
```

#### Translation Issues

**API connection problems**
```bash
# Test API keys
project-tool --setup

# Check internet connection
# Verify API key validity
# Try different translation API
```

**Translation structure not detected**
```bash
# Use manual directory selection
project-tool > Manage Translations > Create New Structure
```

#### IDE/Editor Issues

**Reports not opening automatically**
```bash
# Check IDE is installed and in PATH
# Try different IDE in settings
# Check file permissions
# Use manual file opening as fallback
```

### Debug Mode

For detailed debugging, run with Node.js debug output:

```bash
DEBUG=* project-tool
# or
node --trace-warnings index.js
```

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/AliSaadat-ir/interactive-project-tool/issues)
- **Discussions**: [Ask questions or share ideas](https://github.com/AliSaadat-ir/interactive-project-tool/discussions)
- **Documentation**: Check this README and inline help (`project-tool --help`)

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

```bash
# Fork the repository on GitHub
git clone https://github.com/your-username/interactive-project-tool.git
cd interactive-project-tool

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
node index.js

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Create Pull Request on GitHub
```

### Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Follow existing code patterns
- Test on multiple operating systems

### Areas for Contribution

- **Translation APIs**: Add support for more translation services
- **IDE Integration**: Improve IDE detection and integration
- **File Types**: Support for more programming languages
- **UI/UX**: Enhance the interactive experience
- **Documentation**: Improve guides and examples
- **Testing**: Add automated tests
- **Performance**: Optimize for large projects

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 🆘 Support

### Quick Support

- **Version Check**: `project-tool --version`
- **Help Menu**: `project-tool --help`
- **Settings Reset**: Go to Settings → Reset to Defaults

### Community

- **GitHub Issues**: [Bug reports and feature requests](https://github.com/AliSaadat-ir/interactive-project-tool/issues)
- **GitHub Discussions**: [Questions and community support](https://github.com/AliSaadat-ir/interactive-project-tool/discussions)
- **Repository**: [Source code and documentation](https://github.com/AliSaadat-ir/interactive-project-tool)

### Professional Support

For enterprise use or custom integrations, please contact through GitHub Issues with the "enterprise" label.

---

## 🔄 Changelog

### v4.2.0 (2025-08-04) - Latest
- ✅ **Fixed**: Export workflow hanging after API setup
- ✨ **Added**: Comprehensive settings menu with detailed descriptions
- ✨ **Added**: First-run setup wizard for new users
- ✨ **Added**: Auto-open reports in preferred IDE/editor
- ✨ **Added**: Smart IDE detection prioritizing currently running editors
- 🔧 **Improved**: Enhanced navigation flow throughout application
- 🔧 **Improved**: Better API preference management
- 🔧 **Improved**: Settings persistence across sessions

### v4.1.0 (2025-08-04)
- ✨ **Added**: Translation structure creation for projects without i18n
- ✨ **Added**: Smart fallback grouping ignoring quote differences
- ✨ **Added**: Enhanced time display in export file management
- 🐛 **Fixed**: Quote sensitivity in fallback text comparison
- 🐛 **Fixed**: Translation detection edge cases

### v4.0.0 (2025-08-03)
- 🎉 **Major**: Complete translation management system
- ✨ **Added**: Auto-translation with OpenAI integration
- ✨ **Added**: TypeScript types generation
- ✨ **Added**: Translation usage scanner
- 🔧 **Changed**: Modular architecture
- 🔧 **Changed**: Unified package name to "project-tool"

[View Full Changelog](CHANGELOG.md)

---

<div align="center">

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=AliSaadat-ir/interactive-project-tool&type=Date)](https://star-history.com/#AliSaadat-ir/interactive-project-tool&Date)

**Made with ❤️ for developers collaborating with AI assistants**

[⭐ Star this project](https://github.com/AliSaadat-ir/interactive-project-tool) • [🐛 Report Bug](https://github.com/AliSaadat-ir/interactive-project-tool/issues) • [💡 Request Feature](https://github.com/AliSaadat-ir/interactive-project-tool/issues)

</div>