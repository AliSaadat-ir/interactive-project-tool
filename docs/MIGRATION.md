# Migration Guide

## Upgrading from v1.1 to v1.2

### What's Changed
The import functionality has been completely redesigned to provide a better user experience:

1. **Step-by-Step Process**: Import now has 3 clear steps
2. **Directory Selection**: You can now browse and select exactly where to import
3. **Folder Creation**: Option to create new folders with custom names
4. **Better Feedback**: Clear confirmation screens and error messages

### Breaking Changes
- None! The tool is fully backward compatible

### New Import Workflow

#### Old Workflow (v1.1):
```
1. Select export file
2. Type folder name (or press Enter for "recovered")
3. Import starts
```

#### New Workflow (v1.2):
```
1. Select export file
2. Choose destination:
   - Use current directory
   - Create new folder (with custom name)
   - Browse to another directory
3. Confirm settings
4. Import starts
```

### Benefits of Upgrading
- More control over where files are imported
- Ability to browse directories before importing
- Option to use existing folders
- Better handling of folder name conflicts
- Clearer step-by-step process

## Upgrading from v1.0 to v1.2

If you're upgrading directly from v1.0 to v1.2, you'll get all features from both updates:

### From v1.1:
- **Gitignore Support**: Export can now use .gitignore patterns
- **Windows Terminal Fix**: Better display in Windows terminals

### From v1.2:
- **Enhanced Import**: Complete redesign with directory browsing
- **Folder Creation**: Create custom-named folders during import
- **Better UX**: Step-by-step wizards for both export and import

## How to Upgrade

### Option 1: Replace Script
1. Backup your current version:
   ```bash
   cp project-tool.js project-tool.backup.js
   ```
2. Replace with new version
3. Make executable:
   ```bash
   chmod +x project-tool.js
   ```

### Option 2: Use Update Script
```bash
# Linux/Mac
./update.sh

# Windows
.\update.ps1
```

## Compatibility

- **Export files**: All export files from previous versions work with v1.2
- **Node.js**: Still requires Node.js 12.0.0 or higher
- **Dependencies**: Still zero external dependencies

## Need Help?

If you encounter any issues during upgrade:
1. Check that Node.js is still installed: `node --version`
2. Ensure the script has execute permissions
3. Try running with `node project-tool.js` directly
4. Restore from backup if needed: `cp project-tool.backup.js project-tool.js`