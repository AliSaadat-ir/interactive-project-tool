# Git Push Guide - Fix GitHub Actions

## Quick Fix for GitHub Actions

Your GitHub Actions tests are failing because:
1. Node.js 12.x is End of Life
2. macOS-latest uses Apple Silicon (ARM64) which doesn't support Node.js 14.x
3. Windows PowerShell commands were causing issues

Here's how to fix it:

### 1. Update project-tool.js

The script now supports `--help` and `--version` flags for easier testing.

### 2. Update the test workflow

Replace the content of `.github/workflows/test.yml` with the updated version that:
- Removes Node.js 12.x completely
- Uses `macos-13` (Intel-based) instead of `macos-latest`
- Tests Node.js 14.x only on Linux and Windows
- Uses simple commands that work on all platforms

### 3. Add all new files

```bash
# Add all the new files
git add .github/workflows/test.yml
git add .github/workflows/release.yml
git add .gitignore
git add .npmignore
git add setup.sh
git add setup.ps1
git add GITHUB_ACTIONS_FIX.md
git add GIT_PUSH_GUIDE.md
git add MACOS_COMPATIBILITY.md
git add VERSION

# Update existing files
git add project-tool.js
git add package.json
git add README.md
git add CHANGELOG.md
git add quick-start-guide.md
```

### 4. Commit the changes

```bash
git commit -m "fix: Fix GitHub Actions for all platforms

- Add --help and --version command line options
- Fix Windows PowerShell test commands
- Use macos-13 for Intel-based testing
- Remove Node.js 12.x support (EOL)
- Update minimum version to 14.0.0
- Add setup scripts and documentation"
```

### 5. Push to GitHub

```bash
git push origin main
```
# Git Push Guide - Fix GitHub Actions

## Quick Fix for GitHub Actions

Your GitHub Actions tests are failing because of outdated Node.js versions. Here's how to fix it:

### 1. Update the test workflow

Replace the content of `.github/workflows/test.yml` with the updated version that removes Node.js 12.x and adds proper error handling.

### 2. Add all new files

```bash
# Add all the new files
git add .github/workflows/test.yml
git add .github/workflows/release.yml
git add .gitignore
git add .npmignore
git add setup.sh
git add setup.ps1
git add GITHUB_ACTIONS_FIX.md
git add GIT_PUSH_GUIDE.md
git add VERSION

# Update existing files
git add project-tool.js
git add package.json
git add README.md
git add CHANGELOG.md
git add quick-start-guide.md
```

### 3. Commit the changes

```bash
git commit -m "fix: Update Node.js requirements and fix GitHub Actions

- Remove Node.js 12.x support (EOL)
- Update minimum version to 14.0.0
- Fix PowerShell compatibility issues
- Add release workflow
- Add setup scripts
- Update documentation"
```

### 4. Push to GitHub

```bash
git push origin main
```

### 5. Create a release (optional)

```bash
# Tag the release
git tag v1.3.0
git push origin v1.3.0
```

## What This Fixes

1. **GitHub Actions**: Tests will now pass with supported Node.js versions
2. **Compatibility**: Better cross-platform support
3. **Installation**: Easier setup with dedicated scripts
4. **Documentation**: Clear guides for all features

## After Pushing

1. Check GitHub Actions tab - all tests should pass ✅
2. If you created a tag, check Releases - automatic release will be created
3. Update repository topics and description if needed

## Supported Node.js Versions

- ✅ Node.js 14.x (Minimum)
- ✅ Node.js 16.x
- ✅ Node.js 18.x (LTS Recommended)
- ✅ Node.js 20.x (Current)
- ❌ Node.js 12.x (Not Supported - EOL)