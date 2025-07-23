# Quick Start Guide - Interactive Project Tool

## 🆕 What's New in v1.2

- **Enhanced Import Process**: Step-by-step wizard with directory browsing
- **Create New Folders**: Option to create custom-named folders during import
- **Better Navigation**: Browse parent directories and select exact destination
- **Improved UX**: Clear step indicators and better error handling

## 🚀 Installation (3 minutes)

### Windows:
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

### macOS/Linux:
```bash
chmod +x setup.sh
./setup.sh
```

### Manual Installation:
```bash
# Make executable
chmod +x project-tool.js

# Install globally (optional)
npm install -g .
```

## 📖 Usage Examples

### Example 1: Export a React Project
1. Run: `project-tool` or `./project-tool.js`
2. Select **"Export Project"** with arrow keys
3. Navigate to your React project folder
4. Press Enter to confirm
5. If .gitignore exists, choose whether to use it:
   - **Yes**: Respects all .gitignore patterns
   - **No**: Uses only default filters
6. Find your export file: `export_[timestamp].txt`

### Example 2: Import to New Location
1. Run: `project-tool`
2. Select **"Import Project"**
3. **Step 1**: Choose your export file (e.g., `export_1234567890.txt`)
4. **Step 2**: Choose destination:
   - **Use this directory**: Import to current location
   - **Create new folder**: Enter custom name (default: "recovered")
   - **Browse folders**: Navigate to another directory
5. **Step 3**: Confirm settings and start import
6. Files will be imported to your selected destination

## 🎮 Keyboard Controls

| Key | Action |
|-----|--------|
| ↑ ↓ | Navigate menu |
| 1-9 | Quick select |
| Enter | Confirm |
| Ctrl+C | Exit |

## 📁 File Structure

After setup, you'll have:
```
project-tool/
├── project-tool.js      # Main script
├── package.json         # NPM configuration
├── setup.sh            # Linux/Mac installer
├── setup.ps1           # Windows installer
├── README.md           # Documentation
└── .gitignore          # Git ignore rules
```

## 🔧 Common Issues

### "Permission denied" error
```bash
chmod +x project-tool.js
```

### "Command not found" after global install
```bash
# Add to PATH or use npx
npx project-tool
```

### Large projects take too long
- The tool skips `node_modules` and build folders automatically
- For very large projects (>1000 files), export may take 10-30 seconds

## 💡 Tips

1. **Backup Strategy**: Use export before major refactoring
2. **Share Code**: Export makes it easy to share via email/chat
3. **Archive Projects**: Export old projects before deleting
4. **Code Reviews**: Export specific folders for review

## 📊 What Gets Exported?

### ✅ Included:
- JavaScript/TypeScript files (`.js`, `.jsx`, `.ts`, `.tsx`)
- Style files (`.css`, `.scss`, `.sass`, `.less`)
- Markup files (`.html`, `.xml`)
- Config files (`.json`, `.yml`, `.yaml`)
- Documentation (`.md`, `.txt`)
- Environment files (`.env`)

### ❌ Excluded:
- `node_modules/`
- `.git/`
- `dist/`, `build/`, `.next/`
- `.gitignore`
- `package-lock.json`, `yarn.lock`
- Binary files (images, videos, etc.)

## 🛠️ Advanced Usage

### Using .gitignore Support
When exporting a project with a .gitignore file:
```
📋 Found .gitignore file in the selected directory

Would you like to use .gitignore patterns for filtering?
  ▶ 1. Yes, use .gitignore patterns
    2. No, use default filters only
```

Choose "Yes" to respect patterns like:
- `*.log` - Excludes all log files
- `temp/` - Excludes temp directory
- `config/secret.json` - Excludes specific file

### Custom Output Location
```javascript
// Edit line 280 in project-tool.js
const outputFile = path.join('/custom/path', `export_${Date.now()}.txt`);
```

### Add More File Types
```javascript
// Edit line 337 in project-tool.js
const INCLUDE_EXTS = [
  // ... existing extensions
  '.vue', '.svelte', '.astro'  // Add your extensions
];
```

### Change Ignore Patterns
```javascript
// Edit line 342 in project-tool.js
const IGNORE_DIRS = [
  // ... existing directories
  'coverage', 'tmp', '.cache'  // Add more
];
```

## 🆘 Need Help?

1. Check if Node.js is installed: `node --version`
2. Ensure you're in the correct directory
3. Try running with `node project-tool.js` directly
4. Check file permissions on Unix systems

## 📝 Example Output

### Export Process:
```
╔════════════════════════════════════════╗
║   PROJECT EXPORT/IMPORT TOOL v1.2      ║
╚════════════════════════════════════════╝

📤 EXPORT PROJECT

Current: /Users/you/my-react-app
  ▶ 1. 📁 src (45.2KB)
    2. 📁 public (12.3KB)
    3. 📄 package.json (2.1KB)
    4. ⬆️  .. (Parent Directory)

📋 Found .gitignore file in the selected directory

Would you like to use .gitignore patterns for filtering?
  ▶ 1. Yes, use .gitignore patterns
    2. No, use default filters only

✅ Export successful!
📊 Exported 42 files (1.23MB)
💾 Output saved to: /Users/you/export_1234567890.txt
```

### Import Process:
```
╔════════════════════════════════════════╗
║   PROJECT EXPORT/IMPORT TOOL v1.2      ║
╚════════════════════════════════════════╝

📥 IMPORT PROJECT

Step 1: Select export file to import
  ▶ 1. 📄 export_1234567890.txt (1.2MB)
    2. 📄 export_older.txt (856.3KB)

📄 Import from: export_1234567890.txt

Step 2: Choose destination for imported files

Current directory: /Users/you/projects
  ▶ 1. 📁 Use this directory
    2. 🆕 Create new folder here
    3. 📂 Browse folders
    4. ❌ Cancel

Enter name for new folder (default: recovered): my-imported-project

Step 3: Confirm import settings

📄 Source file: export_1234567890.txt
📁 Destination: /Users/you/projects/my-imported-project
🆕 New folder will be created

Start import with these settings?
  ▶ 1. Yes, start import
    2. No, cancel

✅ Import successful!
📊 Imported 42 files (1.23MB)
📁 Files imported to: /Users/you/projects/my-imported-project
```

Happy coding! 🎉