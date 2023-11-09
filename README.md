# SwiftUI Framework

Welcome to the SwiftUI framework! We're excited to have you on board. Below is a guide to get you started with building and deploying your projects using this framework.

## Getting Started

1. **Clone the Repository**
   ```bash
   git clone [repository_url]
   cd [repository_name]
   ```

2. **Understanding the Project Structure**
   - `server.js`: Basic project setup in development mode.
   - `public`: All your public files, including a `pages` folder.
   - `env`: Configuration file for development mode with port and host settings.
   - `build.js`: Script for production build. After running this, `server.js` is not needed, and routes will point to `index.html`.
   - `pages`: Folder within `public` where your SwiftUI project files reside.
   
## Development Mode

1. Run the server in development mode:
   ```bash
   node server.js
   ```

2. Open your browser and navigate to `http://[host]:[port]` to start building your SwiftUI project.

3. For SwiftUI syntax, refer to the files in the `pages` folder. It's a mix of HTML and JavaScript. Get familiar with it before moving to production.

## Production Deployment

1. **Keep server.js running:**
   During the production build, ensure that `server.js` is still running in the background.

2. Build your project for production:
   ```bash
   node build.js
   ```

3. After the build, you'll find a new file named `app.build.min.js`.

4. Move `app.build.min.js` to the `public` folder.

5. Open `index.html` in the `public` folder and update the script source to the new build file:
   ```html
   <script src="app.build.min.js"></script>
   ```


# Learing SUIP

Now that you have the basics down, let's delve into using SwiftUI (suip) within your project. Follow the steps below to make the most of this powerful framework:

## Adding Styles and Scripts

1. **Linking External Styles and Scripts:**
   ```jsx
   <UseStyles href="https://unpkg.com/aos@2.3.1/dist/aos.css" />
   <UseStyles href="https://fonts.googleapis.com/css2?family=Inter:wght@300;600;900&display=swap" />
   <UseStyles href="https://cdn.jsdelivr.net/npm/daisyui@3.9.1/dist/full.css" />
   <UseScript src="https://cdn.tailwindcss.com" head={true} />
   ```

2. **Setting Local Styles:**
   ```jsx
   <UseStyles>
     font-family: 'Inter', sans-serif;
   </UseStyles>
   ```

3. **Setting HTML and Root Class:**
   ```jsx
   setHtmlClass("bg-gradient-to-r from-[#a6a6a6] to-[#ffffff]");
   setRootClass("h-screen");
   ```

4. **Custom CSS:**
   ```jsx
   <UseStyles>
     *{
       margin: 0;
       padding: 0;
       box-sizing: border-box;
       font-family: 'Inter', sans-serif;
     }
   </UseStyles>
   ```

## Query Handling with suip

1. **Query Handling:**
   ```jsx
   let query = useQuery();
   <UseScript>
     document.addEventListener("swiftReady", function () {
       const queryElement = document.getElementById("query");
       if (queryElement) {
         queryElement.innerHTML = JSON.stringify(query) || "";
       }
     });
   </UseScript>
   ```

   ```jsx
   return (
     <div class="flex items-center justify-center h-screen bg-base-200">
       <!-- Show Query -->
       <div class="card shadow-lg compact side bg-base-100">
         <div class="card-body">
           <div class="justify-center card-title">Query</div>
           <div id="query" class="justify-center card-title"></div>
         </div>
       </div>
       <Link to="/" class="btn btn-primary">Home</Link>
     </div>
   );
   ```

## suip Ready Event

1. **Handling suip Ready Event:**
   ```jsx
   <UseScript head={false}>
     document.addEventListener("swiftReady", function() {
       // Swift is ready to use, do your stuff here
     });
   </UseScript>
   ```

## AOS Animation Integration

1. **AOS Animation Setup:**
   ```jsx
   <UseStyles href="https://unpkg.com/aos@2.3.1/dist/aos.css" head={true} />
   <UseScript src="https://unpkg.com/aos@2.3.1/dist/aos.js" head={true} />
   ```

   ```jsx
   <UseScript head={false}>
     document.addEventListener("swiftReady", function() {
       AOS.init();
     });
   </UseScript>
   ```

## SwiftUI Page Structure

Now, let's structure your SwiftUI page, keeping in mind the script execution order:

```jsx
<UseStyles>
  /* Put your CSS here */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Roboto', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #333;
    background: #f4f4f4;
  }

  .container {
    /* Your container styles */
  }

  /* Additional Styles */
</UseStyles>

<UseScript head={false}>
  document.addEventListener("swiftReady", function() {
    // Swift is ready to use, do your stuff here
  });
</UseScript>

return (
  <div class="container">
    <div class="row">
      <div class="col-12">
        <h1 class="tc">Swift UI</h1>
        <!-- Content Here -->
        <a href="https://github.com/babymonie/swiftui" class="btn btn-primary">Documentation</a>
      </div>
    </div>
  </div>
);

```

Congratulations! Your SwiftUI project is now ready for the world to see. Simply clone the repository, follow the steps, and showcase your creation to the world. Happy coding!

# Customizing Loading and Not Found Pages

In the current version of suip, customization of the loading and not found pages involves making changes directly in the app file. Follow the steps below to customize these pages according to your preferences:

## Loading Page Customization

1. Open the `app.js` file.

2. Scroll down to the `app.init` section.

3. Find the first initialization for the loading page, it might look something like this:
   ```jsx
  app.init(
  here is the not found content
  `
<div style="display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;">
<h1>Loading...</h1>
</div>

`
);

   ```

4. Customize the content within the loading function to suit your design and preferences.

## Not Found Page Customization

1. Still in the `app.js` file.

2. Scroll down further to the second `app.init` section.

3. Locate the initialization for the not found page:
   ```jsx
   app.init(
  `
<div style="display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;">
<h1>Not Found</h1>
</div>
`,

loading content

);

   ```

4. Customize the content within the not found function to create a personalized not found page.

## Note on Custom CSS

As of the current version, there is no provision for custom CSS specifically for loading and not found pages. Therefore, you will need to handle the styling and layout manually within the respective functions.

In future versions, the development team aims to enhance the developer experience by providing additional customization options, including the ability to apply custom CSS to loading and not found pages.

Feel free to experiment and get creative with the design of these pages, and stay tuned for future updates that may introduce more customization features.

