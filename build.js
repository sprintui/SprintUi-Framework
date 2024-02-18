const fs = require("node:fs");
const program = require("commander");
const path = require("path");
var minify = require("html-minifier").minify;

program

  .option("-ex, --exclude <value>", "Exclude files from the build", "")

  .parse(process.argv);
const options = program.opts();
const Terser = require('terser');
async function fetchRoutes() {
  const pagesPath = path.join(__dirname, "pages");

  let pages = [];

  // list files in directory and loop through
  fs.readdirSync(pagesPath).forEach((file) => {
    const fPath = path.resolve(pagesPath, file);
    const fileStats = { file, path: fPath };
    if (fs.statSync(fPath).isDirectory()) {
      let subPages = fs.readdirSync(fPath);
      subPages = JSON.stringify(subPages);
      subPages = subPages.replace("[", "");
      subPages = subPages.replace("]", "");
      subPages = subPages.replace(/"/g, "");
      subPages = subPages.replace(/,/g, "\n");

      subPages = subPages.split(/\r?\n/);
      subPages.forEach((subPage) => {
        if (subPage.includes(".suip"))
          pages.push(file + "/" + subPage.replace(".suip", ""));
      });
    } else {
      fileStats.type = "file";
      if (fileStats.file.includes(".suip")) {
        pages.push(file.replace(".suip", ""));
      }
    }
  });

  return pages;
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
  if (pageName == "loading") {
    return page;
  }
  const lines = page.split(/\r?\n/);
  try {
    let html = "";
    let inSUIP = false;
    let sUIPHooks = false;

    let pageAssetsTOBeAdded = {
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
        case line.includes("<suipMarkup>"):
          inSUIP = true;

          break;

        case line.includes("</suipMarkup>"):
          inSUIP = false;
          break;
  
        case line.includes("useQuery()"):
         
          
            //add to textContent
            var variableName = line.split("useQuery(")[0];

            variableName = variableName.replace("=", "");
            variableName = variableName.trim();

            var script = pageAssetsTOBeAdded.scripts.find(
              (script) => script.id === "sUIp"
            );
            if (!script.textContent.includes("function useQuery()")) {
              script.textContent += `${variableName} = getQueryParams()`;
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

            var hook = pageAssetsTOBeAdded.hooks.find(
              (hook) => hook.name === "setBodyClass"
            );
            
            if (hook) {
              hook.textContent += variableName || "";
            }
            else
            {
              pageAssetsTOBeAdded.hooks.push({ name: "setBodyClass", textContent: variableName || "" });
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

            var hook = pageAssetsTOBeAdded.hooks.find(
              (hook) => hook.name === "setTitle"
            );
              
            if (hook) {
              hook.textContent += variableName || "";
            }
            else
            {
              pageAssetsTOBeAdded.hooks.push({ name: "setTitle", textContent: variableName || "" });
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

            var hook = pageAssetsTOBeAdded.hooks.find(
              (hook) => hook.name === "setRootClass"
            );
            
            if (hook) {
              hook.textContent += variableName || "";
            }
            else
            {
              pageAssetsTOBeAdded.hooks.push({ name: "setRootClass", textContent: variableName || "" });
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

            var hook = pageAssetsTOBeAdded.hooks.find(
              (hook) => hook.name === "setHtmlClass"
            );
            if (hook) {
              hook.textContent += variableName || "";
            }
            else
            {
              pageAssetsTOBeAdded.hooks.push({ name: "setHtmlClass", textContent: variableName || "" });
            }
          

          break;

        case (match = line.match(/<UseStyles[^>]*>/)) !== null:
          const href = extractCssFileName(line);

          const id = line.match(/id=['"]([^'"]+)['"]/);
          const integrity = line.match(/integrity=['"]([^'"]+)['"]/);
          const crossorigin = line.match(/crossorigin=['"]([^'"]+)['"]/);
          const type = line.match(/type=['"]([^'"]+)['"]/);
          const referrerpolicy = line.match(/referrerpolicy=['"]([^'"]+)['"]/);
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
                id: id ? id[1] : null,
                integrity: integrity ? integrity[1] : null,
                crossorigin: crossorigin ? crossorigin[1] : null,
                type: type ? type[1] : "text/css",
                referrerpolicy: referrerpolicy ? referrerpolicy[1] : null,
                sprintIgnore: sprintIgnore ? true : false,
              };

              pageAssetsTOBeAdded.styles.push(newStyle);

              lines.splice(lines.indexOf(line) + 1, i - lines.indexOf(line));
            }
          }
          break;
        case line.includes("import states from sprintui"):
         
            var script = pageAssetsTOBeAdded.scripts.find(
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
            var script = pageAssetsTOBeAdded.scripts.find(
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

            pageAssetsTOBeAdded.scripts.push(newScript);
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
              //check for global
              if (lines[i].includes("global")) {
                //remove global
                lines[i] = lines[i].replace("global", "");

                fAndG.textContent += lines[i];
                i++;
                continue;
              }

              if (lines[i].includes("//")) {
                lines[i] = lines[i].split("//")[0]; 

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
              pageAssetsTOBeAdded.scripts.push(newScript);
              pageAssetsTOBeAdded.scripts.push(fAndG);
              lines.splice(lines.indexOf(line) + 1, i - lines.indexOf(line));
            }
          }

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
            }
            else if (line.includes("<HImport")) {
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
                
                  }
                  else 
                  {
                    const file = fs.readFileSync(`./comps/${from}.suic`, "utf8");
                    line = file;
                    html += line;
                  }
                  

              }


              


              
            }
            else {
              html += line;
            }
          } else {
            html += line;
          }

          break;
      }
    }

    pageAssets.push(pageAssetsTOBeAdded);

    return html;
  } catch (e) {
    console.error(e);
    return page;
  }
}

function getEXCLUDES() {
  const pagesSUI = fs.readFileSync("./config.sui", "utf8");

  let excludes = pagesSUI.split("EXCLUDES=")[1]
    ? pagesSUI.split("EXCLUDES=")[1].split("\n")[0].trim()
    : "";

  return excludes;
}

async function fetchPagesToTranspile(routes) {
  const pagesToTranspile = {};

  async function fetchPage(route) {
    try {
      if (getEXCLUDES().split(",").includes(route)) {
        console.log("Excluding " + route);
        return;
      } else if (options.exclude) {
        if (options.exclude.split(",").includes(route)) {
          console.log("Excluding " + route);
          return;
        }
      }

      const pageContent = fs.readFileSync(
        `./pages/${route}.suip`,
        "utf8"
      );

      pagesToTranspile[route] = pageContent;
    } catch (error) {
      console.error(`Failed to fetch ${route}: ${error.message}`);
    }
  }

  const fetchPromises = routes.map((route) => fetchPage(route));

  // Wait for all fetches to complete
  return Promise.allSettled(fetchPromises)
    .then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error(`Error fetching page: ${result.reason.message}`);
        }
      });
      return pagesToTranspile;
    })
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
  const minified = minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
  });

  pages[pageKey] = minified;
}
async function main() {
  let routes = await fetchRoutes();

  let pagesToTranspile = await fetchPagesToTranspile(routes);

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
    states:[],
    stylesAdded: new Set(),
    scriptsAdded: new Set(),
    urlParams:{},
    
    async addAssets(pageKey) {
      // Add a check if assets are already loaded for this page
      if (this.assetsLoaded) {
        return;
      }
    
  
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
                scriptElement.textContent = 'document.addEventListener("sprintReady", () => {' + script.textContent + '});';
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
             'link[href="' + style.href + '"]'
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
              'script[src="' + script.src + '"]'
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
      let path = urlObject.pathname;
  
      if (path == "/") {
        path = "home";
  
      }
      else
      {
        path = path.substring(1);
  
      }
  
      const rootElement = document.getElementById("root");
      const urlSegments = path.split("/");
      const amountOfSlashes = urlSegments.length - 1;

      let pagePath;
      
      if (amountOfSlashes >= 1) {
        const pages = Object.keys(this.pages);
        const pageKeys = pages.filter((page) => {
          const pageSegments =page.split(/\\[([^\\]]+)\\]/g);
          pageSegments.shift();

          return pageSegments.length === amountOfSlashes;
        });

        pagePath = this.pages[pageKeys[0]];
        path = pageKeys[0];


        const params = {};
        const pageSegments = path.split(/(!?\\[[^\\]]+\\])/g);
        urlSegments.shift();
        pageSegments.shift();
        pageSegments.forEach((segment, index) => {
          //if any variable has ! in front of it, make sure the url has the same value or return 404 else add to params
          if (segment.includes("[!") && urlSegments[index] !== segment) {
            const variable = segment.replace(/\\[\\]!/g, "");

  
            if (urlSegments[index] !== variable) {
              pagePath = null;
            }
  
          }
  
          if (segment.includes("[")) {
            const urlSegment = urlSegments[index];
            const key = segment.split("=")[0].replace(/\\[\\]/g, "");
            params[key] = urlSegment;
          }
  
  
          
        });

        this.urlParams = params;

        
      } else {
        pagePath = this.pages[path];

      }
      rootElement.innerHTML = this.loadingMessage || "Loading...";
      if (!pagePath) {
        if (!this.notFoundMessage) {
          rootElement.innerHTML = "404";
        } else {
  
          /* eslint-disable no-undef */
          pagePath = this.pages["404"];
          /* eslint-enable no-undef */
          path = "404";
        }
      }
  
      const interval = setInterval(async () => {
        if (this.isLoading) {
          await this.addHooks(path);
          await this.addAssets(path);
    
          
        const { states } = this;
        const { localStorage, sessionStorage } = window;
        
        let html = pagePath;
        
        html = html.replace(/\\$\{(.*?)}/g, function (match, stateName) {
          const stateNameMatch = stateName.match("or") ? stateName.split("or") : [stateName];
          const name = stateNameMatch[0].trim();
          const type = name.split(".")[0];
          const objectName = name.split(".")[1];
        
          const getValue = (storage, key) => {
            const value = storage.getItem(key);
            return value ? value : "";
          };
        
          const defaultValue = stateNameMatch[1]?.replace(/['"]+/g, "").trim() || "";
        
          switch (type) {
            case "s":
              const state = states.find((state) => state.name === objectName);
              return state ? state.value : defaultValue;
        
            case "l":
              return getValue(localStorage, objectName) || defaultValue;
        
            case "c":
              const cookieValue = document.cookie.split(objectName + "=")[1];

              return cookieValue ? cookieValue.split(";")[0] : defaultValue;
        
            case "ss":
              return getValue(sessionStorage, objectName) || defaultValue;

            case "u":
            
              return app.urlParams[objectName] || defaultValue;

            default:
              return "";
          }
        });
        
        
        
          rootElement.innerHTML = html; 
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
    async init(notFoundMessage, loadingMessage) {
      this.notFoundMessage = notFoundMessage;
      this.loadingMessage = loadingMessage;
  `;
  if (pages["404"]) {
    finalScript += `
    this.notFoundMessage = ${JSON.stringify(pages["404"])};
    `;
  }
  if (pages["loading"]) {
    finalScript += `
    this.loadingMessage = ${JSON.stringify(pages["loading"])};
    `;
  }
  finalScript += `

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
          this.removeAssets(currentPath);
          this.removeHooks(currentPath);
          this.render();
        }
      });
      

        this.render();
  
    },
  };
  
  app.init();
`;

  let minified = await Terser.minify(finalScript);

  if (!fs.existsSync("build")) {
    fs.mkdirSync("build");
  }

  if (!fs.existsSync("build/assets")) {
    fs.mkdirSync("build/assets");
  }

  //copy everything in assets except app.js to build2
  fs.readdirSync("assets/").forEach((file) => {
    if (file !== "app.js") {
      fs.copyFileSync(`assets/${file}`, `build/assets/${file}`);
    }
  });

  //copy index.html to build
  fs.copyFileSync("index.html", "./build/index.html");

  //replace   <script src="/assets/app.js" id="suia"></script> with app.build.min.js
  let indexHTML = fs.readFileSync("./build/index.html", "utf8");
  indexHTML = indexHTML.replace(
    '<script src="/assets/app.js" id="suia"></script>',
    '<script src="/assets/app.build.min.js" id="suia"></script>'
  );
  fs.writeFileSync("build/index.html", indexHTML);

  //write app.build.min.js
  fs.writeFileSync("build/assets/app.build.min.js", minified.code);

  //write routes

  // Add these lines at the end of your 'main' function
  console.log("\x1b[32m%s\x1b[0m", "Build Complete");
  console.log("\x1b[36m%s\x1b[0m", "Build Info:");
  console.log(
    "\x1b[36m%s\x1b[0m",
    "Routes Built: " + Object.keys(pages).length
  );
  console.log(
    "\x1b[36m%s\x1b[0m",
    "Built File Size: " + (minified.code.length / 1024).toFixed(2) + " KB"
  );
  console.log(
    "\x1b[36m%s\x1b[0m",
    "Original File Size (app.js + routes): " +
      (
        (fs.readFileSync("./assets/app.js", "utf8").length +
          fs
            .readdirSync("./pages/")
            .reduce(
              (totalSize, routeFile) =>
                totalSize + fs.statSync(`./pages/${routeFile}`).size,
              0
            )) /
        1024
      ).toFixed(2) +
      " KB"
  );

  const originalSize =
    fs.readFileSync("./assets/app.js", "utf8").length +
    fs
      .readdirSync("./pages/")
      .reduce(
        (totalSize, routeFile) =>
          totalSize + fs.statSync(`./pages/${routeFile}`).size,
        0
      );

  console.log(
    "\x1b[36m%s\x1b[0m",
    "Reduction in Size: " +
      (((originalSize - minified.code.length) / originalSize) * 100).toFixed(
        2
      ) +
      "%"
  );

  const sV = 2.1;
  console.log("\x1b[36m%s\x1b[0m", "Version: " + sV);
}

main();
