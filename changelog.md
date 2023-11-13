# Changelogs

## Version 1.1 11/13/2023

### Added

- Optimized the `fetchPagesToTranspile` function to read pages from local files instead of fetching from the server, improving development speed.
- Improved the efficiency of the `fetchPagesToTranspile` function for faster page loading.
- Added the option to disable automatic script execution until the "sprintReady" event occurs. Set `autoReady={false}` in the script to control this behavior.
- Implemented a console feature to provide information about the built files, aiding in determining whether the build process was successful.

### Changed
- Updated the `fetchPagesToTranspile` function to use `Promise.allSettled` for better error handling.

### Fixed

- Handled errors in the `main` function to ensure robust error reporting during script execution.

### Deprecated

- None

### Removed

- Redundant or unnecessary code and dependencies for a more streamlined codebase.

### Security

- None

### Notes

- Scripts will now wait for the "sprintReady" event before executing by default. Use `autoReady={false}` in the script to disable this behavior.
- The console feature provides valuable information about the built files, assisting in the verification of the build process.
