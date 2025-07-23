# Quick Start Guide - Interactive Project Tool

## 🆕 What's New in v1.3

- **Create Structure from Tree**: Paste tree diagrams to create folder/file structures
- **Smart Import Filtering**: Only shows .txt files with "export" in the name
- **PowerShell Compatibility**: Full support for Windows PowerShell terminals
- **Improved Input Handling**: Better support for all terminal types

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
3. **Step 1**: Choose your export file (only shows .txt files with "export" in name)
4. **Step 2**: Choose destination:
   - **Use this directory**: Import to current location
   - **Create new folder**: Enter custom name (default: "recovered")
   - **Browse folders**: Navigate to another directory
5. **Step 3**: Confirm settings and start import
6. Files will be imported to your selected destination

### Example 3: Create Structure from Tree (NEW!)
1. Run: `project-tool`
2. Select **"Create Structure from Tree"**
3. Paste your tree structure:
   ```
   my-app
   ├── src/
   │   ├── components/
   │   │   └── Button.jsx
   │   └── index.js
   └── package.json
   ```
4. Type `DONE` on a new line
5. Choose where to create the structure
6. Confirm creation

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

### PowerShell exits unexpectedly
- Make sure you're using v1.3 or later
- Type `DONE` (not double Enter) when pasting trees

### No export files showing in import
- The tool filters to show only .txt files with "export" in the name
- Navigate to the folder containing your export files

### Tree structure not recognized
- Make sure to type `DONE` on a new line after pasting
- Check that your tree uses the correct characters (├── │ └──)

## 💡 Tips

1. **Backup Strategy**: Use export before major refactoring
2. **Share Code**: Export makes it easy to share via email/chat
3. **Archive Projects**: Export old projects before deleting
4. **Code Reviews**: Export specific folders for review
5. **Quick Scaffolding**: Save common tree structures for reuse

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

### Creating Complex Structures
You can create elaborate project structures:
```
full-stack-app
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── user.controller.js
│   │   ├── models/
│   │   │   └── user.model.js
│   │   └── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
└── README.md
DONE
```

### Custom Output Location
```javascript
// Edit line 280 in project-tool.js
const outputFile = path.join('/custom/path', `export_${Date.now()}.txt`);
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
║   PROJECT EXPORT/IMPORT TOOL v1.3      ║
╚════════════════════════════════════════╝

📤 EXPORT PROJECT

Current: /Users/you/my-react-app
  ▶ 1. 📁 src (45.2KB)
    2. 📁 public (12.3KB)
    3. 📄 package.json (2.1KB)
    4. ⬆️  .. (Parent Directory)

✅ Export successful!
📊 Exported 42 files (1.23MB)
💾 Output saved to: /Users/you/export_1234567890.txt
```

### Import Process:
```
📥 IMPORT PROJECT

Step 1: Select export file to import
(Looking for .txt files with "export" in the name)

Current: /Users/you/projects
  ▶ 1. 📄 export_1234567890.txt (1.2MB)
    2. 📄 export_older.txt (856KB)
    3. 📁 my-app
    4. ⬆️  .. (Parent Directory)
```

### Tree Structure Creation:
```
🌳 CREATE STRUCTURE FROM TREE

Enter the folder tree structure:
(Paste your tree, then type "DONE" on a new line to finish)

[Your tree here]
DONE

✅ Structure created successfully!
📁 Created 8 folders
📄 Created 15 files
📍 Location: /Users/you/projects/my-new-app
```

Happy coding! 🎉