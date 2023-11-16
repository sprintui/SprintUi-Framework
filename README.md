
![Sprint UI Logo](https://raw.githubusercontent.com/babymonie/sprintui/main/logo.png) - V1.4

**Welcome to the SprintUI Framework!**

We're thrilled to have you on board. Let's get started with building and deploying your projects using this powerful framework.

## Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/babymonie/sprintui/
   cd sprintui
   ```

2. **Understanding the Project Structure**
   - `server.js`: Basic project setup in development mode.
   - `public`: All your public files, including a `pages` folder.
   - `build.js`: Script for production build. After running this, `server.js` is not needed, and routes will point to `index.html`.
   - `pages`: Folder within `public` where your SprintUI project files reside.
3. **Remove unnecessary files that we provide: icon.png, version.txt, changelog.md, readme**

## Update Procedure

A new file named `update.js` has been introduced. If you don't have this file already, please follow these steps:

1. Visit the [sprintui](https://github.com/babymonie/sprintui/) and navigate to `update.js`.
2. Copy the raw code of `update.js`.
3. Create a new file named `update.js` in your project.
4. Paste the copied code into the newly created `update.js` file.

If this is your first time, you can skip this step, as the file is in update 1.3 and forward!


## Development Mode

1. Run the server in development mode:
   ```bash
   node server.js
   ```

2. Open your browser and navigate to http://localhost:3000 to start building your SprintUI project.

3. For SprintUI syntax, refer to the files in the `pages` folder. It's a mix of HTML and JavaScript. Get familiar with it before moving to production.

## Production Deployment


1. **Build your project for production:**
   ```bash
   node build.js
   ```

2. Open the `index.html` file located in the `public` folder.

3. Update the script source within the HTML file to point to the newly generated build file:

   ```html
   <script src="app.build.min.js"></script>
   ```

Additionally, for an optimized workflow, it is recommended to use the following commands:

- Use `-at` (autoTransfer) argument for the initial build to automatically transfer the build to the `public` folder and update the script source in `index.html`.

  ```bash
  node build.js -at
  ```

- Use `-t` (transfer) argument for subsequent builds to only transfer the new builds to the `public` folder.

  ```bash
  node build.js -t
  ```

For advanced customization, if you have a file called `pages.sui` (which is assumed to always be present), enhance exclusion settings by adding the following line:

```plaintext
EXCLUDES=TEST,TEST2,etc...
```

To temporarily exclude files during a build, you can utilize the `-ex` or `--exclude` argument:

```bash
node build.js -ex=TEST,TEST2
```

This argument functions similarly to the `EXCLUDES` setting in `pages.sui` but is applied temporarily during the build process.


5. Finally deploying on a server:

### Deploying on Apache Server

If you're deploying on an Apache server, follow these additional steps to ensure the framework works correctly. Create an `.htaccess` file in your project root directory with the provided content.

**Note:** In production, your assets might not load correctly because they are being called from a route called `/assets`, which is not physical. To fix this, create a physical folder and bring all asset files there.

### Deploying with Express Server

If you're using Express for deployment, copy the provided code. Modify the code according to your project structure and ensure that the necessary packages (`express`, `fs`, and `path`) are installed using `npm install express fs path`. Adjust the port number (`3000` in this example) based on your requirements.

# Learning SprintUI (suip)

Now that you have the basics down, let's delve into using SprintUI (suip) within your project. Follow the steps below to make the most of this powerful framework:

## Adding Styles and Scripts

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
     /* Your local scripts here */
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
5. **Hooks**

Hooks in SprintUI can be a complex topic due to its dual nature. There are two types: one that interacts with the real DOM in index.html, and another designed for ease of use.

For instance, the first type includes functions like setTitle, which allows you to change the title of index.html. On the other hand, the second type includes functions like useQuery.

It's important to note that for the second type, there are additional categories, such as imports, useQuery, and more. These elements, including imports, useQuery, and others, should be placed outside the return area and not within any styles or scripts.

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
  
  import states from "sprintui";
   <UseScript>
      addState("name,value") // adds a state
      getState("name")// gets the state by name
      fetchStates()//returns all the states
      removeState("name")// remove a state by name
   </UseScript>
     
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

return (
  <!-- Your JSX here -->
);
```

Congratulations! Your SprintUI project is now ready for the world to see. Simply clone the repository, follow the steps, and showcase your creation to the world. Happy coding!

# Customizing Loading and Not Found Pages

In the present version of suip, there is no built-in support for customizing the loading and not found pages. However, you can still achieve this by navigating to your built file, scrolling to the `app.init` section, and modifying the HTML there. Please be aware that I am actively working on a solution that will be available very soon.

## Note on Custom CSS

As of the current version, there is no provision for custom CSS specifically for loading and not found pages. Therefore, you will need to handle the styling and layout manually within the respective functions.

In future versions, the development team aims to enhance the developer experience by providing additional customization options, including the ability to apply custom CSS to loading and not found pages.

Feel free to experiment and get creative with the design of these pages, and stay tuned for future updates that may introduce more customization features.

# See a Working Example

Check out a working example of SprintUI at [https://sprintui.nggapps.xyz](https://sprintui.nggapps.xyz).

# Changelogs

Go to [changelog.md](https://github.com/babymonie/sprintui/blob/main/changelog.md) to see changelogs.

Stay tuned for the release!

# Help Needed

We are actively seeking assistance from individuals who can contribute to adding support for SprintUI. If you
