# Interactive Project Export/Import Tool

A powerful command-line tool designed to export and import JavaScript projects for seamless collaboration with AI assistants, particularly Claude AI Opus 4.

## 🎯 Why Use This Tool?

If you're working with **Claude AI Opus 4** (which isn't yet available through API in most AI-powered editors like Cursor, Trace, Lovable, or Bolt), this tool allows you to:
- Export your entire project into a single file
- Share it with Claude AI in the chat interface
- Get AI assistance on your complete codebase
- Import Claude's suggestions back into your project structure
- **NEW**: Create project structures from tree diagrams

## 🚀 Supported JavaScript Frameworks

This tool works perfectly with all major JavaScript frameworks and libraries:

- **React** / Next.js / Gatsby
- **Vue.js** / Nuxt.js
- **Angular**
- **Svelte** / SvelteKit
- **Solid.js**
- **Preact**
- **Alpine.js**
- **Lit**
- **Ember.js**
- **Backbone.js**
- **Express.js** / Fastify / Koa
- **NestJS**
- **Electron**
- **React Native** / Expo
- **Ionic**
- **Node.js** applications
- **TypeScript** projects
- **Vanilla JavaScript** projects

## ✨ Features

- 🎯 Interactive menu with arrow key navigation
- 📤 Export entire projects to a single text file
- 📥 Import projects with advanced directory selection
- 🌳 **NEW**: Create folder/file structure from tree diagrams
- 📁 Visual file/directory browser for both export and import
- 🎨 Colorful terminal interface
- 📋 Optional .gitignore support during export
- 🆕 Create new folders during import
- 🔍 Smart filtering for export files during import
- 🚀 No external dependencies (uses only Node.js built-ins)
- 💻 Full PowerShell compatibility

## 📦 Installation

### Quick Install (Recommended)
```bash
# Clone the repository
git clone https://github.com/AliSaadat/interactive-project-tool.git
cd interactive-project-tool

# Make executable and run setup
chmod +x setup.sh
./setup.sh
```

### Manual Installation
```bash
# Make the script executable
chmod +x project-tool.js

# Run directly
./project-tool.js
# or
node project-tool.js

# Optional: Install globally
npm install -g .
project-tool
```

## 🎮 Usage

### Basic Usage
```bash
project-tool
# or
./project-tool.js
```

### Export Process
1. Select **"Export Project"**
2. Navigate to your project directory
3. Choose whether to use .gitignore patterns
4. Get your `export_[timestamp].txt` file

### Import Process
1. Select **"Import Project"**
2. Choose your export file (only shows .txt files with "export" in name)
3. Select or create destination directory
4. Confirm and import

### Create Structure from Tree (NEW!)
1. Select **"Create Structure from Tree"**
2. Paste your tree structure
3. Type `DONE` on a new line
4. Choose destination directory
5. Confirm creation

#### Example Tree Input:
```
my-project
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── utils/
│   │   └── helpers.js
│   └── index.js
├── public/
│   └── index.html
├── package.json
└── README.md
DONE
```

This will create all folders and empty files ready for your content!

## 🤖 Using with Claude AI

### 1. Export Your Project
```bash
project-tool
# Select "Export Project"
# Navigate to your project folder
# The tool creates: export_1234567890.txt
```

### 2. Copy this Prompt for Claude AI

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

### 3. In Claude AI Chat:
1. Upload your `export_[timestamp].txt` file
2. Paste the prompt above
3. Ask Claude to help with your code
4. Copy Claude's response to a new file

### 4. Import Claude's Changes
```bash
project-tool
# Select "Import Project"
# Select the file from Claude
# Choose where to import
```

## 🎯 Perfect Use Cases

- **Code Reviews**: Export your project for AI-powered code review
- **Refactoring**: Get AI suggestions for improving your codebase
- **Bug Fixing**: Share your entire project context for better debugging help
- **Learning**: Ask Claude to explain complex parts of your codebase
- **Documentation**: Generate documentation for your entire project
- **Migration**: Get help migrating between frameworks or versions
- **Scaffolding**: Quickly create project structures from examples

## ⚙️ Configuration

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

### Using .gitignore
When exporting, if a `.gitignore` file exists, you'll be asked whether to use its patterns for filtering. This ensures sensitive files aren't included.

### Custom Directory Names
During import, you can:
- Create new directories with custom names
- Use existing directories
- Browse to any location on your system

### Tree Structure Creation
Perfect for:
- Setting up project templates
- Recreating structures from documentation
- Quick prototyping
- Teaching/learning project organization

## 📊 Example Workflow

```bash
# 1. Export your React project
$ project-tool
> Export Project
> Select: my-react-app/
> Use .gitignore: Yes
✅ Exported 156 files (2.4MB) to export_1705410000000.txt

# 2. Share with Claude AI
# Upload file + paste the prompt + ask your questions

# 3. Import Claude's response
$ project-tool  
> Import Project
> Select: claude_response.txt
> Create new folder: my-react-app-updated
✅ Imported 156 files to my-react-app-updated/

# 4. Create a new project structure
$ project-tool
> Create Structure from Tree
> [Paste tree and type DONE]
✅ Created 12 folders and 24 files
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this tool in your projects!

## 🔧 Troubleshooting

### Common Issues

**"Permission denied" error**
```bash
chmod +x project-tool.js
```

**"Command not found" after global install**
```bash
# Check npm bin directory
npm bin -g
# Add to PATH if needed
```

**PowerShell input issues**
- Make sure you're using the latest version (v1.3+)
- Type `DONE` on a new line when pasting tree structures
- Use arrow keys for navigation

**Large projects take too long**
- The tool automatically skips `node_modules` and build directories
- Use .gitignore filtering to exclude unnecessary files

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/AliSaadat/interactive-project-tool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AliSaadat/interactive-project-tool/discussions)

## 🆕 What's New in v1.3

- **Create Structure from Tree**: Paste any tree diagram to create folder/file structure
- **Smart Import Filtering**: Only shows relevant export files
- **PowerShell Compatibility**: Full support for Windows PowerShell
- **Better Input Handling**: Improved readline interface for all platforms

---

Made with ❤️ for developers using AI assistants