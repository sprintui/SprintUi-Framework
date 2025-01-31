
![Sprint UI Logo](https://raw.githubusercontent.com/babymonie/sprintui/main/logo.png) - V2.6 - coming soon still in dev state

**Welcome to the SprintUI Framework!**

SprintUI is a powerful framework for building Single‐Page Applications (SPAs) using `.suip` files, allowing you to define pages, components, and scripts in a minimal, HTML‐focused style.

### Quick Start

1. **Clone or Create a SprintUI Project**

   **Via GitHub**:
   ```bash
   git clone https://github.com/sprintui/SprintUi-Framework
   cd SprintUi-Framework
   ```
   **Via NPM**:
   ```bash
   npm install -g create-sprintui
   create-sprintui
   ```

2. **Install Dependencies**  
   ```bash
   npm install
   ```

3. **Run in Development**  
   ```bash
   node server.js
   ```
   Then open `http://localhost:3000`.

4. **Production Build**  
   ```bash
   node build.js
   ```
   This generates a `build/` folder with your compiled assets and pages.

### Update Procedure (from 1.3 and beyond)

A file named `update.js` was introduced in Version 1.3. If you don’t already have it:

1. Go to [sprintui](https://github.com/sprintui/SprintUi-Framework) on GitHub.  
2. Copy the raw code for `update.js`.  
3. Add it to your project root.  

### More Information

- **Please visit [`docs.md`](./docs.md) for full documentation** on features like asset management, routing, hooks, states, components, custom 404 pages, and more.
- Remove any unnecessary files (icon.png, version.txt, etc.) as needed.

### Migration Notes

- If you have an older version (pre‐1.3), follow the instructions above to add `update.js`.
- If you’d like to exclude certain pages at build time, see details in `docs.md` about `config.sui` or `--exclude` flags.

### Happy Coding!
