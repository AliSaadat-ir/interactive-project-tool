# Release Guide for v4.1

## Pre-release Checklist
- [x] Update README.md with new features
- [x] Update CHANGELOG.md with all changes
- [x] Update VERSION file to 4.1.0
- [x] Test all new features
- [x] Fix all reported bugs

## Git Commands for Release

```bash
# 1. Ensure you're on the main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Add all changes
git add .

# 4. Commit with release message
git commit -m "Release v4.1.0: Translation structure creation and smart fallback grouping

- Add translation structure creation for projects without i18n
- Implement smart fallback grouping (ignores quote differences)
- Add time display in multi-select file deletion
- Fix quote sensitivity in fallback comparison
- Improve translation pattern detection
- Support 14 languages for new translation setups"

# 5. Create annotated tag
git tag -a v4.1.0 -m "Version 4.1.0

Major Features:
- Translation structure creation for new projects
- Smart fallback text grouping
- Enhanced time display in file management

Improvements:
- Better quote handling in translations
- Consistent date/time formatting
- Improved conflict resolution UI

Bug Fixes:
- Fixed quote comparison in fallback texts
- Fixed missing time in batch deletion
- Fixed edge cases in translation detection"

# 6. Push to GitHub
git push origin main
git push origin v4.1.0

# 7. Create GitHub Release
# Go to: https://github.com/AliSaadat-ir/interactive-project-tool/releases/new
# - Choose tag: v4.1.0
# - Release title: v4.1.0 - Translation Setup & Smart Fallback Detection
# - Copy changelog content for description
# - Attach any binaries if needed
# - Publish release

# 8. Update npm package (if published)
npm version 4.1.0
npm publish
```

## Post-release Tasks
- [ ] Verify GitHub release is visible
- [ ] Test installation from GitHub
- [ ] Update any documentation sites
- [ ] Announce release on social media/forums
- [ ] Monitor issues for any problems

## GitHub Release Description Template

```markdown
## Interactive Project Tool v4.1.0

### 🎯 Major Features

#### 🏗️ Translation Structure Creation
- **Auto-setup for new projects**: Create complete i18n infrastructure
- **14 language support**: Choose from English, Arabic, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Persian, and Urdu
- **Smart detection**: Automatically finds existing translation usage
- **Complete setup**: Creates index.ts, types.ts, and language files

#### 🧠 Smart Fallback Grouping
- **Quote-agnostic**: Groups `"Just Browsing"` with `'Just browsing'`
- **Case-sensitive**: Maintains accuracy for different text cases
- **Better UX**: Shows all quote variations in conflict resolution
- **Proper parsing**: Handles escaped characters correctly

#### ⏰ Enhanced Time Display
- **Full timestamps**: Shows complete date and time in file listings
- **Consistent format**: Unified time display across all features
- **Better organization**: Easier to identify and manage export files

### 🔧 Improvements
- Enhanced translation pattern detection
- Better handling of projects without translation setup
- Improved terminal clearing for smoother navigation
- More accurate quote parsing with escape character support

### 🐛 Bug Fixes
- Fixed quote sensitivity in fallback text comparison
- Fixed missing time display in batch file deletion
- Fixed translation detection edge cases
- Fixed terminal clearing issues during menu navigation

### 📋 Installation

```bash
# Clone the repository
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool

# Install globally
npm install -g .

# Run the tool
project-tool
```

### 🆕 What's New

**For New Translation Projects:**
```bash
project-tool
> Manage Translations
> Create Translation Structure
> Select languages with Space key
> Choose directory location
```

**For Better File Management:**
- Time stamps now show in multi-select deletion
- Consistent date/time format across all views
- Better conflict resolution with quote grouping

### 📚 Documentation
- [README.md](README.md) - Complete usage guide
- [CHANGELOG.md](CHANGELOG.md) - All changes
- [Quick Start Guide](quick-start-guide.md) - Get started quickly

### 🤝 Contributing
We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### 🆘 Support
- **Issues**: [Report bugs or request features](https://github.com/AliSaadat-ir/interactive-project-tool/issues)
- **Discussions**: [Ask questions or share ideas](https://github.com/AliSaadat-ir/interactive-project-tool/discussions)
```

## Verification Steps

After pushing the release:

1. **Verify tag exists**:
```bash
git tag -l | grep v4.1.0
```

2. **Check GitHub release page**:
Visit: https://github.com/AliSaadat-ir/interactive-project-tool/releases

3. **Test installation**:
```bash
git clone https://github.com/AliSaadat-ir/interactive-project-tool.git
cd interactive-project-tool
npm install -g .
project-tool --version  # Should show 4.1.0
```

4. **Test new features**:
- Try translation structure creation
- Test multi-select file deletion with time display
- Test fallback conflict resolution

## Rollback Commands (if needed)

If there are issues with the release:

```bash
# Delete the tag locally and remotely
git tag -d v4.1.0
git push origin :refs/tags/v4.1.0

# Revert the commit if needed
git revert HEAD

# Push the revert
git push origin main
```