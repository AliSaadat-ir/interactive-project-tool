# 🚀 Interactive Project Tool v4.1

A powerful, AI-integrated command-line utility that simplifies project sharing, translation management, and folder structure generation. Designed for seamless collaboration with Claude AI, OpenAI, and modern multilingual teams.

---

## 🧹 Overview

**Interactive Project Tool** allows developers to:

* Export entire codebases as a single file
* Import or reconstruct them elsewhere
* Set up or manage multilingual translation files
* Automatically translate and sync keys using AI
* Clean up or inspect export files visually
* Enhance collaboration with AI assistants

---

## 🎯 Key Features

* 📄 **Export Projects**: Package your entire project (code + structure) into one file
* 📅 **Import Projects**: Recreate the original project from exported text files
* 🌳 **Tree Structure Creation**: Paste folder trees to auto-generate file structures
* 🗑️ **Export File Manager**: Visually preview, batch delete, or clean up old export files
* 🌐 **Translation Sync**: Keep multilingual `.ts` files consistent and updated
* 🏗️ **Auto Translation Setup**: Bootstrap i18n files for projects without translation layers
* 🔄 **AI-Powered Translations**: Fill missing translations using OpenAI/Claude
* 📊 **Detailed Translation Reports**: Analyze inconsistencies, gaps, or conflicts
* 🤖 **Claude AI Compatibility**: Export and format projects to feed Claude with perfect context
* 🔑 **API Key Management**: Secure and separate key storage for translation APIs
* ✨ **Intuitive UX**: All operations support arrow key navigation and real-time feedback

---

## ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool

# Install globally
npm install -g .

# Run the tool
project-tool
```

---

## 🚦 First Run Setup

On first launch, you’ll be guided through API setup:

* 🧀 **OpenAI Key** (recommended)
* 🌍 **Google Translate API** (optional fallback)
* 🚫 **Skip**: Use limited built-in translation

Your keys are stored safely in the tool’s **installation directory** (`.env`), never inside your project.

---

## 🧪 Basic Commands

```bash
# Launch tool interactively
project-tool

# CLI commands
project-tool --help         # Show help
project-tool --version      # Show version
project-tool --setup        # Setup API keys
project-tool --sync         # Sync translation files
project-tool --check        # Check translation consistency
```

---

## 📦 Project Export & Import

### 🔐 Export Your Project

```bash
project-tool
> Export Project
> Select directory
> Use .gitignore (optional)
📅 export_20250803_2145.txt created
```

### 📅 Import from Export File

```bash
project-tool
> Import Project
> Choose export file
> Choose destination
📅 Project reconstructed
```

---

## 🌍 Translation Management

### 🔄 Full Sync

```bash
project-tool
> Manage Translations
> Full Synchronization
```

* Ensures all language files have the same keys
* Fills missing values using AI
* Removes unused or orphaned keys
* Regenerates `types.ts` for safety

### 🏗️ Create Translation Structure (New!)

```bash
project-tool
> Manage Translations
> Create Translation Structure
```

Choose languages like:

```
[✓] English (en)
[✓] Arabic (ar)
[✓] Farsi (fa)
...
```

Generates:

```
translations/
├── languages/
│   ├── en.ts
│   ├── ar.ts
│   └── ...
├── index.ts
└── types.ts
```

---

## 🧠 Working with Claude AI

### Exporting for Claude

1. Run:

```bash
project-tool
> Export Project
```

2. Copy the resulting file to Claude AI and use this prompt:

> You are a code-export assistant that produces a single text file summarizing project structure and code contents... (full prompt included in original README)

3. After Claude generates your edits:

```bash
project-tool
> Import Project
```

---

## 🗑️ Manage Export Files

```bash
project-tool
> Manage Export Files
```

Features:

* Preview size, date, and contents
* Multi-file selection (Space)
* "A" to select all
* Directory browsing
* Safe deletion with confirmation

---

## 🌳 Create from Folder Tree

```bash
project-tool
> Create Structure from Tree
> Paste structure like:
my-app
├️── src/
│   └️── index.ts
└️── package.json
```

You can create inside:

* 📍 Current directory
* 📁 New workspace folder
* 🔍 Selectable custom path

---

## 🧐 Smart Fallback Grouping

* Groups similar fallback text (ignores `'` vs `"`)
* Shows variants in conflict analysis
* Improves AI auto-translation efficiency

---

## 📚 Translation Coverage

### Detected Patterns:

* `t.key`
* `t['key']`
* `$t.key`
* `{t.key || 'Fallback'}`
* `translation('key')`

### Supported Languages (v4.1+)

| Code | Language      | Code | Language |
| ---- | ------------- | ---- | -------- |
| en   | English       | fr   | French   |
| ar   | Arabic        | de   | German   |
| fa   | Persian/Farsi | ru   | Russian  |
| hi   | Hindi         | ja   | Japanese |
| zh   | Chinese       | ur   | Urdu     |
| es   | Spanish       | it   | Italian  |
| pt   | Portuguese    | ko   | Korean   |

---

## ⚙️ Configuration & Structure

* Stores API keys in:

  ```
  <installation-path>/.env
  ```

* Included file types:

  * Code: `.js`, `.ts`, `.jsx`, `.tsx`
  * Style: `.css`, `.scss`, `.sass`, `.less`
  * Config: `.json`, `.yaml`, `.yml`
  * Docs: `.md`, `.txt`
  * Dotfiles: `.env`, `.babelrc`, `.eslintrc`

* Exclusions:

  * `node_modules/`, `.git/`, `.vscode/`
  * `dist/`, `.next/`, `build/`
  * Binary or lock files

---

## 🧪 Example Workflows

### ➔ Full Export & AI Feedback Cycle

```bash
project-tool
> Export Project

# Copy to Claude or OpenAI
# Get feedback file

project-tool
> Import Project
```

### 🌐 Set Up Translations from Scratch

```bash
project-tool
> Manage Translations
> Create Translation Structure
```

Then:

```bash
project-tool --sync
```

---

## 🧰 Troubleshooting

| Problem                  | Solution                            |
| ------------------------ | ----------------------------------- |
| `command not found`      | Run `npm install -g .` or use `npx` |
| API key not working      | Run `project-tool --setup`          |
| Missing module on import | Reinstall: `npm install -g .`       |
| Large export file        | Use `.gitignore` and export filter  |

---

## 🡩‍💼 Contributing

Pull requests are welcome. For major changes, please open an issue first.

```bash
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool
npm install
node index.js
```

---

## 📜 License

Licensed under the MIT License.
See [LICENSE](LICENSE) for full details.

---

## 📣 Stay Connected

* 🥾 [Issues](https://github.com/AliSaadat-ir/interactive-project-tool/issues)
* 💬 [Discussions](https://github.com/AliSaadat-ir/interactive-project-tool/discussions)
* 🌐 [GitHub Repository](https://github.com/AliSaadat-ir/interactive-project-tool)

---

Made with ❤️ for developers who use AI to build smarter, faster, and better.
