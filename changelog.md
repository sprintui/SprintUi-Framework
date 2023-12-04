# Changelogs

## Version 1.1 11/13/2023 - RELEASED 

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

## Version 1.2 - 11/13/2023  - RELEASED 


### Added
- Optimization: Improved HTML optimization for enhanced performance.
- New Build Arguments: Introducing new arguments for the build process, offering more flexibility and customization.
- AutoTransfer Command: Enhanced the autotransfer command for automating the transfer of build files to the public folder. It now intelligently handles imports, streamlining the development process
- Temporarily exclude routes/pages: using the provided build arguments with -exclude with the routes/pages in comma
- Added build.min.js, if you want a smaller file on your disk.

### Changed
- Optimization: Improved HTML optimization for enhanced performance.
### Fixed
- Bug in exclusion: If you exclude a file named "test2," for example, it erroneously excludes "test" as well.
- Don't know why but some browsers don't always emit onloaded event, so nothing would happen and it would be stuck on loading...
### Deprecated
- None
### Removed
- None
### Security
- None
### Notes
Future Commands: While specific commands are currently in the planning stage, be prepared for more commands in future updates. Stay tuned for additional features and improvements.

### Message From Devs:
We extend our sincere apologies for the delay in introducing the highly anticipated exclusion feature in the upcoming 1.2 update. Our commitment to delivering a high-quality and reliable framework is unwavering, and we understand the inconvenience caused by this delay.

The exclusion feature, designed to empower you to exclude specific files from the build using the pages.sui configuration, aims to provide greater control over your project. This functionality allows you to bid farewell to unwanted test pages in your production build by easily configuring the settings to ignore them.

While our team actively works to expedite the release of this feature, we recognize the importance of providing a temporary solution. Therefore, until the full feature is implemented, we encourage you to utilize the build argument if you need to exclude files from the build.

Your understanding and patience during this period are greatly appreciated. We value your contribution to the SprintUI community and are committed to delivering an enhanced development experience in the upcoming update.

Thank you for your continued support.

## Version 1.3 - 11/14/2023 - RELEASED 
## Added
- State Management: A new concept called "state" has been incorporated. This feature empowers you to store data across pages, enabling seamless access to database results from one page to another. Fear not, as the state functionality simplifies the process of data retrieval and utilization across different sections of your application.
- New update.js file. Execute this file to effortlessly install the latest build.js and app.js. The update process works by seamlessly downloading the latest files from the GitHub repository, ensuring you have the most up-to-date versions with minimal effort.
### Changed
- None

### Fixed
- None

### Deprecated
- None

### Removed
- None

### Security
- None

### Notes
- None
### Message From Devs:
Message From Devs:
We regret to inform you that the introduction of the highly anticipated exclusion feature in the upcoming 1.3 update has been delayed again. Our development team is currently prioritizing other critical features in the upcoming massive update. Rest assured, we understand the significance of this feature and will prioritize its inclusion in a future release.

The exclusion feature, designed to enhance your control over the project by allowing the exclusion of specific files through the pages.sui configuration, remains a key focus. This functionality will provide a solution for excluding unwanted test pages from your production build.

During this delay, we appreciate your understanding and patience. We assure you that, when implemented, this feature will significantly contribute to the SprintUI framework's versatility. We value your ongoing support and look forward to delivering an enriched development experience in the upcoming updates.

Thank you for your continued trust in SprintUI.

## Version 1.4 - 11/18/2023 - RELEASED

### Added
- Introducing a new feature that ignores asset removal if it has swiftIgnore. This provides greater control over asset management in your SprintUI project.
- The exclusion functionality is now a permanent feature.

### Changed
- Implemented optimization: if the next page includes assets from the current page, they will not be removed.

### Fixed
- Some Styles/Scripts not being removed
### Deprecated
- None

### Removed
- None

### Security
- None

### Notes
- This update requires you to get the latest server file. update.js is now permanent and won't be changed unless needed. Any updates to update.js will only occur after user notification. As of now, this is expected to be the only update affecting server.js until the release of the custom components and hooks update.

### Message From Devs:
It's finally here! Exclusion is now a permanent feature, eliminating the need for temporary exclusions. While you still have the option to add exclusions, there's now a seamless and enduring solution in place. Happy coding!

## Version 1.5 - 11/24/2023 - RELEASED

### Added
- **Enhanced Project Structure:**
  - The `/assets` directory is now a dedicated folder, providing better organization for your project's static files.

- **Simplified Route Configurations:**
  - Easier route configurations, making routes like `/dashboard/blah` possible and straightforward.

### Changed
- **Improved Asset Handling:**
  - app.js are now automatically brought into the `/assets` folder for better project structure.

### Fixed
- None

### Deprecated
- None

### Removed
- None

### Security
- None

### Notes
- **Action Required:**
  - Ensure that you move your `app.js` file and assets that were spread in the public folder to the newly created `/assets` folder to align with the updated project structure.
  - Download the latest versions of update.js and server.js to stay up-to-date with the latest changes.

### Message From Devs:
In the upcoming update, URL parameters will now work in a more intuitive way(/user/1). You can define URL parameters using square brackets, like [id].suip, and access them using the useUrlParam function, for example, useUrlParam("name of param:id"). Stay tuned for this exciting feature in the next release!



## Version 1.6 - 12/4/2023 - Coming Soon

### Added
- Enhanced debugging experience by addressing local variable access in the console when using auto-ready scripts. Functions defined in scripts are now automatically brought out and placed in a separate script, resolving the issue of non-accessible variables.
- Additionally, a new feature allows you to use the `global` keyword before a variable, bringing it into another script. This provides more flexibility in managing variable scope within your SprintUI project.

- Introducing a new option `bringF={false}` to disable the automatic extraction of functions into a separate script.

- Improved state handling: You can now use `${statename}` in the content to dynamically replace it with the value of the specified state, further explanation is in the docs.

### Changed
- Modified the behavior of auto-ready scripts to improve debugging capabilities.

### Fixed
- None

### Deprecated
- None

### Removed
- None

### Security
- None

### Notes
- In the upcoming release, SprintUI aims to be production-ready. Expect changes to the 404 and loading pages, along with the introduction of a new hook or feature dedicated to CSS styling within the framework. The new CSS feature will provide a simplified syntax, making it easy to apply styles with names like `box-row`. This feature draws inspiration from the glass effect style.
- **Update Alert:** `update.js` has been updated. If this is your first time or you are updating from a previous version, ensure you have the latest version of `update.js`. Also, `server.js` will now notify you if your current version is outdated and prompt you to run `update.js` for the latest changes.

### Message From Devs:

We appreciate your continued support! With the recent changes and additions, we are gearing up to make SprintUI production-ready in the next update. Stay tuned for further enhancements and the introduction of a user-friendly CSS feature in the upcoming release.

