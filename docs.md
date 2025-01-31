# SprintUI Documentation

![Sprint UI Logo](https://raw.githubusercontent.com/babymonie/sprintui/main/logo.png)  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation & Project Setup](#installation--project-setup)
3. [Project Structure](#project-structure)
4. [The SUIP File Format](#the-suip-file-format)
5. [Styles & Scripts](#styles--scripts)
6. [Hooks & Helpers](#hooks--helpers)
7. [State Management](#state-management)
8. [Components (The “use component” Approach)](#components-the-use-component-approach)
9. [renderData Functionality](#renderdata-functionality)
10. [Routing & URL Parameters](#routing--url-parameters)
11. [Production Builds & Excluding Pages](#production-builds--excluding-pages)
12. [Custom 404 & Loading Pages](#custom-404--loading-pages)
13. [Deployment (Apache Example)](#deployment-apache-example)
14. [Extended Example](#extended-example)
15. [Changelogs (1.1 → 2.5)](#changelogs-11--25)
16. [Help & Contributions](#help--contributions)

---

## 1. Introduction

SprintUI is a Single‐Page Application framework that uses a simple **HTML‐centric** approach. You write `.suip` files for each “page,” and SprintUI automatically:

- **Manages Routing:** A file named `pages/home.suip` becomes `/home`.
- **Injects Scripts & Styles**: `<UseScript>` / `<UseStyles>` blocks are automatically inserted or removed on navigation.
- **Manages State:** A minimal “state” concept so you can pass data from one page to another or store user info in cookies/localStorage.
- **Live Reload:** Dev server triggers automatic reload on `.suip` changes.
- **New in v2.5**: Asynchronous rendering for faster page loads, built‐in Sass compiler and JS minifier, `renderData`, and an improved “use component” approach that fully replaces older HImport/CImport patterns.

---

## 2. Installation & Project Setup

1. **Install** or **clone** the SprintUI repo (or use `create-sprintui`).
2. **Run** `npm install`.
3. **Dev Mode**: `node server.js` => Access `http://localhost:3000`.
4. **Build**: `node build.js` => Creates a `build/` folder for production.

If you need to **update** to the latest SprintUI (1.3+), ensure you have `update.js`. See **README.md** for more info on that.

---

## 3. Project Structure

A typical SprintUI project might look like:

```
my-project/
├── routes/
│   ├── comps_required.js
│   ├── events_required.js
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
├── build/
├── server.js
├── build.js
├── update.js
├── config.sui
└── .v
```

- **`pages/`**: Where your `.suip` pages live, each mapped to a route.
- **`comps/`**: Where your “component” `.suip` files live (reusable chunks of UI).
- **`routes/`**: Express routes for APIs, SSE events, etc.
- **`assets/`**: CSS, JS, images, etc.
- **`config.sui`**: Houses `EXCLUDES=` or other config lines.
- **`.v`**: A simple text file storing the current version of SprintUI.

---

## 4. The SUIP File Format

**Example** of a `.suip` page (`home.suip`):

```jsx
<UseStyles href="styles.css" />

setTitle("Home Page");
include states

<UseScript>
  addState("welcomeMsg", "Welcome to SprintUI!");
</UseScript>

<suipMarkup>
  <h1>${s.welcomeMsg}</h1>
  <p>This is the home page.</p>
  <Link to="/about" className="btn">Go to About</Link>
</suipMarkup>
```

### Key Sections

1. **Hooks & Imports** (`setTitle(...)`, `include states`, etc.)  
2. **`<UseScript>` / `<UseStyles>`** tags for scripts/styles.  
3. **`<suipMarkup>`** for actual HTML content.

When you navigate to `/home`, SprintUI “transpiles” this file, injects the styles & scripts, applies hooks, and then places `<h1>...</h1>` etc. into the DOM.

---

## 5. Styles & Scripts

### **`<UseStyles>`**
- `<UseStyles href="something.css" />`  
  or  
  ```jsx
  <UseStyles>
    .myClass {
      color: red;
    }
  </UseStyles>
  ```
- If you specify `sprintIgnore={true}`, SprintUI won’t remove it when navigating away.

### **`<UseScript>`**
- `<UseScript src="something.js" head={true} async={true} />` for external.  
- Or inline:
  ```jsx
  <UseScript autoReady={false}>
    console.log("Inline script runs immediately, skipping sprintReady");
  </UseScript>
  ```
- If `autoReady={true}` (the default), the script runs after the framework fires “sprintReady.”  
- If `sprintIgnore={true}`, the script remains loaded across navigations.

---

## 6. Hooks & Helpers

You can place lines like:

- **`setTitle("...")`**: Changes document.title
- **`setBodyClass("...")`**: `<body class="...">`
- **`setRootClass("...")`**: `<div id="root" class="...">`
- **`setHtmlClass("...")`**: `<html class="...">`
- **`useQuery()`**: Captures query params in a local variable that your scripts can read.
- **`include states`** or `include cookies`: Tells SprintUI to inject built‐in state or cookie helper functions (`addState`, `getCookie`, etc.).

> All these lines (hooks) must appear **outside** `<suipMarkup>`.

---

## 7. State Management

**Introduced in v1.3**, states let you store data across pages.

1. **Include states** in your `.suip`:  
   ```jsx
   include states
   ```
2. **Use the script**:
   ```jsx
   <UseScript>
     addState("counter", 0);
   </UseScript>

   <suipMarkup>
     <h2>Counter = ${s.counter}</h2>
     <button onclick="incrementCounter()">Add 1</button>
   </suipMarkup>
   ```
3. **Possible references**:
   - `s.counter` => from SprintUI’s ephemeral “states” array.
   - `l.someVar` => localStorage `someVar`.
   - `ss.tempVar` => sessionStorage.
   - `c.myCookie` => a cookie named `myCookie`.

**Note**: The placeholders like `${s.counter}` only update on a full page re‐render or navigation. If you want real‐time reactivity, that is not built in yet.

---

## 8. Components (The “use component” Approach)

### Background

Earlier versions (2.1–2.3) introduced `HImport` and `CImport`. They are **now deprecated** in favor of a simpler approach:

```jsx
use component MyNav from "./comps/navbar.suip"
use component * from "./comps/all.suip" // import everything
```

Inside your `.suip`, define a “component” reference:

```jsx
<suipMarkup>
  <MyNav {title="HomePage"} />
  <div>Welcome to the homepage!</div>
</suipMarkup>
```

### In the “navbar.suip”

You might have:

```jsx
<suipMarkup>
  <nav>
    <h2>${title}</h2>
    <Link to="/about">About</Link>
  </nav>
</suipMarkup>
```

- Any parameters (like `{title="HomePage"}`) are replaced wherever you have `\${title}` in the `.suip`.
- You can also omit parameters if none are needed.

This approach gives you **reusable** partials without needing older `HImport` or `CImport`.

---

## 9. renderData Functionality

**New in v2.5**, `renderData` blocks let you loop or conditionally render data from states, localStorage, or cookies. For example:

```html
<renderData data="s.myList">
  <div>{index}: {element.name}</div>
</renderData>
```
- This might loop over an array called `myList` in SprintUI states.  
- Each iteration replaces `{element.whatever}` and so on.

See the v2.5 changelog for more details on how the underlying parsing works.

---

## 10. Routing & URL Parameters

1. **Basic**: `pages/home.suip` => `/home`.  
2. **Dynamic**: `[id].suip` => e.g. `/123`.  
3. **Multiple**: `dashboard[!settings].suip` => `/dashboard/settings`.  
4. **Access** them with:
   - `getUrlParam("id")`
   - or `useQuery()` for `?foo=bar` queries
   - or `URLSegments` if you have custom logic.

**In Version 2.0**: You can also directly reference them from states or from the new function `useUrlParam("id")`.

---

## 11. Production Builds & Excluding Pages

When you run:

```bash
node build.js
```
SprintUI:

- Minifies JS/SCSS,
- Merges `.suip` pages,
- Outputs everything in `build/`.

**Excluding** pages:

- **Permanent**: In `config.sui`, add:
  ```
  EXCLUDES=TestPage,Experimental
  ```
- **One‐time**: `node build.js --exclude=TestPage,Experimental`

These pages or routes won’t appear in the final build.

---

## 12. Custom 404 & Loading Pages

1. **404**:
   - If `pages/404.suip` exists, it’s shown for unknown routes.
   - If not, SprintUI uses a minimal fallback.

2. **Loading**:
   - You can define a `pages/loading.suip` (or other config) to show while waiting for page load. If none is found, a default “Loading...” text is used.

As of **v1.8** and higher, you can fully customize them in plain `.suip`. They should not include heavy custom CSS unless you add it via `<UseStyles>`.

---

## 13. Deployment (Apache Example)

After building:

1. **Upload** `build/` to your server.
2. If using **Apache**:

   ```apache
   RewriteEngine On
   RewriteRule ^assets/ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ index.html [L]
   ```
   This ensures all routes are handled by `index.html` except for static files in `assets/`.

---

## 14. Extended Example

**`pages/home.suip`**:

```jsx
setTitle("Home");
include states
use component NavBar from "../comps/navbar.suip"

<UseScript>
  addState("hello", "Hello from State!");
</UseScript>

<suipMarkup>
  <NavBar />
  <h1>${s.hello}</h1>
  <Link to="/about">Go to About</Link>
</suipMarkup>
```

**`comps/navbar.suip`**:

```jsx
<suipMarkup>
  <nav>
    <Link to="/home">Home</Link> |
    <Link to="/profile">Profile</Link>
  </nav>
</suipMarkup>
```

That’s all you need for a functioning multi‐page SPA with re‐usable nav.

---



## 16. Help & Contributions

We’d love your feedback or assistance! If you have ideas (like better reactivity, advanced theming, new hooks, etc.):

1. File an **issue** on GitHub with your suggestions.
2. Open a **pull request** if you’ve coded a fix or feature.
3. Drop by our community forum (link TBA) to discuss further.

**Happy Building with SprintUI!** 
```
