# macOS Compatibility Guide

## The Problem

GitHub Actions' `macos-latest` runner now uses Apple Silicon (ARM64/M1/M2) Macs, which causes issues with older Node.js versions:

- **Node.js 12.x**: Not available for ARM64 (End of Life)
- **Node.js 14.x**: Not available for ARM64 macOS
- **Node.js 16.x+**: Full ARM64 support ✅

## Solutions

### Option 1: Use Intel-based macOS (Recommended)
```yaml
runs-on: macos-13  # Intel-based, supports all Node.js versions
```

### Option 2: Conditional Testing
Test older Node.js versions only on Linux/Windows:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [16.x, 18.x, 20.x]
    include:
      # Test Node 14 only on Linux and Windows
      - os: ubuntu-latest
        node-version: 14.x
      - os: windows-latest
        node-version: 14.x
```

### Option 3: Exclude Combinations
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [14.x, 16.x, 18.x, 20.x]
    exclude:
      # Exclude Node 14 on macOS
      - os: macos-latest
        node-version: 14.x
```

## Our Solution

We use a combination approach:
1. Use `macos-13` (Intel-based) for consistent testing
2. Test Node.js 14.x only on Linux and Windows
3. Test Node.js 16.x+ on all platforms

## macOS Runner Versions

| Runner | Architecture | Node.js Support |
|--------|--------------|-----------------|
| macos-11 | Intel x64 | All versions |
| macos-12 | Intel x64 | All versions |
| macos-13 | Intel x64 | All versions |
| macos-14 | Apple Silicon | 16.x and newer |
| macos-latest | Apple Silicon* | 16.x and newer |

*Note: macos-latest will migrate to macOS 15 (Apple Silicon) in August 2025

## Local Development on macOS

If you're using an Apple Silicon Mac (M1/M2/M3):
- Node.js 16.x and newer work natively
- Node.js 14.x requires Rosetta 2
- Node.js 12.x is not supported

To install Rosetta 2 (if needed):
```bash
softwareupdate --install-rosetta
```