# Changelog

All notable changes to the Interactive Project Tool will be documented in this file.

## [4.1.0] - 2025-08-04

### Added
- Arrow-key selection for all confirmations (replaced Y/n prompts)
- Folder creation options for tree structure feature
- Exit confirmation dialog
- Option to open created folders automatically
- First-run welcome experience
- Separate scan option in translation management
- Detailed fallback conflict resolution with file preview
- Skip option in conflict resolution
- Default folder name suggestion for tree creation
- Export file management with single and batch deletion
- Multi-select capability for batch file operations
- Folder browsing for export file management

### Changed
- Moved .env file to installation directory to avoid conflicts
- Enhanced UX with clearer messages and better flow
- Improved error handling with helpful suggestions
- Better visual feedback throughout the application
- Translation management now requires scan before other operations
- Import settings now show file size and clear action descriptions
- File details now display below menu options for better readability

### Fixed
- Potential .env conflicts with user projects
- Unclear confirmation prompts
- Missing folder creation options in tree feature
- Windows 11 folder/file opening (uses explorer/notepad)
- Export filenames now use readable date format
- Timezone display with local time

## [4.0.0] - 2025-08-03

### Added
- **Translation Management System**: Complete translation synchronization and management
  - Auto-detect translation file structures
  - Sync all language files to have identical keys
  - Automatic translation using OpenAI or free APIs
  - TypeScript types generation and management
  - Translation usage scanner for components
  - Detailed translation reports
- **API Key Setup**: Interactive setup for translation APIs
  - Built-in prompts for OpenAI and Google Translate keys
  - Automatic .env file creation
  - Command line option: `--setup`
- **Translation Commands**:
  - `--sync`: Quick sync all translation files
  - `--check`: Check translation consistency
- **Modular Architecture**: Reorganized code into logical modules
  - `lib/core/`: Core utilities (menu, terminal, input, fileSystem)
  - `lib/export-import/`: Export/import functionality
  - `lib/translation/`: Translation management system
  - `lib/utils/`: Shared utilities

### Changed
- **Package Name**: Unified to `project-tool` (was `translation-tool` in some files)
- **Global Command**: Now installs as `project-tool` globally
- **Menu System**: Added translation management and API setup options
- **Version**: Bumped to 4.0.0 to reflect major feature additions
- **README**: Complete rewrite with Claude AI prompt included

### Fixed
- Version consistency across all files
- Package.json metadata and scripts
- Binary file naming consistency
- PowerShell compatibility improvements

### Removed
- Redundant update scripts (update.ps1, update.sh)
- Git setup scripts (git-commands.ps1, git-commands.sh, git-setup.bat)
- Test export files

## [3.0.0] - 2025-08-02 (Pre-release)

### Added
- Initial translation management features
- Translation scanner for detecting usage in code
- Translation synchronizer for keeping files in sync
- Translation analyzer for reporting
- API integration for auto-translation

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