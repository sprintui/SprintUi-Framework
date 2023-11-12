
# Sprint UI Framework

![Sprint UI Logo](https://raw.githubusercontent.com/babymonie/sprintui/main/logo.png) - V1

Welcome to the SprintUI framework! We're excited to have you on board. Below is a guide to get you started with building and deploying your projects using this framework.

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

## Development Mode

1. Run the server in development mode:
   ```bash
   node server.js
   ```

2. Open your browser and navigate to `http://[host]:[port]` to start building your SprintUI project.

3. For SprintUI syntax, refer to the files in the `pages` folder. It's a mix of HTML and JavaScript. Get familiar with it before moving to production.

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

3. **Setting HTML and Root Class:**
   ```jsx
   setHtmlClass("bg-gradient-to-r from-[#a6a6a6] to-[#ffffff]");
   setRootClass("h-screen");
   ```

4. **Custom CSS:**
   ```jsx
   <UseStyles>
     /* Your custom CSS here */
   </UseStyles>
   ```

## Query Handling with suip

1. **Query Handling:**
   ```jsx
   let query = useQuery();
   <UseScript>
     document.addEventListener("sprintReady", function () {
       const queryElement = document.getElementById("query");
       if (queryElement) {
         queryElement.innerHTML = JSON.stringify(query) || "";
       }
     });
   </UseScript>
   ```

   ```jsx
   return (
     <!-- Your JSX here -->
   );
   ```

## suip Ready Event

1. **Handling suip Ready Event:**
   ```jsx
   <UseScript head={false}>
     document.addEventListener("sprintReady", function() {
       // Sprint is ready to use, do your stuff here
     });
   </UseScript>
   ```

## SprintUI Page Structure

```jsx
<UseStyles>
  /* Put your CSS here */
</UseStyles>

<UseScript head={false}>
  document.addEventListener("sprintReady", function() {
    // Sprint is ready to use, do your stuff here
  });
</UseScript>

return (
  <!-- Your JSX here -->
);
```

Congratulations! Your SprintUI project is now ready for the world to see. Simply clone the repository, follow the steps, and showcase your creation to the world. Happy coding!

# Customizing Loading and Not Found Pages

In the current version of suip, customization of the loading and not found pages involves making changes directly in the `app.js` file.

1. Open `app.js` and scroll down to the second `app.init` section.

2. Edit the loading and not found pages to your liking.

## Note on Custom CSS

As of the current version, there is no provision for custom CSS specifically for loading and not found pages. Therefore, you will need to handle the styling and layout manually within the respective functions.

In future versions, the development team aims to enhance the developer experience by providing additional customization options, including the ability to apply custom CSS to loading and not found pages.

Feel free to experiment and get creative with the design of these pages, and stay tuned for future updates that may introduce more customization features.

# Help Needed

We are actively seeking assistance from individuals who can contribute to adding support for SprintUI. If you have the skills and interest in improving the developer experience with SprintUI, please get in touch with us. Your collaboration will be highly valued.

