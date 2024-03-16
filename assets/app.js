function getCurrentUrl() {
  return window.location.href;
}
function getQueryParams() {
  const queryParams = new URLSearchParams(window.location.search);
  const params = {};
  for (const [key, value] of queryParams) {
    params[key] = value;
  }
  return params;
}
// This function fetches the contents of the page from the server, and parses it to extract the mode and routes.

async function fetchRoutes() {
  let baseUrl = "http://localhost:3000"; // Replace with your server's URL

  try {
    let response = await fetch(`${baseUrl}/pages`, {
      headers: {
        "x-req-from-sprint": "true",
        mode: "cors",
      },
    });

    if (response.ok) {
      let pageContent = await response.text();

      let routes = pageContent.split("ROUTES=")[1];
      routes = routes.split(",");
      routes = routes.map((route) => route.trim());
      routes = routes.filter((route) => route !== "");
      //trim all the routes
      for (let i = 0; i < routes.length; i++) {
    
        if (routes[i].includes("ELL")) {
          routes[i] = routes[i].split("ELL")[0];
        }

        else if (routes[i].includes("NL")) {
          routes[i] = routes[i].split("NL")[0];
        }


        routes[i] = routes[i].trim();

      }

      
      let ell = pageContent.split("\nELL=")[1];
      ell = ell.trim();
  
      if (ell.startsWith("true")) {
        app.enableLongLoading = true;
      }

      let nl = pageContent.split("\nNL=")[1];
      nl = nl.trim();
      
      if (nl.startsWith("true")) {
        app.noLoading = true;
      }

      

 
    
    



      return { routes };
    } else {
      console.error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.error(`Failed to fetch : ${error.message}`);
  }
}
async function fetchPagesToTranspile(routes) {
  const pagesToTranspile = {};

  const baseUrl = "http://localhost:3000"; // Replace with your server's URL

  // Define a function to fetch a single page and store it in the object
  async function fetchPage(route) {
    try {
      const response = await fetch(`${baseUrl}/pages/${route}`, {
        headers: {
          "x-req-from-sprint": "true",
          mode: "cors",
        },
      });

      if (response.ok) {
        const pageContent = await response.text();
        pagesToTranspile[route] = pageContent;
      } else {
        console.error(
          `Failed to fetch ${route}: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(`Failed to fetch ${route}: ${error.message}`);
    }
  }

  const fetchPromises = routes.map((route) => fetchPage(route));

  return Promise.all(fetchPromises)
    .then(() => pagesToTranspile)
    .catch((error) => {
      console.error("Error fetching pages:", error);
      return pagesToTranspile;
    });
}

function getURLParams() {
  const url = window.location.href;
  const urlObject = new URL(url);
  const params = {};
  for (const [key, value] of urlObject.searchParams) {
    params[key] = value;
  }
  return params;
}

function handleScriptLoadError(scriptElement, src) {
  scriptElement.onerror = () => {
    handleScriptError(src);
    // Handle the error as needed
  };
}
function handleScriptError(src) {
  console.error(`Failed to load script: ${src}`);
}
let sprintEvents = [];
const orig = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (...args) {
  sprintEvents.push({
    type: args[0],
    fn: args[1],
    target: this,
    useCapture: args[2],
  });

  return orig.apply(this, args);
};

const app = {
  isLoading: true,
  pages: {}, // Store the transpiled pages
  pageAssets: [],
  hooksLoaded: false,
  assetsLoaded: false,
  notFoundMessage: null,
  loadingMessage: null,
  states: [],
  stylesAdded: new Set(),
  scriptsAdded: new Set(),
  urlParams: {},
  enableLongLoading: false,
  noLoading: false,

  extractCssFileName(line) {
    const importMatch = line.match(/href=['"]([^'"]+)['"]/);
    return importMatch ? importMatch[1] : null;
  },

  extractScriptSrc(line) {
    const srcMatch = line.match(/src=['"]([^'"]+)['"]/);
    return srcMatch ? srcMatch[1] : null;
  },
  transpileAndStorePage(pageKey, pageContent) {
    const transpiledHtml = this.transpilesUIp(pageContent, pageKey);
    //remove first <div and the end </div>
    const html = transpiledHtml;

    this.pages[pageKey] = html;
  },
  async addAssets(pageKey) {
    try{
    // Add a check if assets are already loaded for this page
    if (this.assetsLoaded) {
      return;
    }

    //promise

    const pageAssets = this.pageAssets.find((asset) => asset.page === pageKey);
    if (pageAssets) {
      pageAssets.styles.forEach((style) => {
        if (!this.stylesAdded.has(style.href) && style.href) {
          const linkElement = document.createElement("link");
          linkElement.rel = "stylesheet";
          linkElement.href = style.href;

          if (style.integrity) {
            linkElement.integrity = style.integrity;
          }
          if (style.id) {
            linkElement.id = style.id;
          }
          linkElement.crossOrigin = style.crossorigin;

          linkElement.type = style.type || "text/css";

          linkElement.referrePolicy = style.referrerpolicy;

          document.head.appendChild(linkElement);
          this.stylesAdded.add(style.href);
        } else if (
          !this.stylesAdded.has(style.textContent) &&
          style.textContent
        ) {
          const styleElement = document.createElement("style");
          styleElement.textContent = style.textContent;
          styleElement.type = style.type || "text/css";
          if (style.id) {
            styleElement.id = style.id;
          }
          if (style.id) {
            linkElement.id = style.id;
          }

          document.head.appendChild(styleElement);
          this.stylesAdded.add(style.textContent);
        }
      });

      pageAssets.scripts.forEach((script) => {
        if (!this.scriptsAdded.has(script.src) && script.src) {
          const scriptElement = document.createElement("script");
          scriptElement.src = script.src;
          scriptElement.async = script.async;
          scriptElement.defer = script.defer;
          scriptElement.preload = script.preload;
          if (script.integrity) {
            scriptElement.integrity = script.integrity;
          }
          if (script.id) {
            scriptElement.id = script.id;
          }
          scriptElement.crossOrigin = script.crossorigin;

          scriptElement.type = script.type;

          scriptElement.referrePolicy = script.referrerpolicy;

          handleScriptLoadError(scriptElement, script.src);
          if (script.head) {
            document.head.appendChild(scriptElement);
          } else {
            document.body.appendChild(scriptElement);
          }
          this.scriptsAdded.add(script.src);
        } else if (
          !this.scriptsAdded.has(script.textContent) &&
          script.textContent
        ) {
          const scriptElement = document.createElement("script");
          if (script.autoReady) {
            scriptElement.textContent = `document.addEventListener("sprintReady", () => {${script.textContent}});`;
          } else {
            scriptElement.textContent = script.textContent;
          }

          scriptElement.async = script.async;
          scriptElement.defer = script.defer;
          scriptElement.preload = script.preload;

          scriptElement.type = script.type || "text/javascript";

          if (script.id) {
            scriptElement.id = script.id;
          }
          handleScriptLoadError(scriptElement, script.src);

          if (script.head) {
            document.head.appendChild(scriptElement);
          } else {
            document.body.appendChild(scriptElement);
          }

          this.scriptsAdded.add(script.textContent);
        }
      });
    }
    this.assetsLoaded = true;
  }catch(e){
    console.error(e + " at line " + lines.indexOf(line));
  }
  },

  async removeAssets(pageKey) {
    const pageAssets = this.pageAssets.find((asset) => asset.page === pageKey);

    if (pageAssets) {
      // Reset stylesAdded and scriptsAdded sets for the current page
      this.stylesAdded = new Set();
      this.scriptsAdded = new Set();

      for (let i = 0; i < pageAssets.styles.length; i++) {
        const style = pageAssets.styles[i];

        // Remove by href only when it exists, else remove by textContent
        if (
          style.href &&
          document.querySelector(`link[href="${style.href}"]`)
        ) {
          document.querySelector(`link[href="${style.href}"]`).remove();
        } else if (style.textContent) {
          Array.from(document.head.getElementsByTagName("style")).forEach(
            (s, j) => {
              if (s.textContent === style.textContent) s.remove();
            }
          );
        }
      }

      for (let i = 0; i < pageAssets.scripts.length; i++) {
        const script = pageAssets.scripts[i];

        if (
          script.src &&
          document.querySelector(`script[src="${script.src}"]`)
        ) {
          document.querySelector(`script[src="${script.src}"]`).remove();
        } else if (script.textContent) {
          Array.from(document.getElementsByTagName("script")).forEach(
            (s, j) => {
              if (script.autoReady) {
                //add sprintReady event listene to the script textContent to check if the same
                if (
                  s.textContent ===
                  `document.addEventListener("sprintReady", () => {${script.textContent}});`
                ) {
                  s.remove();
                  for (let k = 0; k < sprintEvents.length; k++) {
                    const event = sprintEvents[k];
                    if (
                      event.type == "sprintReady" &&
                      event.fn.toString() === `() => {${script.textContent}}`
                    ) {
                      document.removeEventListener("sprintReady", event.fn);
                      window.removeEventListener("sprintReady", event.fn);

                      sprintEvents.splice(k, 1);
                    }
                  }
                }
              } else if (s.textContent === script.textContent) {
                s.remove();
              }
            }
          );
        }
      }
      this.assetsLoaded = false;
    }

    
  },

  async addHooks(pageKey) {
    const pageAssets = this.pageAssets.find((asset) => asset.page === pageKey);
    if (pageAssets) {
      pageAssets.hooks.forEach((hook) => {
        if (hook.name === "setBodyClass") {
          const body = document.querySelector("body");
          body.className = hook.textContent;
        }
        if (hook.name === "setRootClass") {
          const html = document.querySelector("#root");

          html.className = hook.textContent;
        }

        if (hook.name === "setHtmlClass") {
          const html = document.querySelector("html");

          html.className = hook.textContent;
        }

        if (hook.name === "setTitle") {
          document.title = hook.textContent;
        }
      });

      this.hooksLoaded = true;
    }
  },

  async removeHooks(pageKey) {
    const pageAssets = this.pageAssets.find((asset) => asset.page === pageKey);

    if (pageAssets) {
      pageAssets.hooks.forEach((hook) => {
        if (hook.name === "setRootClass") {
          const html = document.querySelector("#root");

          html.className = "";
        }
        if (hook.name === "setBodyClass") {
          const body = document.querySelector("body");
          body.className = "";
        }

        if (hook.name === "setHtmlClass") {
          const html = document.querySelector("html");
          html.className = "";
        }

        if (hook.name === "setTitle") {
          document.title = "";
        }
      });

      this.hooksLoaded = false;
    }
  },

  async navigateTo(path) {
    this.isLoading = true;
    let currentPath = getCurrentUrl().split("/")[3] || "home";
    window.history.pushState(null, "", path);

    await this.removeAssets(currentPath);

    await this.removeHooks(currentPath);

    await this.render();
  },

  async render() {
    const url = getCurrentUrl();
    const urlObject = new URL(url);

    let path = urlObject.pathname;

    if (path == "/") {
      path = "home";
    } else {
      path = path.substring(1);
    }

    const rootElement = document.getElementById("root");
    const urlSegments = path.split("/");
    const amountOfSlashes = urlSegments.length - 1;

    let pagePath;

    if (amountOfSlashes >= 1) {
      const pages = Object.keys(this.pages);
      const pageKeys = pages.filter((page) => {
    
    
        let pageSegments = page.split(/\[([^\]]+)\]/g);
        pageSegments = pageSegments.filter(entry => entry.trim() !== '');
        pageSegments.shift();
  
        return pageSegments.length === amountOfSlashes;
      });




 

      

      pagePath = this.pages[pageKeys[0]];
      path = pageKeys[0];


      if (!path) {
        
        if (!this.notFoundMessage) {
          rootElement.innerHTML = `    <h1 style="text-align:center">404 Not Found</h1>
          <p style="text-align:center">The page you are looking for does not exist.</p>
   `;
        } else {
        
          pagePath = this.pages["404"];
          path = "404";
          this.addHooks("404");
          this.addAssets("404");

        }


      }
 

      //get params
      const params = {};
      const pageSegments = path.split(/(!?\[[^\]]+\])/g).filter(Boolean);

      urlSegments.shift();
      pageSegments.shift();
      pageSegments.forEach((segment, index) => {
       
        if (segment.includes("[!") && urlSegments[index] !== segment) {
          const variable = segment.replace(/[\[\]!]/g, "");
      
          if (urlSegments[index] !== variable) {
            
              if (!this.notFoundMessage) {
                rootElement.innerHTML = `    <h1 style="text-align:center">404 Not Found</h1>
                <p style="text-align:center">The page you are looking for does not exist.</p>
         `;
              } else {
                pagePath = this.pages["404"];
                path = "404";
                this.addHooks("404");
                this.addAssets("404");
      
              }
      
      
          
            
          }
        }
        

        if (segment.includes("[")) {
          const urlSegment = urlSegments[index];
          const key = segment.split("=")[0].replace(/[\[\]]/g, "");
          params[key] = urlSegment;
        }


      });

      this.urlParams = params;

   
    
    } else {
      pagePath = this.pages[path];
    
      if (!pagePath) {
        if (!this.notFoundMessage) {
          rootElement.innerHTML = `    <h1 style="text-align:center">404 Not Found</h1>
          <p style="text-align:center">The page you are looking for does not exist.</p>
   `;
        } else {
          pagePath = this.pages["404"];
          path = "404";
        }
      }


    }

    if (this.enableLongLoading && !this.noLoading) 
    {
      
      if (this.pages["loading"]) {
        rootElement.innerHTML = this.pages["loading"];
        this.addHooks("loading");
        this.addAssets("loading");
      } else {
        if (!this.noLoading) {
          rootElement.innerHTML = this.loadingMessage || "Loading...";
        }
        
     
      }
    } else {
      if(!this.noLoading){
        rootElement.innerHTML = this.loadingMessage || "Loading...";
      }


    }



    

 
    const interval = setInterval(async () => {
      if (this.isLoading) {
  
        const { states } = this;
        const { localStorage, sessionStorage } = window;

      
        


        let html = pagePath;



        html = html.replace(/\${(.*?)}/g, function (match, stateName) {
          const stateNameMatch = stateName.match("or")
            ? stateName.split("or")
            : [stateName];
          const name = stateNameMatch[0].trim();
          const type = name.split(".")[0];
          const objectName = name.split(".")[1];

          const getValue = (storage, key) => {
            const value = storage.getItem(key);
            return value ? value : "";
          };

          const defaultValue =
            stateNameMatch[1]?.replace(/['"]+/g, "").trim() || "";

          switch (type) {
            case "s":
              const state = states.find((state) => state.name === objectName);
              return state ? state.value : defaultValue;

            case "l":
              return getValue(localStorage, objectName) || defaultValue;

            case "c":
              const cookieValue = document.cookie.split(`${objectName}=`)[1];
              return cookieValue ? cookieValue.split(";")[0] : defaultValue;

            case "ss":
              return getValue(sessionStorage, objectName) || defaultValue;
            case "u":
              return app.urlParams[objectName] || defaultValue;

            default:
              return "";
          }
        });

        if (this.enableLongLoading && !this.noLoading) {
          this.removeAssets("loading");
          this.removeHooks("loading");
          await this.addHooks(path);
          await this.addAssets(path);
          rootElement.innerHTML = html;
        } else {
          await this.addHooks(path);
          await this.addAssets(path);
          rootElement.innerHTML = html;
        }
        

      



        this.isLoading = false;

        clearInterval(interval);
        const sprintReady = setInterval(async () => {
          if (this.assetsLoaded && this.hooksLoaded) {
            const sprintReadyEvent = new Event("sprintReady");
            document.dispatchEvent(sprintReadyEvent);
            clearInterval(sprintReady);
          }
        }, 500);
      }
    }, 500);
  },

  transpilesUIp(page, pageName) {
    const lines = page.split(/\r?\n/);
    try {
      let html = "";
      let inSUIP = false;
      let sUIPHooks = false;

      let pageAssets = {
        page: pageName,
        scripts: [
          {
            id: "sUIp",
            src: null,
            head: false,
            async: false,
            defer: false,
            preload: false,
            type: "text/javascript",
            textContent: `
            function getUrlParams() {
            
              return app.urlParams;
            }
            function getUrlParam(name) {
              return app.urlParams[name];
            }
            `,
            autoReady: false,
            sprintIgnore: false,
          },
        ],
        styles: [],
        hooks: [],
      };

      for (let line of lines) {
        let match;

        switch (true) {
          case line.includes("useQuery()"):
            //add to textContent
            var variableName = line.split("useQuery(")[0];

            variableName = variableName.replace("=", "");
            variableName = variableName.trim();

            lines.splice(lines.indexOf(line), 1);

            var script = pageAssets.scripts.find(
              (script) => script.id === "sUIp"
            );
            if (!script.textContent.includes("function useQuery()")) {
              script.textContent +=
                variableName + " =" + JSON.stringify(getQueryParams()) + ";";
            }

            break;

          case line.includes("import states from sprintui"):
            var script = pageAssets.scripts.find(
              (script) => script.id === "sUIp"
            );
            if (!script.textContent.includes("function addState()")) {
              script.textContent += `function addState(name,value) {
                  app.states.push({name:name,value:value});
                }
                function fetchStates() {
                  return app.states;
                }

                function setState(name,value) {
                  app.states.forEach((state) => {
                    if (state.name === name) {
                      state.value = value;
                    }
                  });
                }

                function getState(name) {
                  return app.states.find((state) => state.name === name);
                }

                function removeState(name) {
                  app.states = app.states.filter((state) => state.name !== name);
                }
              


                `;
            }

            break;
          case line.includes("import cookies from sprintui"):
            var script = pageAssets.scripts.find(
              (script) => script.id === "sUIp"
            );
            if (!script.textContent.includes("function setCookie()")) {
              script.textContent += `
              function setCookie(name,value,expires) {
                document.cookie = name + "=" + value + ";expires=" + expires;
              }
              function getCookies() {
                return document.cookie;
              }
              function getCookie(name) {
                const cookieValue = document.cookie.split(name + "=")[1];
                return cookieValue ? cookieValue.split(";")[0] : "";
              }

              function removeCookie(name) {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
              }


              `;
            }

            break;
          case line.includes("setBodyClass("):
            //add to textContent
            var variableName = line.split("setBodyClass(")[1];
            variableName = variableName.split(")")[0];
            variableName = variableName.trim();

            //remove " and '
            variableName = variableName.replace(/['"]+/g, "");
            variableName = variableName.trim();
            lines.splice(lines.indexOf(line), 1);

            var hook = pageAssets.hooks.find(
              (hook) => hook.name === "setBodyClass"
            );
            if (hook) {
              hook.textContent += variableName || "";
            } else {
              pageAssets.hooks.push({
                name: "setBodyClass",
                textContent: variableName || "",
              });
            }

            break;
          case line.includes("setTitle("):
            //add to textContent
            var variableName = line.split("setTitle(")[1];
            variableName = variableName.split(")")[0];
            variableName = variableName.trim();

            //remove " and '
            variableName = variableName.replace(/['"]+/g, "");
            variableName = variableName.trim();
            lines.splice(lines.indexOf(line), 1);

            var hook = pageAssets.hooks.find(
              (hook) => hook.name === "setTitle"
            );
            if (hook) {
              hook.textContent += variableName || "";
            } else {
              pageAssets.hooks.push({
                name: "setTitle",
                textContent: variableName || "",
              });
            }

            break;
          case line.includes("setRootClass"):
            //add to textContent
            var variableName = line.split("setRootClass(")[1];
            variableName = variableName.split(")")[0];
            variableName = variableName.trim();

            //remove " and '
            variableName = variableName.replace(/['"]+/g, "");
            variableName = variableName.trim();
            lines.splice(lines.indexOf(line), 1);

            var hook = pageAssets.hooks.find(
              (hook) => hook.name === "setRootClass"
            );
            if (hook) {
              hook.textContent += variableName || "";
            } else {
              pageAssets.hooks.push({
                name: "setRootClass",
                textContent: variableName || "",
              });
            }

            break;
          case line.includes("setHtmlClass"):
            //add to textContent
            var variableName = line.split("setHtmlClass(")[1];
            variableName = variableName.split(")")[0];
            variableName = variableName.trim();

            //remove " and '
            variableName = variableName.replace(/['"]+/g, "");
            variableName = variableName.trim();
            lines.splice(lines.indexOf(line), 1);

            var hook = pageAssets.hooks.find(
              (hook) => hook.name === "setHtmlClass"
            );
            if (hook) {
              hook.textContent += variableName || "";
            } else {
              pageAssets.hooks.push({
                name: "setHtmlClass",
                textContent: variableName || "",
              });
            }

            break;

          case (match = line.match(/<UseStyles[^>]*>/)) !== null:
            const href = this.extractCssFileName(line);

            const id = line.match(/id=['"]([^'"]+)['"]/);
            const integrity = line.match(/integrity=['"]([^'"]+)['"]/);
            const crossorigin = line.match(/crossorigin=['"]([^'"]+)['"]/);
            const type = line.match(/type=['"]([^'"]+)['"]/);
            const referrerpolicy = line.match(
              /referrerpolicy=['"]([^'"]+)['"]/
            );

            const sprintIgnore = line.includes("sprintIgnore={true}");

            if (href) {
              let newStyle = {
                href: href,
                id: id ? id[1] : null,
                integrity: integrity ? integrity[1] : null,
                crossorigin: crossorigin ? crossorigin[1] : null,
                type: type ? type[1] : "text/css",
                referrerpolicy: referrerpolicy ? referrerpolicy[1] : null,
                sprintIgnore: sprintIgnore ? true : false,
              };
              pageAssets.styles.push(newStyle);
            } else {
              // Initialize scriptContent as an empty string
              let styleContent = "";

              // Start from the line following the opening <UseStyles> tag
              let i = lines.indexOf(line) + 1;

              // Loop through lines until the closing </UseStyles> tag is found
              while (i < lines.length && !lines[i].includes("</UseStyles>")) {
                styleContent += lines[i];
                i++;
              }

              if (styleContent) {
                // Check if styleContent is not empty

                let newStyle = {
                  href: null,
                  textContent: styleContent,
                  id: id ? id[1] : null,
                  integrity: integrity ? integrity[1] : null,
                  crossorigin: crossorigin ? crossorigin[1] : null,
                  type: type ? type[1] : "text/css",
                  referrerpolicy: referrerpolicy ? referrerpolicy[1] : null,
                  sprintIgnore: sprintIgnore ? true : false,
                };

                pageAssets.styles.push(newStyle);

                lines.splice(lines.indexOf(line) + 1, i - lines.indexOf(line));
              }
            }
            break;

          case (match = line.match(/<UseScript[^>]*>/)) !== null:
            const src = this.extractScriptSrc(line);

            if (src) {
              const head = line.includes("head={true}");
              const preload = line.includes("preload={true}");
              const async = line.includes("async={true}");
              const defer = line.includes("defer={true}");
              const id = line.match(/id=['"]([^'"]+)['"]/);
              const integrity = line.match(/integrity=['"]([^'"]+)['"]/);
              const crossorigin = line.match(/crossorigin=['"]([^'"]+)['"]/);
              const type = line.match(/type=['"]([^'"]+)['"]/);
              const referrerpolicy = line.match(
                /referrerpolicy=['"]([^'"]+)['"]/
              );
              const sprintIgnore = line.includes("sprintIgnore={true}");

              const newScript = {
                src: src ? src : null,
                head: head ? true : false,
                async: async ? true : false,
                defer: defer ? true : false,
                preload: preload ? true : false,
                id: id ? id[1] : null,
                integrity: integrity ? integrity[1] : null,
                crossorigin: crossorigin ? crossorigin[1] : null,
                type: type ? type[1] : "text/javascript",
                referrerpolicy: referrerpolicy ? referrerpolicy[1] : null,
                sprintIgnore: sprintIgnore ? true : false,
              };

              pageAssets.scripts.push(newScript);
            } else {
              const head = line.includes("head={true}");
              const preload = line.includes("preload={true}");
              const async = line.includes("async={true}");
              const defer = line.includes("defer={true}");
              const type = line.match(/type=['"]([^'"]+)['"]/);

              const autoReady = line.includes("autoReady={false}");
              const sprintIgnore = line.includes("sprintIgnore={true}");
              const bringF = line.includes("bringF={false}");

              // Initialize scriptContent as an empty string

              let scriptContent = "";

              // Start from the line following the opening <UseScript> tag
              let i = lines.indexOf(line) + 1;

              const fAndG = {
                id: "fAndG",
                src: null,
                head: false,
                async: false,
                defer: false,
                preload: false,
                type: type ? type[1] : "text/javascript",

                textContent: scriptContent,
                autoReady: false,
                sprintIgnore: false,
              };
              // Loop through lines until the closing </UseScript> tag is found
              while (i < lines.length && !lines[i].includes("</UseScript>")) {
                //remove white space
                lines[i] = lines[i].trim();

                //check for global
                if (lines[i].includes("global")) {
                  //remove global
                  lines[i] = lines[i].replace("global", "");

                  fAndG.textContent += lines[i];
                  i++;

                  continue;
                }

                if (lines[i].startsWith("//")) {
                  i++;
                  continue;
                }

                scriptContent += lines[i];
                i++;
              }

              if (scriptContent) {
                const newScript = {
                  id: "is" + Math.random(),
                  src: null,
                  head: head ? true : false,
                  async: async ? true : false,
                  defer: defer ? true : false,
                  preload: preload ? true : false,
                  type: type ? type[1] : "text/javascript",

                  textContent: scriptContent,
                  autoReady: autoReady ? false : true,
                  sprintIgnore: sprintIgnore ? true : false,
                };
                pageAssets.scripts.push(newScript);
                pageAssets.scripts.push(fAndG);
                lines.splice(lines.indexOf(line) + 1, i - lines.indexOf(line));
              }
            }
            break;

          case line.includes("<suipMarkup>"):
            inSUIP = true;

            break;

          case line.includes("<suipMarkup>"):
            inSUIP = false;

            break;

          default:
            if (inSUIP) {
              if (line.includes("<Link")) {
                const to = line.match(/to=['"]([^'"]+)['"]/)[1];

                let className = line.match(/className=['"]([^'"]+)['"]/);

                if (className) {
                  className = className[1];
                } else {
                  className = "";
                }

                let id = line.match(/id=['"]([^'"]+)['"]/);

                if (id) {
                  id = id[1];
                } else {
                  id = "";
                }

                //just replace link with a tag so if its incased on any other tag it will be removed
                line = line.replace("<Link", "<a");
                line = line.replace("</Link>", "</a>");

                line = line.replace(
                  `to="${to}"`,
                  `onclick="app.navigateTo('${to}')" title="${to}" id="${id}"`
                );
                line = line.replace(
                  `className="${className}"`,
                  `class="${className}"`
                );

                html += line;
              } else if (line.includes("<HImport")) {
                const fromMatch = line.match(/from=['"]([^'"]+)['"]/);
                if (fromMatch) {
                  const from = fromMatch[1];
                  if (from.includes("https://") || from.includes("http://")) {
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", from, false);
                    xhr.send();
                    if (xhr.status === 200) {
                      line = xhr.responseText;
                      html += line;
                    }
                  } else {
                    const xhr = new XMLHttpRequest();
                    xhr.open(
                      "GET",
                      "http://localhost:3000/comps/" + from,
                      false
                    );
                    xhr.send();
                    if (xhr.status === 200) {
                      line = xhr.responseText;
                      html += line;
                    }
                  }
                }
              } else if (line.includes("<CImport")) {
                const fromMatch = line.match(/from=['"]([^'"]+)['"]/);
                const paramsMatch = line.match(/\{([^{}]+)\}/);
                if (paramsMatch) {
                  const insideBraces = paramsMatch[1].replace(
                    /["'\\\/\[\]\(\)\{\}<>]/g,
                    ""
                  );
                  const keyValuePairs = insideBraces.split(/\s*,\s*/);

                  //make a object of the key value pairs
                  const params = keyValuePairs.map((pair) => {
                    const [key, value] = pair.split("=");
                    return { key, value };
                  });

                  if (fromMatch) {
                    const from = fromMatch[1];
                    if (from.includes("https://") || from.includes("http://")) {
                      const xhr = new XMLHttpRequest();
                      xhr.open("GET", from, false);
                      xhr.send();
                      if (xhr.status === 200) {
                        line = xhr.responseText;

                        for (const param of params) {
                          //remove " and ' from the value and any other special characters
                          line = line.replace(`\${${param.key}}`, param.value);
                        }

                        html += line;
                      }
                    } else {
                      const xhr = new XMLHttpRequest();
                      xhr.open(
                        "GET",
                        "http://localhost:3000/comps/" + from,
                        false
                      );
                      xhr.send();
                      if (xhr.status === 200) {
                        line = xhr.responseText;
                        //replace the params with the actual values line replace ${key} with value from the params
                        for (const param of params) {
                          line = line.replace(`\${${param.key}}`, param.value);
                        }
                        html += line;
                      }
                    }
                  }
                }
              } else {
                html += line;
              }
            } else {
              html += line;
            }
        }
      }

      this.pageAssets.push(pageAssets);


      return html;
    } catch (e) {
      console.error(e + " at line " + lines.indexOf(line));
      return page;
    }
  },

  async init() {
    let fetchedPages = await fetchRoutes();

    let routes = fetchedPages.routes;
    let pagesToTranspile = await fetchPagesToTranspile(routes);

    window.addEventListener("popstate", (event) => {
      if (getCurrentUrl() === event.target.location.href) {
        if (event.target.location.href.includes("#")) {
          return;
        }

        if (event.target.location.href.includes("?")) {
          return;
        }

        this.isLoading = true;
        let currentPath = getCurrentUrl().split("/")[3] || "home";
        this.navigateTo(currentPath);
      }
    });

    if (pagesToTranspile["404"]) {
      this.notFoundMessage = pagesToTranspile["404"];
    }
    if (pagesToTranspile["loading"]) {
      this.loadingMessage = pagesToTranspile["loading"];
    }

    for (const pageKey in pagesToTranspile) {
      if (Object.hasOwn(pagesToTranspile, pageKey)) {
        this.transpileAndStorePage(pageKey, pagesToTranspile[pageKey]);
      }
    }
    const eventSource = new EventSource('/events');
    eventSource.onmessage = function(event) {
      if (event.data === 'reload') {

        window.location.reload();
      }
    };
    this.render();
  },
};

app.init();

