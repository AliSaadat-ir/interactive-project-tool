# Git Push Guide - Fix GitHub Actions

## Quick Fix for GitHub Actions

Your GitHub Actions tests are failing because:
1. Node.js 12.x is End of Life
2. macOS-latest uses Apple Silicon (ARM64) which doesn't support Node.js 14.x

Here's how to fix it:

### 1. Update the test workflow

Replace the content of `.github/workflows/test.yml` with the updated version that:
- Removes Node.js 12.x completely
- Uses `macos-13` (Intel-based) instead of `macos-latest`
- Tests Node.js 14.x only on Linux and Windows

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
git commit -m "fix: Update Node.js requirements and fix macOS GitHub Actions

- Remove Node.js 12.x support (EOL)
- Fix macOS ARM64 compatibility issues
- Use macos-13 for Intel-based testing
- Update minimum version to 14.0.0
- Fix PowerShell compatibility issues
- Add release workflow
- Add setup scripts
- Update documentation"
```

# GitHub Actions Fix Guide

## Problem
The test workflow was failing because:
1. Node.js 12.x is End of Life and not compatible with our code
2. macOS-latest (Apple Silicon/ARM64) doesn't support Node.js 14.x
3. The workflow was testing with outdated Node.js versions

## Solution Applied

### 1. Updated Node.js Version Requirements
- Removed Node.js 12.x completely (EOL)
- Changed minimum Node.js version to 14.0.0
- Updated test matrix to handle macOS ARM64 compatibility

### 2. Updated Test Matrix
- Use `macos-13` instead of `macos-latest` (Intel-based for compatibility)
- Test Node.js 14.x only on Linux and Windows
- Test Node.js 16.x, 18.x, 20.x on all platforms

### 3. Updated Files:
- `.github/workflows/test.yml` - Fixed macOS compatibility issues
- `package.json` - Changed engines requirement to >=14.0.0
- Added `fail-fast: false` to continue testing other versions even if one fails

### 4. Added Release Workflow
Created `.github/workflows/release.yml` for automatic releases when pushing tags.

## How to Fix in Your Repository

1. **Update the workflow file**:
   ```bash
   # Copy the new test.yml content to .github/workflows/test.yml
   ```

2. **Update package.json**:
   ```json
   "engines": {
     "node": ">=14.0.0"
   }
   ```

3. **Push changes**:
   ```bash
   git add .
   git commit -m "fix: Update Node.js version requirements"
   git push
   ```

## Creating a New Release

1. **Update version**:
   ```bash
   # Update VERSION file
   echo "1.3.0" > VERSION
   
   # Update package.json version
   npm version 1.3.0 --no-git-tag-version
   ```

2. **Commit and tag**:
   ```bash
   git add .
   git commit -m "chore: Release v1.3.0"
   git tag v1.3.0
   git push origin main --tags
   ```

The release workflow will automatically create a GitHub release with downloadable archives.

## Node.js Version Support

| Node.js Version | Status | Support |
|-----------------|--------|---------|
| 12.x | ❌ | End of Life - Not Supported |
| 14.x | ✅ | Supported (Minimum) |
| 16.x | ✅ | Supported |
| 18.x | ✅ | Supported (LTS) |
| 20.x | ✅ | Supported (Current) |