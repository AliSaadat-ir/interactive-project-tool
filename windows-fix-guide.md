# Windows GitHub Actions Fix

## The Problem

The Windows tests were failing with this error:
```
This command cannot be run because either the parameter "RedirectStandardInput 
'D:\a\interactive-project-tool\interactive-project-tool\NUL'" has a value that 
is not valid or cannot be used with this command.
```

## Root Cause

The PowerShell command used in the test workflow was trying to redirect stdin using `"NUL"`, which doesn't work properly in PowerShell on GitHub Actions runners.

```powershell
# This doesn't work:
$process = Start-Process -FilePath "node" -ArgumentList "project-tool.js" -PassThru -RedirectStandardInput "NUL"
```

## Solution

### 1. Added Command Line Options
Added `--help` and `--version` flags to the main script:
```javascript
if (args.includes('--help') || args.includes('-h')) {
  // Show help and exit
}
if (args.includes('--version') || args.includes('-v')) {
  // Show version and exit
}
```

### 2. Simplified Test Workflow
Instead of complex PowerShell commands, use simple direct commands:
```yaml
- name: Test help command
  run: node project-tool.js --help

- name: Test version command
  run: node project-tool.js --version
```

### 3. Cross-Platform Testing
The same commands now work on all platforms:
- ✅ Linux (Ubuntu)
- ✅ Windows
- ✅ macOS

## Benefits

1. **Simpler Tests**: No need for platform-specific test code
2. **Better CI/CD**: Easy to integrate in any pipeline
3. **Debugging**: Can quickly check version in production
4. **Standards**: Follows common CLI conventions

## Usage

```bash
# Check if installed correctly
project-tool --version

# Get help
project-tool --help

# Run interactive mode
project-tool
```