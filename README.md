
![Sprint UI Logo](https://raw.githubusercontent.com/babymonie/sprintui/main/logo.png) - V2.0

**Welcome to the SprintUI Framework!**

We're thrilled to have you on board. Let's get started with building and deploying your projects using this powerful framework.

##### Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sprintui/SprintUi-Framework 
   cd SprintUi-Framework 
   ```

2. **Understanding the Project Structure**
   - `server.js`: Basic project setup in development mode.
   - `public`: All your public files, including a `pages` folder.
   - `build.js`: Script for production build. After running this, `server.js` is not needed, and routes will point to `index.html`.
   - `pages`: Folder within `public` where your SprintUI project files reside.
3. **Remove unnecessary files that we provide: icon.png, version.txt, changelog.md, readme**

### Update Procedure

A new file named `update.js` has been introduced. If you don't have this file already, please follow these steps:

1. Visit the [sprintui](https://github.com/sprintui/SprintUi-Framework) and navigate to `update.js`.
2. Copy the raw code of `update.js`.
3. Create a new file named `update.js` in your project.
4. Paste the copied code into the newly created `update.js` file.

If this is your first time, you can skip this step, as the file is in update 1.3 and forward!


### Development Mode

1. Run the server in development mode:
   ```bash
   node server.js
   ```

2. Open your browser and navigate to http://localhost:3000 to start building your SprintUI project.

3. For SprintUI syntax, refer to the files in the `pages` folder. It's a mix of HTML and JavaScript. Get familiar with it before moving to production.
 4.Asset Organization and Routing in SprintUI Framework

### Asset Structure

In SprintUI Framework, organizing your assets is crucial for a clean and efficient development experience. Here's a guide to help you understand the correct practices for asset organization:

### Correct Asset Structure

The recommended practice is to place all your assets inside an `assets` folder. This ensures a cleaner and more organized codebase. For example:

```
/assets
  /js
    test.js
  /css
    styles.css
  /images
    logo.png
```

This structure is resilient to future updates and prevents issues with asset paths in subsequent versions.

### Incorrect Asset Structure

Avoid placing assets directly in the root directory, as this may lead to problems in routing, especially in future updates. For instance:

```
/test.js
/styles.css
/logo.png
```

This structure may work initially but can result in broken paths in future updates, causing issues with your application's functionality.

## Routing Best Practices

SprintUI follows a straightforward routing system based on the file structure within the `pages` folder. Here are some best practices for effective routing:

### File Naming

For single pages, you can follow the convention of `pageName.suip`. However, for nested folders, name your pages with a folder prefix, like `folderName[!pageName].suip`. For instance:

```
/pages
  home.suip
    dashboard[!home].suip
    dashboard[!profile].suip
    blog[!post].suip
    blog[!category].suip
```

This naming convention hardens clarity and starts potential conflicts in page names.

### URL Structure

SprintUI supports a straightforward URL structure based on the file hierarchy. For example:

- `/` maps to `home.suip`
- `/blog[!post]` maps to `blog/post`
- 
### URL Parameters

URL parameters are as follows: `view/1233`, where `1233` represents the ID. To create one, make a file named `view[id].suip`.

Here, you can access it using functions in JavaScript or by utilizing the state manager.

You might ask, "Wait, aren't routes like `/test/test2/home` also URL parameters?" Yes, they are, but they remain unused parameters.

Functions to use: `getUrlParam` and `getUrlParams`.

## Production Deployment


1. **Build your project for production:**
   ```bash
   node build.js
   ```
2 .**Check the newly created build folder**

For advanced customization, if you have a file called `pages.sui` (which is assumed to always be present), enhance exclusion settings by adding the following line:

```plaintext
EXCLUDES=TEST,TEST2,etc...
```

To temporarily exclude files during a build, you can utilize the `-ex` or `--exclude` argument:

```bash
node build.js -ex=TEST,TEST2
```

This argument functions similarly to the `EXCLUDES` setting in `pages.sui` but is applied temporarily during the build process.

### Deploying With Apache in Production



1. **Copy this `.htaccess`:**
   - In your application's root directory, create an `.htaccess` file with necessary configurations. For example, if using mod_rewrite for clean URLs:

   ```apache
   RewriteEngine On
   
   # Exclude /assets from the rules
   RewriteRule ^assets/ - [L]
   
   # Rewrite all other routes to index.html
   RewriteCond %{REQUEST_URI} !^/index\.html$
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [L]

   ```
2. **Test:**
   - Open your browser and navigate to your domain. Verify that your application is working as expected.

This is a basic setup for deploying SprintUi using Apache in production.

##### Learning SprintUI (suip)

Now that you have the basics down, let's delve into using SprintUI (suip) within your project. Follow the steps below to make the most of this powerful framework:

#### Adding Styles and Scripts

1. **Linking External Styles and Scripts:**
   ```jsx
   <UseStyles href="https://unpkg.com/aos@2.3.1/dist/aos.css" />
   <!-- Add more links as needed -->
   <UseScript src="https://cdn.tailwindcss.com" head={true} />
   ```

2. **Setting Local Styles:**
   ```jsx
   <UseStyles>
     /* Your local styles here */
   </UseStyles>
   ```

3. **Setting Local Scripts:**
   ```jsx
   <UseScript>
     // Your local scripts here, make sure you include at the end; or else you will get errors.
   </UseScript>
   ```

4. **Setting Asset Exclusion:**
   ```jsx
   <UseScript sprintIgnore={true}>
     /* Ignore asset removal if it has sprintIgnore */
     /* This provides greater control over asset management in your SprintUI project */
   </UseScript>
   ```

   This allows you to manage asset removal selectively, ensuring that assets with `sprintIgnore` are ignored during the removal process, providing enhanced control over your SprintUI project's asset management.
### Hooks

Hooks in SprintUI can be a complex topic due to its dual nature. There are two types: one that interacts with the real DOM in index.html, and another designed for ease of use.

For instance, the first type includes functions like setTitle, which allows you to change the title of index.html. On the other hand, the second type includes functions like useQuery.

It's important to note that for the second type, there are additional categories, such as imports, useQuery, and more. These elements, including imports, useQuery, and others, should be placed outside the suipMarkup area and not within any styles or scripts.

Imports function similarly to regular imports, bringing in a set of functions. For example, when you import states, it includes four functions. Understanding and appropriately placing these hooks is crucial for effective use in SprintUI.

As of the current version, the available hooks along with their descriptions and examples are:

- **`setBodyClass`**: Sets the CSS class for the body element of the document.

  Example:
  ```jsx
  setBodyClass("bg-dark");
  ```

- **`setRootClass`**: Sets the CSS class for the root element of the SprintUI application.

  Example:
  ```jsx
  setRootClass("container");
  ```

- **`setTitle`**: Changes the title of the `index.html` document.

  Example:
  ```jsx
  setTitle("My SprintUI App");
  ```

- **`useQuery`**: Retrieves and handles query parameters from the URL.

  Example:
  ```jsx
  let query = useQuery();

   <UseScript>
      //you may access it from here now
      alert(query)
   </UseScript>
  ```

- **`import states`**: Imports a set of functions related to managing state in SprintUI.

  Example:
  ```jsx
  
  import states from sprintui
   <UseScript>
      addState("name,value") // adds a state
      getState("name")// gets the state by name
      fetchStates()//returns all the states
      removeState("name")// remove a state by name
   </UseScript>
   <div id="counter">${s.counter or 0}</div>
   <!-- This div displays the value of the 'counter' state, defaulting to 0 if the state is not defined or null. -->
   <!-- Note: Display Hook values are fixed during SprintUI page renders, meaning they only update when a new page is loaded. -->
   <!-- To choose a storage type for 'counter':
         - Use 's' for state (e.g., s.counter)
         - Use 'l' for local storage (e.g., l.someVariable)
         - Use 'c' for cookies (e.g., c.cookieValue)
         - Use 'ss' for session storage (e.g., ss.sessionValue)
   -->
     
  ```


4. **Handling suip Ready Event:**
   ```jsx
   <UseScript head={false} autoReady={true}>
    //your code runs after all assets are ready
   </UseScript>
   ```

## SprintUI Page Structure

```jsx
<UseStyles>
  /* Put your CSS here */
</UseStyles>

<UseScript head={false}>

    // Sprint is ready to use, do your stuff here

</UseScript>

<suipMarkup>
  <!-- Your suip here -->
</suipMarkup>
```


## SUIP Components

### Title: Link
**Description:** Link allows you to move to pages without using actual page movement using the history API, which makes everything 10x faster.

**Use Case:**
```jsx
<Link to="/" className="btn btn-primary">About</Link>
<Link to="/test" className="btn btn-primary">About</Link>
```

### Title: HImport
**Description**: HImport allows you to import HTML from a file. You can create a SUIP file in 'comps' or import HTML from an external source, ensuring it's only HTML. It replaces the HImport tag with the specified HTML content. This feature is beneficial for pages utilizing navbars and footers since it condenses multiple lines of code into just one. During building, it's already replaced, eliminating the need for fetching from the server. Ensure to provide a link to the component if importing from an external source.

**Use Case:**
```jsx
<HImport from="footer">
<HImport from="test">
<HImport from="http://example.com/navbar"> <!--make sure to have http or https befor and also that the url retuns html and a html content type or text, it doesn't have to be a suic file just html or suic-->
```

**test.suic:**
```html
<ul class="nav nav-tabs">
  <li class="nav-item">
    <a class="nav-link active" href="#">Active</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" href="#">Link</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" href="#">Link</a>
  </li>
  <li class="nav-item">
    <a class="nav-link disabled" href="#">Disabled</a>
  </li>
</ul>
```

Congratulations! Your SprintUI project is now ready for the world to see. Simply clone the repository, follow the steps, and showcase your creation to the world. Happy coding!

# Customizing Loading and Not Found Pages

Starting from the latest update, SprintUI allows developers to customize the 404 page and loading screen without the need for custom CSS. Follow the instructions below to tailor these pages to your application's design:

## Customizing the 404 Page

To customize the 404 page, developers are required to create their suip file. If not provided, SprintUI will default to a minimal HTML code. Follow these steps:

1. Create 404.suip in the pages folder 

Example 404.suip:

```jsx
<UseScript src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" head={true} />
<UseStyles href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">





<suipMarkup>

<div class="container">
  <div class="row">
    <div class="col-12">
    <h1>404 - Not Found</h1>
    <p>Oops! The page you are looking for might be under construction.</p>

    </div>
  </div>

</div>



</suipMarkup>
```

## Customizing the Loading Page

To customize the loading page, developers should follow these guidelines:

1. Create a custom HTML file for the loading page loading.suip in the pages folder.

2. Use only HTML syntax within this file.

3. Optionally, use the `style` attribute for styling.

Example loading.suip:

```html

<div style="display:flex;justify-content:center;align-items:center;flex-direction:column;height:100vh">
    <img src="/assets/spinner.gif" alt="Spinner" loading="lazy" />
</div>

```


# See a Working Example

Check out a working example of SprintUI at [https://sprintui.nggapps.xyz](https://sprintui.nggapps.xyz).

# Changelogs

Go to [changelog.md](https://github.com/sprintui/SprintUi-Framework/blob/main/changelog.md) to see changelogs.

Stay tuned for the release!

# Help Needed

We are actively seeking assistance from individuals who can contribute to adding support for SprintUI. If you
