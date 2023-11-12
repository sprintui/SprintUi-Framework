const fs = require("node:fs");
const path = require("node:path");

var UglifyJS = require("uglify-js");
async function fetchRoutes() {
  //read pages.sui
  const pagesSUI = fs.readFileSync("./pages.sui", "utf8");

  let mode = pagesSUI.split("MODE=")[1]
    ? pagesSUI.split("MODE=")[1].split("\n")[0].trim()
    : "pro";

  //extract routes
  let routes = pagesSUI.split("ROUTES=")[1];
  routes = routes.split(",");
  routes = routes.map((route) => route.trim());
  return {
    mode: mode,
    routes: routes,
  };
}

function extractCssFileName(line) {
  const importMatch = line.match(/href=['"]([^'"]+)['"]/);
  return importMatch ? importMatch[1] : null;
}

function extractScriptSrc(line) {
  const srcMatch = line.match(/src=['"]([^'"]+)['"]/);
  return srcMatch ? srcMatch[1] : null;
}
let pageAssets = [];

function transpilesUIp(page, pageName) {
  const lines = page.split(/\r?\n/);
  try {
    let html = "";
    let inSUIP = false;
    let sUIPHooks = false;
    let sUIpScript = false;

    let pageAssetsTOBeAdded = {
      page: pageName,
      scripts: [],
      styles: [],
      hooks: [],
    };

    for (const line of lines) {
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

              textContent: `${variableName} = getQueryParams()`,
            };

            pageAssetsTOBeAdded.scripts.push(newScript);

            sUIpScript = true;
          } else {
            //add to textContent
            let variableName = line.split("useQuery(")[0];

            variableName = variableName.replace("=", "");
            variableName = variableName.trim();

            let script = pageAssets.scripts.find(
              (script) => script.id === "sUIp"
            );
            if (!script.textContent.includes("function useQuery()")) {
              script.textContent += `${variableName} = getQueryParams()`;
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
            pageAssetsTOBeAdded.hooks.push(newHook);

            sUIPHooks = true;
          } else {
            //add to textContent
            let variableName = line.split("setRootClass(")[1];
            variableName = variableName.split(")")[0];
            variableName = variableName.trim();

            //remove " and '
            variableName = variableName.replace(/['"]+/g, "");
            variableName = variableName.trim();

            let hook = pageAssetsTOBeAdded.hooks.find(
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
            pageAssetsTOBeAdded.hooks.push(newHook);

            sUIPHooks = true;
          } else {
            //add to textContent
            let variableName = line.split("setHtmlClass(")[1];
            variableName = variableName.split(")")[0];
            variableName = variableName.trim();

            //remove " and '
            variableName = variableName.replace(/['"]+/g, "");
            variableName = variableName.trim();

            let hook = pageAssetsTOBeAdded.hooks.find(
              (hook) => hook.name === "setHtmlClass"
            );
            hook.textContent += variableName || "";
          }

          break;

        case (match = line.match(/<UseStyles[^>]*>/)) !== null:
          const href = extractCssFileName(line);

          if (href) {
            let newStyle = {
              href: href,
            };
            pageAssetsTOBeAdded.styles.push(newStyle);
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
              };

              pageAssetsTOBeAdded.styles.push(newStyle);

              lines.splice(lines.indexOf(line) + 1, i - lines.indexOf(line));
            }
          }
          break;

        case (match = line.match(/<UseScript[^>]*>/)) !== null:
          const src = extractScriptSrc(line);

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
            };

            pageAssetsTOBeAdded.scripts.push(newScript);
          } else {
            const head = line.includes("head={true}");
            const preload = line.includes("preload={true}");
            const async = line.includes("async={true}");
            const defer = line.includes("defer={true}");
            const type = line.match(/type=['"]([^'"]+)['"]/);
            const id = line.match(/id=['"]([^'"]+)['"]/);

            // Initialize scriptContent as an empty string

            let scriptContent = "";

            // Start from the line following the opening <UseScript> tag
            let i = lines.indexOf(line) + 1;

            // Loop through lines until the closing </UseScript> tag is found
            while (i < lines.length && !lines[i].includes("</UseScript>")) {
              scriptContent += lines[i] + "\n";
              i++;
            }

            if (scriptContent) {
              // Check if scriptContent is not empty

              const newScript = {
                id: "is" + Math.random(),
                src: null,
                head: head ? true : false,
                async: async ? true : false,
                defer: defer ? true : false,
                preload: preload ? true : false,
                type: type ? type[1] : "text/javascript",
                id: id ? id[1] : null,

                textContent: scriptContent,
              };
              pageAssetsTOBeAdded.scripts.push(newScript);

              lines.splice(lines.indexOf(line) + 1, i - lines.indexOf(line));
            }
          }
          break;

        case line.includes("return ("):
          inSUIP = true;

          break;

        case line.includes(");"):
          inSUIP = false;

          break;

        default:
          if (inSUIP) {
            if (line.includes("<Link")) {
              const to = line.match(/to=['"]([^'"]+)['"]/)[1];
              const children = line
                .match(/>[^<]+</)[0]
                .replace(">", "")
                .replace("<", "");
              html += `<a onclick="app.navigateTo('${to}')" title="${to}" style="cursor:pointer;">${children}</a>`;
            } else if (line.includes("<UseImage")) {
              const src = line.match(
                /<UseImage src=['"]([^'"]+)['"]\s*\/?>/
              )[1];
              html += "<img src='" + src + "' />";
            } else {
              html += line;
            }
          } else {
            html += line;
          }
      }
    }

    pageAssets.push(pageAssetsTOBeAdded);

    return html;
  } catch (e) {
    console.error(e);
    return page;
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

let pages = {};

function transpileAndStorePage(pageKey, pageContent) {
  const transpiledHtml = transpilesUIp(pageContent, pageKey);

  //remove first <div and the end </div>
  const html = transpiledHtml;
  pages[pageKey] = html;
}
async function main() {
  let routes = await fetchRoutes();

  let pagesToTranspile = await fetchPagesToTranspile(routes.routes);

  for (const [pageKey, pageContent] of Object.entries(pagesToTranspile)) {
    transpileAndStorePage(pageKey, pageContent);
  }

  let finalScript = ` 
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
  function handleScriptError(src) {
    console.error('Failed to load script:' + src);
  }

  function handleScriptLoadError(scriptElement, src) {
    scriptElement.onerror = () => {
      handleScriptError(src);
      // Handle the error as needed
    };
  }
  
  const app = {
    isLoading: true,
    pages: ${JSON.stringify(pages)},
    pageAssets: ${JSON.stringify(pageAssets)},
    hooksLoaded: false,
    assetsLoaded: false,
    notFoundMessage: null,
    loadingMessage: null,
  
  
  
    async addAssets(pageKey) {
      //promise
      new Promise((resolve, reject) => {
        const pageAssets = this.pageAssets.find(
          (asset) => asset.page === pageKey
        );
        if (pageAssets) {
          pageAssets.styles.forEach((style) => {
            if (style.href) {
              const linkElement = document.createElement("link");
              linkElement.rel = "stylesheet";
              linkElement.href = style.href;
  
              document.head.appendChild(linkElement);
            } else if (style.textContent) {
              const styleElement = document.createElement("style");
  
              styleElement.textContent = style.textContent;
              document.head.appendChild(styleElement);
            }
          });
  
          pageAssets.scripts.forEach((script) => {
            if (script.src) {
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
  
              scriptElement.referrerPolicy = script.referrerpolicy;
  
              handleScriptLoadError(scriptElement, script.src);
              if (script.head) {
                document.head.appendChild(scriptElement);
              } else {
                document.body.appendChild(scriptElement);
              }
            } else if (script.textContent) {
              const scriptElement = document.createElement("script");
              scriptElement.textContent = script.textContent;
  
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
            }
          });
        }
        this.assetsLoaded = true;
        resolve();
      });
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
  
    async removeAssets(pageKey) {
      const pageAssets = this.pageAssets.find((asset) => asset.page === pageKey);
      let scripts = document.querySelectorAll("script");
      let styles = document.querySelectorAll("style");
      if (pageAssets) {
        for (let i = 0; i < pageAssets.styles.length; i++) {
          const style = pageAssets.styles[i];
          if (style.href) {
            const linkElement = document.querySelector(
              'link[href="' + style.href + '"]'
            );
            if (linkElement) {
              linkElement.remove();
            }
          } else if (style.textContent) {
            for (let j = 0; j < styles.length; j++) {
              const s = styles[j];
              if (s.textContent === style.textContent) {
                s.remove();
              }
            }
          }
        }
  
        for (let i = 0; i < pageAssets.scripts.length; i++) {
          const script = pageAssets.scripts[i];
          if (script.src) {
            const scriptElement = document.querySelector(
              'script[src="' + script.src + '"]'
            );
            if (scriptElement) {
              scriptElement.remove();
            }
          } else if (script.textContent) {
            for (let j = 0; j < scripts.length; j++) {
              const s = scripts[j];
              if (s.textContent === script.textContent && script.id !== "suia") {
                s.remove();
              }
            }
          }
        }
  
        this.assetsLoaded = false;
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
      let path = urlObject.pathname.split("/")[1] || "home";
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
  
          rootElement.innerHTML = page;
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
  
    async init(notFoundMessage, loadingMessage) {
      this.notFoundMessage = notFoundMessage;
      this.loadingMessage = loadingMessage;
  
      window.addEventListener("popstate", (event) => {
        if (getCurrentUrl() === event.target.location.href) {
          if (event.target.location.href.includes("#")) {
            return;
          }
          if (event.target.location.href.includes("?")) {
            return;
          }
          this.navigateTo(event.target.location.href);
        }
      });
  
      window.addEventListener("load", () => {
        this.render();
      });
    },
  };
  
  app.init(
    "<div style='display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;'><h1>Not Found</h1></div>",
    "<div style='display:flex;justify-content:center;align-items:center;height:100vh;width:100vw;'> <h1>Loading...</h1></div>"
  
  );
`;
  let minified = UglifyJS.minify(finalScript);

  fs.writeFileSync("app.build.min.js", minified.code);
}

main();
