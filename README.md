# Interactive Project Tool v4.1

A powerful command-line tool that combines project export/import capabilities with advanced translation management, designed for seamless collaboration with AI assistants like Claude AI.

## 🎯 Key Features

- 📤 **Export Projects**: Convert your entire project into a single file
- 📥 **Import Projects**: Restore projects with advanced directory selection
- 🌳 **Tree Structure Creation**: Create folder/file structures from tree diagrams
- 🌐 **Translation Management**: Full synchronization of translation files across languages
- 🤖 **AI Integration**: Works perfectly with Claude AI and supports OpenAI API
- 🔄 **Auto-Translation**: Automatically translate missing keys using AI
- 📊 **Translation Reports**: Generate detailed translation analysis
- 🔑 **Built-in API Setup**: Interactive API key configuration
- ✨ **Enhanced UX**: All confirmations use arrow-key selection for better experience

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool

# Install globally
npm install -g .

# Run the tool
project-tool
```

### First Run Setup

On first run, the tool will prompt you to set up API keys for better translation quality:
- **OpenAI API Key**: For high-quality translations
- **Google Translate API Key**: Alternative translation service
- **Skip**: Use free translation service (limited)

## 📖 Usage

### Basic Commands

```bash
# Interactive mode (default)
project-tool

# Show help
project-tool --help

# Show version
project-tool --version

# Setup API keys
project-tool --setup

# Translation commands
project-tool --sync    # Sync all translation files
project-tool --check   # Check translation consistency
```

### Export/Import Workflow

#### 1. Export Your Project
```bash
project-tool
> Export Project
> Navigate to your project folder
> Choose .gitignore usage
# Creates: export_[timestamp].txt
```

#### 2. Import a Project
```bash
project-tool
> Import Project
> Select export file
> Choose destination
> Confirm import
```

### Translation Management

#### Full Synchronization
```bash
project-tool
> Manage Translations
> Full Synchronization
```

This will:
- Scan all components for translation usage
- Sync all language files to have identical keys
- Update TypeScript types automatically
- Translate missing keys using AI
- Remove unused translations

## 🎮 Enhanced User Experience

### Arrow-Key Selection
All confirmations now use intuitive arrow-key selection:
```
Would you like to export this directory?
  ▶ ✓ Yes (default)
    ✗ No
```

### Folder Creation Options
When creating structures from tree diagrams:
- 📍 Current directory
- 🆕 Create in new parent folder
- 📂 Browse and select directory
- ❌ Cancel

### Exit Confirmation
The tool now asks for confirmation before exiting, preventing accidental exits.

## 🤖 Using with Claude AI

### Export Your Project for Claude

1. Export your project:
```bash
project-tool
> Export Project
```

2. Use this prompt with Claude AI:

```text
You are a code-export assistant that produces a single text file summarizing project structure and code contents. 
Output requirements:
1. The file must contain multiple sections:
   - For each included file (extensions: .js, .jsx, .ts, .tsx, .css, .scss, .html, .json, .md, .config.js, .babelrc, and dotfiles), insert:
     // File: relative/path/to/file
     (then the entire content of that file)
   - After listing all files, insert:
     // === Folder Tree ===
     Then a tree diagram using ASCII markers: 
       ├── dir-or-file
       │   └── nested
       └── last
2. Excluded:
   - Directories: node_modules, .git, dist, build, .next, .vscode, and any directory that contains the script
   - Files: .gitignore, package-lock.json
3. Relative paths are from the project root (one level above script location).
4. The folder tree:
   - Use ├── for items except the last, └── for the last, indent nested levels with │    or blanks
5. Output must be plain text in one file, no additional commentary or formatting markers.
6. Do not mention the prompt itself or metadata; only generate the structured output according to rules.
```

3. Upload your export file to Claude AI along with the prompt
4. Get Claude's response and save it as a new file
5. Import Claude's changes back to your project

### Create Structure from Tree

Perfect for quickly setting up project templates:

```bash
project-tool
> Create Structure from Tree
> Paste your tree:
my-app
├── src/
│   ├── components/
│   │   └── Button.jsx
│   └── index.js
└── package.json
DONE
```

When selecting "Create in new parent folder":
- Default name suggested: `[root-folder]_workspace`
- Example: For tree with root "my-app", suggests "my-app_workspace"
- Can be customized or use default by pressing Enter

## 🌐 Translation Features

### Supported Patterns
The tool detects various translation patterns:
- `t.someKey`
- `t['someKey']`
- `{t.someKey || 'Fallback'}`
- `$t.someKey` (Vue style)
- `translation('someKey')`

### Translation Structure
```
lib/translations/
├── types.ts          # TypeScript types
└── languages/
    ├── en.ts        # English
    ├── ar.ts        # Arabic
    ├── es.ts        # Spanish
    └── fr.ts        # French
```

### Auto-Detection
The tool automatically detects common translation structures:
- `lib/translations/languages/`
- `src/translations/languages/`
- `locales/`
- `i18n/`

## ⚙️ Configuration

### Environment Variables
The tool stores API keys in the installation directory to avoid conflicts with project .env files:
```
<installation-dir>/.env
```

### File Types Included
- JavaScript: `.js`, `.jsx`, `.mjs`
- TypeScript: `.ts`, `.tsx`
- Styles: `.css`, `.scss`, `.sass`, `.less`
- Markup: `.html`, `.xml`
- Config: `.json`, `.yml`, `.yaml`
- Documentation: `.md`, `.txt`
- Dotfiles: `.env`, `.babelrc`, `.eslintrc`

### Automatic Exclusions
- `node_modules/`
- `.git/`
- `dist/`, `build/`, `.next/`
- `package-lock.json`, `yarn.lock`
- Binary files

## 🛠️ Advanced Features

### API Key Management
```bash
# Setup API keys interactively
project-tool --setup

# Keys are stored in installation directory
# No conflicts with project .env files
```

### Translation Sync Options
- **Full Sync**: Complete synchronization of all files
- **Add Missing**: Only add missing translations
- **Remove Unused**: Clean up unused keys
- **Generate Report**: Create detailed analysis

### .gitignore Support
When exporting, you can choose to use .gitignore patterns for filtering sensitive files.

## 📊 Example Workflows

### Complete Project Export/Import
```bash
# Export
project-tool
> Export Project
> Select: my-react-app/
> Use .gitignore: ✓ Yes (default)
✅ Exported 156 files (2.4MB)

# Share with AI or team
# Import response
project-tool  
> Import Project
> Select: response.txt
> Create new folder: my-app-updated
✅ Imported 156 files
```

### Translation Management
```bash
# Check status
project-tool --check

# Full sync
project-tool --sync

# Interactive management
project-tool
> Manage Translations
> Full Synchronization
✅ All languages synchronized
```

## 🔧 Troubleshooting

### Common Issues

**"Command not found"**
```bash
npm install -g .
# Or use npx
npx project-tool
```

**API Key Issues**
```bash
project-tool --setup
# Keys are stored in installation directory
```

**Large Projects**
- Use .gitignore filtering
- Exclude unnecessary directories
- Split into smaller exports if needed

**Module Not Found Error**
If you see `Cannot find module './lib/utils/treeParser'`:
- Ensure all files are properly installed
- Reinstall the tool: `npm install -g .`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
```bash
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool
npm install
node index.js
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆕 What's New in v4.1

### Major Improvements
- **Enhanced UX**: All confirmations now use arrow-key selection instead of Y/n prompts
- **Better Tree Creation**: Added folder selection options similar to import feature
- **No More Conflicts**: .env file moved to installation directory
- **Exit Confirmation**: Prevents accidental exits with confirmation dialog
- **Auto-Open Folders**: Option to open created/imported folders automatically
- **First-Run Experience**: Welcome message with option to setup API keys

### Bug Fixes
- Fixed `Cannot find module './lib/utils/treeParser'` error
- Fixed .env conflicts with user projects
- Fixed unclear confirmation prompts
- Fixed missing folder creation options

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/AliSaadat-ir/interactive-project-tool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AliSaadat-ir/interactive-project-tool/discussions)
- **Repository**: [https://github.com/AliSaadat-ir/interactive-project-tool](https://github.com/AliSaadat-ir/interactive-project-tool)

---

Made with ❤️ for developers using AI assistants