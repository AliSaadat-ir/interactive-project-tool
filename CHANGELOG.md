# Changelog

All notable changes to the Interactive Project Export/Import Tool will be documented in this file.

## [1.3.0] - 2025-07-24

### Added
- **Create Structure from Tree**: New feature to create folder/file structure from a tree diagram
  - Paste any tree structure and automatically create all folders and empty files
  - Supports complex nested structures
  - Perfect for quickly setting up project scaffolding
- **Command Line Options**: Added --help and --version flags for easier testing and CI/CD
- **Smart Export File Filtering**: Import now only shows .txt files containing "export" in the name
- **PowerShell Compatibility**: Full compatibility with Windows PowerShell terminal
  - Fixed input issues with folder name entry
  - Fixed paste duplication issues
  - Improved readline interface handling
- **GitHub Actions Support**: Better integration with CI/CD pipelines

### Fixed
- **Folder Creation Bug**: Fixed issue where creating new folders would exit the terminal
- **Parent Directory Navigation**: Fixed navigation with ".." in import file selection
- **Tree Parsing**: Improved tree structure parsing to handle PowerShell paste issues
- **Input Handling**: Completely rewrote input handling for better cross-platform compatibility
- **Windows Test Commands**: Fixed PowerShell commands in GitHub Actions workflows

### Changed
- Import file browser now filters to show only relevant export files
- Tree structure always included in exports, even for flat projects
- Improved error handling for file system operations
- Better visual feedback during all operations
- Minimum Node.js version requirement updated to 14.0.0

## [1.2.0] - 2025-07-23

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

## [1.1.0] - 2025-07-23

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

## [1.0.0] - 2025-07-23

### Initial Release
- Interactive CLI with arrow key navigation
- Export projects to single text file
- Import projects from exported files
- Visual file/directory browser
- Colorful terminal interface
- No external dependencies
- Support for common web development file types
- Automatic filtering of node_modules, build directories, etc.