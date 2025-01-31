
# SprintUI Documentation

![Sprint UI Logo](https://raw.githubusercontent.com/babymonie/sprintui/main/logo.png)  
**Version**: 2.5

---
## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Project Structure](#project-structure)
4. [Development vs. Production](#development-vs-production)
5. [Pages & Routing](#pages--routing)
6. [Asset Organization](#asset-organization)
7. [The SUIP File Format](#the-suip-file-format)
8. [Styles & Scripts (`<UseStyles>` / `<UseScript>`)](#styles--scripts-usestyles--usescript)
9. [Hooks & Helpers](#hooks--helpers)
10. [State Management](#state-management)
11. [Custom Components](#custom-components)
12. [HImport / CImport](#himport--cimport)
13. [Excluding Pages at Build](#excluding-pages-at-build)
14. [404 & Loading Pages](#404--loading-pages)
15. [Deployment with Apache](#deployment-with-apache)
16. [Working Example](#working-example)
17. [Help Needed](#help-needed)
18. [Further Changelogs](#further-changelogs)

---

## 1. Overview

SprintUI is an SPA framework that uses **HTML**‐like `.suip` files to define your UI. It automatically:
- Manages routing based on file names in `pages/`.
- Injects `<UseStyles>` and `<UseScript>` at runtime.
- Offers a simple state system.
- Provides live reloading via SSE for a quick dev workflow.

If you’re new, see the quick start instructions in [`README.md`](./README.md). Below are the deeper details.

---

## 2. Installation & Setup

Either clone from GitHub or use `create-sprintui`. Then:

```bash
npm install
node server.js
```
Visit `http://localhost:3000`. That’s all you need for dev mode.

For usage instructions on the build script, see [Development vs. Production](#development-vs-production).

---

## 3. Project Structure

A typical SprintUI project has:

```
my-project/
├── routes/
│   ├── api.js
│   ├── auth.js
│   ├── comps_required.js
│   ├── events_required.js
│   ├── orders.js
│   └── pages_required.js
├── pages/
│   ├── home.suip
│   ├── about.suip
│   ├── 404.suip
│   └── [id].suip
├── comps/
│   ├── navbar.suip
│   └── footer.suip
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── script.js
│   └── images/
│       └── logo.png
├── server.js
├── build.js
├── update.js
├── config.sui
└── .v
```

- **`routes/`**: Contains server routes for API, authentication, events, etc.  
- **`pages/`**: Holds `.suip` files that become app routes (e.g., `home.suip` => `/home`).  
- **`comps/`**: Holds reusable “component” `.suip` partials.  
- **`assets/`**: Static resources (CSS, JS, images).  
- **`config.sui`**: Custom config (like `EXCLUDES=...`).  
- **`server.js`**: Dev server entry.  
- **`build.js`**: Production build script.  
- **`update.js`**: Script to update SprintUI files from GitHub.  
- **`.v`**: Tracks your local SprintUI version.

---

## 4. Development vs. Production

- **Development**:  
  ```bash
  node server.js
  ```
  Access `http://localhost:3000`. Edits to `.suip` files cause a live reload.

- **Production**:
  ```bash
  node build.js
  ```
  Creates a `build/` folder with a minified, self‐contained site. Serve `build/index.html` from any static server.

---

## 5. Pages & Routing

- Each file in `pages/` is a route.  
- `home.suip` => `/home`.  
- `[id].suip` => `/:id`.  
- If you go to `/`, it defaults to `home` if present.  
- If a route is unknown, SprintUI tries `404.suip`.

### Nested or Parameterized

- `folderName[!pageName].suip` => e.g. `/folderName/pageName`.  
- `[id].suip` => e.g. `/1234`.

---

## 6. Asset Organization

**Correct approach**: store your static files under `assets/`:

```
assets/
  css/
  js/
  images/
```

**Avoid** placing them at the project root. See the notes in the `README.md` about a recommended “clean” structure.

---

## 7. The SUIP File Format

A `.suip` page might look like:

```jsx
<UseStyles href="styles.css" />

setTitle("My Page");
useQuery();

<UseScript>
  console.log("Hello from My Page script!");
</UseScript>

<suipMarkup>
  <h1>Hello SprintUI</h1>
  <p>This is the content of the page</p>
  <Link to="/about">About Us</Link>
</suipMarkup>
```

- **Outside** `<suipMarkup>`: You can place hooks, imports, or `<UseStyles>` / `<UseScript>`.
- **Inside** `<suipMarkup>`: Put your actual HTML content, `<Link>`, or references to components.

---

## 8. Styles & Scripts (`<UseStyles>` / `<UseScript>`)

1. **`<UseStyles href="..." />`** for external CSS, or `<UseStyles> ... </UseStyles>` for inline.  
2. **`<UseScript src="..." />`** for external JS, or `<UseScript> ... </UseScript>` for inline code.

Attributes:
- `head={true}` places the script/style in `<head>`.
- `autoReady={false}` runs the script immediately instead of waiting for “sprintReady.”
- `sprintIgnore={true}` means do not remove that asset upon navigation to another page.

---

## 9. Hooks & Helpers

- **`setTitle("...")`**: Changes document title.  
- **`setBodyClass("...")`**: Adds classes to `<body>`.  
- **`setRootClass("...")`**: Classes for `#root`.  
- **`useQuery()`**: Captures URL query parameters.  
- **Importing states**: `include states` or `import states from sprintui` to get `addState`, `getState`, `fetchStates`, `removeState`.

---

## 10. State Management

You can embed placeholders in `.suip` for states:

```jsx
<UseScript>
  addState("counter", 0);
</UseScript>

<suipMarkup>
  <div>Counter: ${s.counter}</div>
</suipMarkup>
```

Use:
- `s.counter` => from the “global” states array
- `l.someVar` => from localStorage
- `c.cookieName` => from cookies
- `ss.sessionVar` => from sessionStorage

Currently, placeholders only re‐render when you navigate or reload a page.

---

## 11. Custom Components

Use the `use component` syntax to import `.suip` partials from `comps/`:

```jsx
use component Footer from "./comps/footer.suip"

<suipMarkup>
  <Footer />
  <p>Some main page content</p>
</suipMarkup>
```

If your `footer.suip` references parameters, you can pass them like `<Footer {title="Hi"}>` or similar. Inside `footer.suip`, you can do `\${title}` or other placeholders to consume them.

---

## 12. HImport / CImport

- **HImport**:  
  ```jsx
  <HImport from="footer" />
  ```
  Replaces itself with the content from `comps/footer.suip`.  
  Great for purely static HTML partials.

- **CImport**:  
  Similar, but lets you pass parameters or do more advanced manipulations.

---

## 13. Excluding Pages at Build

- In `config.sui`:
  ```plaintext
  EXCLUDES=page1,page2
  ```
  This permanently excludes certain pages from the production build.

- Temporary exclusion:
  ```bash
  node build.js --exclude=page1,page2
  ```
  Ignores them just for that build run.

---

## 14. 404 & Loading Pages

- **404 Page**: If `pages/404.suip` exists, it’s shown when route is not found. Otherwise, minimal HTML is used.  
- **Loading Page**: You can optionally define a custom “loading.suip” if you want a loading indicator. If not present, SprintUI uses a default “Loading...” text.

---

## 15. Deployment with Apache

1. **Build** with `node build.js`.  
2. Copy the `build/` folder to your Apache doc root.  
3. Use an `.htaccess` (if needed) to redirect non‐asset routes to `index.html`. Example:

   ```apache
   RewriteEngine On
   RewriteRule ^assets/ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.html [L]
   ```

---

## 16. Working Example

Try the live demo at:
[https://sprintui.nggapps.xyz](https://sprintui.nggapps.xyz)

---

## 17. Help Needed

We’re actively seeking contributors to add features, fix bugs, and improve docs. If you can help, please open a pull request or issue on GitHub.

---

## 18. Further Changelogs

For a complete version history (including changes from 1.3 onward), see [changelog.md](https://github.com/sprintui/SprintUi-Framework/blob/main/changelog.md).

**Happy Coding with SprintUI!**

