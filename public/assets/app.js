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

      //extract routes

      let routes = pageContent.split("ROUTES=")[1];
      routes = routes.split(",");
      routes = routes.map((route) => route.trim());
      return {
        routes: routes,
      };
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

  // Wait for all fetches to complete
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
          } else if (!this.stylesAdded.has(style.textContent) && style.textContent) {
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

          }  else if (!this.scriptsAdded.has(script.textContent) && script.textContent) {
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
   
  
  },



  async removeAssets(pageKey) {
    const pageAssets = this.pageAssets.find((asset) => asset.page === pageKey);
    let scripts = document.querySelectorAll("script");
    let styles = document.querySelectorAll("style");
  
    if (pageAssets) {
      for (let i = 0; i < pageAssets.styles.length; i++) {
        const style = pageAssets.styles[i];
  
        if (style.href) {
          const linkElement = document.querySelector(
            `link[href="${style.href}"]`
          );
  
          // Check if other pages are using the same style
          const otherPagesUsingStyle = this.pageAssets.filter(
            (asset) => asset.page !== pageKey && asset.styles.some((s) => s.href === style.href)
          );
  
          if (linkElement && otherPagesUsingStyle.length === 0 && !style.sprintIgnore) {
            linkElement.remove();
          }
        } else if (style.textContent) {
          for (let j = 0; j < styles.length; j++) {
            const s = styles[j];
  
            // Check if other pages are using the same style
            const otherPagesUsingStyle = this.pageAssets.filter(
              (asset) => asset.page !== pageKey && asset.styles.some((s) => s.textContent === style.textContent)
            );
  
            if (s.textContent.includes(style.textContent) && otherPagesUsingStyle.length === 0 && !style.sprintIgnore) {
              s.remove();
            }
          }
        }
      }
  
      for (let i = 0; i < pageAssets.scripts.length; i++) {
        const script = pageAssets.scripts[i];
  
        if (script.src) {
          const scriptElement = document.querySelector(
            `script[src="${script.src}"]`
          );
  
          // Check if other pages are using the same script
          const otherPagesUsingScript = this.pageAssets.filter(
            (asset) => asset.page !== pageKey && asset.scripts.some((s) => s.src === script.src)
          );
  
          if (scriptElement && otherPagesUsingScript.length === 0 && !script.sprintIgnore) {
            scriptElement.remove();
          }
        } else if (script.textContent) {
          for (let j = 0; j < scripts.length; j++) {
            const s = scripts[j];
  
            // Check if other pages are using the same script
            const otherPagesUsingScript = this.pageAssets.filter(
              (asset) => asset.page !== pageKey && asset.scripts.some((s) => s.textContent === script.textContent)
            );
  
            if (
              (s.textContent.includes(script.textContent) || !script.id === "suia") &&
              otherPagesUsingScript.length === 0 && !script.sprintIgnore
            ) {
              s.remove();
            }
          }
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

  navigateTo(path) {
    this.isLoading = true;
    let currentPath = getCurrentUrl().split("/")[3] || "home";
    window.history.pushState(null, "", path);

    this.removeAssets(currentPath);

    this.removeHooks(currentPath);

    this.render();
  },

  async render() {
    const url = getCurrentUrl();
    const urlObject = new URL(url);
    //path will be anything after /home or /about/1
    let path = urlObject.pathname;

    if (path == "/") {
      path = "home";

    }
    else
    {
      path = path.substring(1);

    }


    const page = this.pages[path];
    if (
      document.getElementById("root").innerHTML !== this.loadingMessage ||
      "Loading..."
    ) {
      document.getElementById("root").innerHTML = this.loadingMessage;
    }
    if (!page)
      return (document.getElementById("root").innerHTML =
        this.notFoundMessage || "Not found");

    const interval = setInterval(async () => {
      if (this.isLoading) {
        await this.addHooks(path);
        await this.addAssets(path);
        this.isLoading = false;
        const rootElement = document.getElementById("root");

        let html = page;
        let states = this.states;

        html = html.replace(/\${(.*?)}/g, function (match, stateName) {
          let stateNameMatch = stateName.match("or") ? stateName.split("or") : [stateName];
          let state = states.find((state) => state.name === stateNameMatch[0].trim());
          let defaultValue = stateNameMatch[1].replace(/['"]+/g, "");
          defaultValue = defaultValue.trim();
          return state ? state.value : defaultValue || "";
        });
        
        // If states array is empty, replace any remaining ${} with empty string
        if (states.length === 0) {
          html = html.replace(/\${(.*?)}/g, "");
        }
        
        rootElement.innerHTML = html;
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
      let sUIpScript = false;

      let pageAssets = {
        page: pageName,
        scripts: [],
        styles: [],
        hooks: [],
      };

      for (let line of lines) {
        let match;

        switch (true) {
          case line.includes("useQuery()"):
            if (!sUIpScript) {
              let variableName = line.split("useQuery(")[0];

              variableName = variableName.replace("=", "");
              variableName = variableName.trim();

              let newScript = {
                id: "sUIp",
                src: null,
                head: false,
                async: false,
                defer: false,
                preload: false,

                textContent:
                  variableName + " =" + JSON.stringify(getURLParams()) + ";",
              };

              pageAssets.scripts.push(newScript);

              sUIpScript = true;
            } else {
              //add to textContent
              let variableName = line.split("useQuery(")[0];

              variableName = variableName.replace("=", "");
              variableName = variableName.trim();

              lines.splice(lines.indexOf(line), 1);

              let script = pageAssets.scripts.find(
                (script) => script.id === "sUIp"
              );
              if (!script.textContent.includes("function useQuery()")) {
                script.textContent +=
                  variableName + " =" + JSON.stringify(getQueryParams()) + ";";
              }
            }
            break;
          

          case line.includes("import states"):
            if (!sUIpScript) {
              

              let newScript = {
                id: "sUIp",
                src: null,
                head: false,
                async: false,
                defer: false,
                preload: false,

                textContent: `function addState(name,value) {
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

                `,



              };

              pageAssets.scripts.push(newScript);


            } else {
          
              let script = pageAssets.scripts.find(
                (script) => script.id === "sUIp"
              );
              if (!script.textContent.includes("function addState()")) {
                script.textContent +=  `function addState(name,value) {
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
            } 
            break;
  
          case line.includes("setBodyClass("):
            if (!sUIpScript) {
              //get things in between the parenthesis
              let variableName = line.split("setBodyClass(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();

              let newHook = {
                name: "setBodyClass",
                textContent: variableName || "",
              };
              pageAssets.hooks.push(newHook);

              sUIPHooks = true;
            } else {
              //add to textContent
              let variableName = line.split("setBodyClass(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();
              lines.splice(lines.indexOf(line), 1);

              let hook = pageAssets.hooks.find(
                (hook) => hook.name === "setBodyClass"
              );
              hook.textContent += variableName || "";
            }

            break;
          case line.includes("setTitle("):
            if (!sUIpScript) {
              //get things in between the parenthesis
              let variableName = line.split("setTitle(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();

              let newHook = {
                name: "setTitle",
                textContent: variableName || "",
              };
              pageAssets.hooks.push(newHook);

              sUIPHooks = true;
            } else {
              //add to textContent
              let variableName = line.split("setTitle(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();
              lines.splice(lines.indexOf(line), 1);

              let hook = pageAssets.hooks.find(
                (hook) => hook.name === "setTitle"
              );
              hook.textContent += variableName || "";
            }

            break;
          case line.includes("setRootClass"):
            if (!sUIpScript) {
              //get things in between the parenthesis
              let variableName = line.split("setRootClass(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();

              let newHook = {
                name: "setRootClass",
                textContent: variableName || "",
              };
              pageAssets.hooks.push(newHook);

              sUIPHooks = true;
            } else {
              //add to textContent
              let variableName = line.split("setRootClass(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();
              lines.splice(lines.indexOf(line), 1);

              let hook = pageAssets.hooks.find(
                (hook) => hook.name === "setRootClass"
              );
              hook.textContent += variableName || "";
            }

            break;
          case line.includes("setHtmlClass"):
            if (!sUIpScript) {
              //get things in between the parenthesis
              let variableName = line.split("setHtmlClass(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();

              let newHook = {
                name: "setHtmlClass",
                textContent: variableName || "",
              };
              pageAssets.hooks.push(newHook);

              sUIPHooks = true;
            } else {
              //add to textContent
              let variableName = line.split("setHtmlClass(")[1];
              variableName = variableName.split(")")[0];
              variableName = variableName.trim();

              //remove " and '
              variableName = variableName.replace(/['"]+/g, "");
              variableName = variableName.trim();
              lines.splice(lines.indexOf(line), 1);

              let hook = pageAssets.hooks.find(
                (hook) => hook.name === "setHtmlClass"
              );
              hook.textContent += variableName || "";
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
              )
              ;

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
              }
              // Loop through lines until the closing </UseScript> tag is found
              while (i < lines.length && !lines[i].includes("</UseScript>")) {
        
                  //check for global
                  if (lines[i].includes("global")) {
    
                    //remove global
                    lines[i] = lines[i].replace("global", "");
                  
                    fAndG.textContent += lines[i];
                    i++;
                    continue;
                    
                  }

                  if (lines[i].includes("function")) {
                    if (!bringF) {
                      //search for end of function
                      let functionContent = "";
                      let j = i;
                      while (j < lines.length && !lines[j].includes("}")) {
                        functionContent += lines[j];
                        j++;
                      }
                      functionContent += lines[j];
                      fAndG.textContent += functionContent;
                    
                    }
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

          case line.includes("<suipMarkup>          "):
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
      console.error(e);
      return page;
    }
  },

  async init(notFoundMessage, loadingMessage) {
    this.notFoundMessage = notFoundMessage;
    this.loadingMessage = loadingMessage;
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

         location.href = event.target.location.href;
      }
    });

    // Initialize the application by transpiling and storing pages on load
    for (const pageKey in pagesToTranspile) {
      if (Object.hasOwn(pagesToTranspile, pageKey)) {
        this.transpileAndStorePage(pageKey, pagesToTranspile[pageKey]);
      }
    }

    this.render();
  },
};

app.init(
  `
<div style="display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;">
<h1>Not Found</h1>
</div>
`,
  `
<div style="display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;">
<h1>Loading...</h1>
</div>

`
);
