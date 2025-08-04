# Changelog

All notable changes to the Interactive Project Tool will be documented in this file.

## [4.1.0] - 2025-01-03

### Added
- **Translation Structure Creation**: Create complete i18n setup for projects without translation infrastructure
  - Interactive language selection with Space key
  - Generates index.ts, types.ts, and language files
  - Supports 14 languages out of the box
- **Smart Fallback Grouping**: Intelligently groups similar fallback texts regardless of quote types
  - `"Just Browsing"` now correctly groups with `'Just browsing'`
  - Case-sensitive comparison for accuracy
  - Shows all variations in conflict resolution
- **Enhanced Time Display**: Added time display in multi-select export file deletion
  - Shows full date and time: "03/01/2025, 14:30:45"
  - Consistent time display across all file management features

### Changed
- Improved translation pattern detection to handle edge cases
- Enhanced conflict resolution UI to show quote variations
- Better handling of projects without existing translation setup
- Updated export file manager to show consistent date/time format

### Fixed
- Fixed quote sensitivity in fallback text comparison
- Fixed missing time display in batch file deletion mode
- Fixed translation structure detection for projects with t.strings but no files
- Fixed edge cases in translation pattern matching

## [4.0.1] - 2025-01-02

### Fixed
- Module loading issues with treeParser
- Environment file conflicts with user projects

## [4.0.0] - 2025-01-01

### Added
- Complete translation management system
- Auto-translation with OpenAI and Google Translate
- Translation synchronization across all language files
- TypeScript types generation
- Translation usage scanner
- Detailed translation reports
- API key setup wizard

### Changed
- Modular architecture with organized code structure
- Enhanced menu system with arrow-key navigation
- Better error handling throughout the application

## [3.0.0] - 2024-12-15

### Added
- Tree structure creation from diagrams
- Export file management with batch operations
- Enhanced import with directory browsing
- First-run experience with welcome message

### Changed
- All confirmations now use arrow-key selection
- Improved user experience with better feedback
- Enhanced error messages with helpful suggestions

## [2.0.0] - 2024-11-01

### Added
- .gitignore support for exports
- PowerShell compatibility
- Command-line options (--help, --version)

### Fixed
- Windows terminal display issues
- macOS compatibility problems
- Input handling in different terminals

## [1.0.0] - 2024-10-15

### Initial Release
- Project export functionality
- Project import functionality
- Interactive CLI with arrow-key navigation
- Zero dependencies
- Cross-platform support

