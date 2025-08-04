# Interactive Project Tool v4.3

<div align="center">

![Version](https://img.shields.io/badge/version-4.3.0-blue.svg)
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
- **Smart Filtering**: Automatic exclusion of unnecessary files with customizable patterns
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
- **Smart Detection**: Auto-detect translation usage including optional chaining (t?.key)
- **AI-Powered Translation**: Integration with OpenAI GPT-3.5 and Google Translate
- **Advanced Conflict Resolution**: 
  - Smart grouping of similar texts regardless of quotes
  - Key renaming for different variations
  - Save/discard options during conflict resolution
  - Progress tracking with exit capabilities
- **Synchronization**: Keep all language files perfectly in sync
- **TypeScript Support**: Auto-generate and update TypeScript type definitions
- **Detailed Reports**: Generate comprehensive analysis in multiple formats (Markdown, HTML, JSON, CSV)

### ⚙️ **Extended Settings & Customization**
- **Comprehensive Settings Menu**: Organized into categories for easy navigation
  - Translation Settings: API preferences, report formats, auto-backup
  - File & Folder Settings: IDE preferences, file manager options, open behavior
  - Export/Import Settings: Custom paths, prefixes, exclusion patterns
  - Display Settings: Verbosity and logging preferences
- **IDE Integration**: 
  - Smart detection of running IDEs with priority-based file opening
  - Support for Trae editor and custom commands
  - Choose between opening files or containing folders
- **File Manager Options**: Configure preferred file managers for folder browsing
- **Export Customization**: 
  - Custom export paths and file prefixes
  - Maximum file limits with auto-cleanup
  - Custom exclusion patterns
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
curl -L https://github.com/AliSaadat-ir/interactive-project-tool/archive/v4.3.0.tar.gz | tar xz
cd interactive-project-tool-4.3.0

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
| Ctrl+C | Exit application (with save options in conflicts) |

---

## 📤 Export/Import Workflow

### Export Process

1. **Select Directory**: Navigate and choose project folder to export
2. **Gitignore Option**: Choose whether to use .gitignore patterns
3. **Processing**: Tool scans and processes all relevant files
4. **Output**: Generates timestamped export file with custom prefix

#### Export Settings:
- **Custom Export Path**: Define default export location
- **File Prefix**: Customize export file naming (default: "export")
- **Exclusion Patterns**: Add custom patterns to exclude files/folders
- **Auto-cleanup**: Set maximum number of export files to keep

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
- **Folder Opening**: Option to open created folder with preferred file manager

---

## 🌐 Translation Management

### Enhanced Translation Patterns

The tool now detects even more translation patterns:

```javascript
// Standard patterns
t.welcomeMessage
t['welcomeMessage']
t["nav.home"]

// Optional chaining (NEW)
t?.welcomeMessage
t?.['userProfile']
t?.nav?.home

// With fallback text
t.welcomeMessage || 'Welcome to our app'
{t?.loadingMessage || 'Loading...'}

// Vue.js style
$t.welcomeMessage
$t('nav.home')

// Function calls
translation('welcomeMessage')
translate('nav.home')
```

### Advanced Conflict Resolution

When translation keys have different fallback texts:

1. **Conflict Detection**: Automatically identifies keys with multiple variations
2. **Smart Display**: Shows conflict count before resolution
3. **Resolution Options**:
   - Select preferred text for all occurrences
   - **Change keys for different texts** (NEW)
   - Enter custom text
   - Skip specific conflicts
4. **Key Renaming**: 
   - Select which text variations need different keys
   - Choose from auto-generated suggestions (key1, key2, keyAlt, etc.)
   - Enter custom key names
5. **Save/Exit Options**: 
   - Save changes and exit anytime with Ctrl+C
   - Discard changes and exit
   - Continue resolving conflicts

### Translation Reports

Generate comprehensive reports in multiple formats:

- **Markdown**: Human-readable report with recommendations
- **HTML**: Interactive web report with charts and progress bars
- **JSON**: Machine-readable data for integration
- **CSV**: Data export for analysis in spreadsheets

#### Report Features:
- Health score (0-100) based on translation completeness
- Executive summary with key metrics
- Language-specific quality ratings
- Usage statistics for most/least used keys
- Prioritized recommendations
- Visual progress charts
- Quick action commands

---

## ⚙️ Extended Settings

### Settings Categories

#### 🌐 Translation Settings
- **Default Translation API**: Auto, OpenAI, Google, or MyMemory
- **Report Format**: Choose between Markdown, JSON, or both
- **Auto-backup**: Enable automatic backup before sync operations

#### 📂 File & Folder Settings
- **Auto-open Reports**: Automatically open generated reports
- **Open Folder Instead**: Open containing folder instead of file
- **Preferred IDE**: Set default editor (supports Trae and custom commands)
- **Preferred File Manager**: Configure folder browser
- **Show Hidden Files**: Toggle hidden file visibility

#### 📤 Export/Import Settings
- **Export File Prefix**: Customize export file naming
- **Custom Export Path**: Set default export location
- **Max Export Files**: Limit number of kept export files
- **Confirm Before Delete**: Toggle deletion confirmations
- **Exclude Patterns**: Add custom exclusion patterns

#### 🎨 Display Settings
- **Show Detailed Logs**: Enable verbose output during operations

### IDE Detection & Priority

The tool uses intelligent IDE detection:

1. **Currently Running IDEs**: Highest priority (auto-detected)
2. **User Preference**: Your configured preferred editor
3. **Common IDEs**: Platform-specific common editors
4. **System Default**: Fallback to system default editor

Supported IDEs:
- Visual Studio Code
- Sublime Text
- Atom
- WebStorm/PhpStorm/IntelliJ
- **Trae** (NEW)
- Notepad++ (Windows)
- Custom commands

---

## 🤖 Using with Claude AI

### Perfect Integration Workflow

1. **Export Your Project**:
```bash
project-tool
> Export Project
> Select your project directory
> Choose gitignore usage
# Generates: export_20250804_1425.txt (or custom prefix)
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

---

## 📊 Examples & Use Cases

### 1. Translation Management with Conflicts

```bash
# Scan project and resolve conflicts
project-tool
> Manage Translations
> Scan Project
# Shows: "Found 5 keys with conflicts"
> Resolve conflicts
# For each conflict:
# - Choose preferred text
# - OR change keys for variations
# - OR enter custom text
```

### 2. Custom Export Configuration

```bash
# Configure export settings
project-tool
> Settings
> Export/Import Settings
> Export file prefix: "backup"
> Custom export path: "/backups/projects"
> Max export files: 30
# Now exports will use: backup_20250804_1425.txt
```

### 3. Report Generation & Analysis

```bash
# Generate comprehensive reports
project-tool
> Manage Translations
> Generate Report
# Creates:
# - translation-report.md (human-readable)
# - translation-report.html (interactive)
# - translation-report.json (data)
# - translation-report.csv (analysis)
```

### 4. IDE Integration

```bash
# Configure IDE preferences
project-tool
> Settings
> File & Folder Settings
> Preferred IDE: trae
> Open folder instead of file: Enabled
# Now reports open in Trae, showing folder view
```

---

## 🔧 Advanced Configuration

### Environment Variables

The tool uses a dedicated .env file in the installation directory:

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
  "openFolderInsteadOfFile": false,
  "preferredIde": "trae",
  "preferredFileManager": "explorer",
  "showHiddenFiles": false,
  "excludePatterns": ["*.log", "temp/"],
  "customExportPath": "/backups",
  "exportFilePrefix": "project-backup",
  "maxExportFiles": 50,
  "confirmBeforeDelete": true,
  "translationReportFormat": "both",
  "autoBackupBeforeSync": true,
  "showDetailedLogs": false,
  "firstRun": false
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Translation Conflicts Not Saving

**Problem**: Changes made during conflict resolution are lost
**Solution**: Use Ctrl+C during resolution and select "Save changes and exit"

#### IDE Not Detected

**Problem**: Trae or custom IDE not opening files
**Solution**: 
```bash
# Add to PATH or use full path
project-tool > Settings > File & Folder Settings
> Preferred IDE: /usr/local/bin/trae
```

#### Export Files Accumulating

**Problem**: Too many export files in directory
**Solution**: Set max export files limit in settings or use cleanup feature

#### Reports Not Opening

**Problem**: Generated reports don't open automatically
**Solution**: Enable auto-open in settings or check IDE configuration

### Debug Mode

For detailed debugging:

```bash
# Enable detailed logs in settings
project-tool > Settings > Display Settings
> Show detailed logs: Enabled

# Or run with Node.js debug
DEBUG=* project-tool
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Setup

```bash
# Fork and clone
git clone https://github.com/your-username/interactive-project-tool.git
cd interactive-project-tool

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
node index.js

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

### Areas for Contribution

- **Translation APIs**: Add support for more translation services
- **IDE Integration**: Add support for more editors
- **Conflict Resolution**: Enhance key renaming algorithms
- **Report Formats**: Add more visualization options
- **File Types**: Support for more programming languages
- **Testing**: Add comprehensive test suite

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Quick Support

- **Version Check**: `project-tool --version`
- **Help Menu**: `project-tool --help`
- **Settings Reset**: Settings → Reset to Defaults

### Community

- **GitHub Issues**: [Bug reports and feature requests](https://github.com/AliSaadat-ir/interactive-project-tool/issues)
- **GitHub Discussions**: [Questions and community support](https://github.com/AliSaadat-ir/interactive-project-tool/discussions)
- **Repository**: [Source code and documentation](https://github.com/AliSaadat-ir/interactive-project-tool)

---

## 🔄 Changelog Highlights

### v4.3.0 (Latest)
- ✨ **Enhanced Conflict Resolution**: Key renaming, save/exit options, progress tracking
- ✨ **Extended Settings**: Comprehensive categorized settings menu
- ✨ **IDE Support**: Added Trae editor, folder opening options
- ✨ **Export Customization**: Custom paths, prefixes, auto-cleanup
- ✨ **Advanced Reports**: HTML and CSV formats with health scores
- 🐛 **Fixed**: Exit confirmation now properly returns to menu
- 🔧 **Improved**: Better optional chaining detection (t?.key)

[View Full Changelog](CHANGELOG.md)

---

<div align="center">

**Made with ❤️ for developers collaborating with AI assistants**

[⭐ Star this project](https://github.com/AliSaadat-ir/interactive-project-tool) • [🐛 Report Bug](https://github.com/AliSaadat-ir/interactive-project-tool/issues) • [💡 Request Feature](https://github.com/AliSaadat-ir/interactive-project-tool/issues)

</div>