# Changelog

All notable changes to the Interactive Project Export/Import Tool will be documented in this file.

## [1.2.0] - 2024-01-16

### Added
- **Enhanced Import Process**: Complete redesign of the import functionality
  - Step-by-step import wizard with clear indicators
  - Directory browser for selecting destination
  - Option to create new folders with custom names
  - Option to use existing directories
  - Ability to browse parent directories
  - Confirmation screen showing all import settings
- **Better Error Handling**: Checks for existing folders and provides options
- **Improved UX**: Clearer navigation and feedback throughout the import process

### Changed
- Import process now has 3 clear steps: file selection, destination selection, and confirmation
- Default folder name "recovered" is now suggested but not forced

## [1.1.0] - 2024-01-15

### Added
- **Gitignore Support**: When exporting a project that contains a `.gitignore` file, the tool now asks whether you want to use its patterns for filtering files
  - Supports all common gitignore patterns including wildcards, directory patterns, and path patterns
  - Choice is saved in the export metadata for reference

### Fixed
- **Windows Terminal Display**: Fixed issue where menu options would display twice in Windows terminals when using arrow keys
  - Replaced cursor movement with screen clearing for better cross-platform compatibility

### Changed
- Updated export metadata to include gitignore usage status
- Improved menu redraw logic for smoother navigation

## [1.0.0] - 2024-01-10

### Initial Release
- Interactive CLI with arrow key navigation
- Export projects to single text file
- Import projects from exported files
- Visual file/directory browser
- Colorful terminal interface
- No external dependencies
- Support for common web development file types
- Automatic filtering of node_modules, build directories, etc.