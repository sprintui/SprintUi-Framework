const express = require("express");
const https = require("https");
const app = express();
const port = 3000;
const fs = require("node:fs");
const path = require("path");
var minify = require("html-minifier").minify;
const {fetch} = require("node-fetch");
const Terser = require("terser");
const EventEmitter = require("events");
const eventEmitter = new EventEmitter();
let clients = [];
var mime = require("mime-types");
const versionFileURL =
  "https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/.v";
const sV = fs.readFileSync(".v", "utf8");
console.log(sV);
const sass = require("sass");

function getVersion(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to get version. Status code: ${response.statusCode}`
            )
          );
          return;
        }

        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(data.trim()); // Trim to remove leading/trailing whitespaces
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}
const cors = require("cors");

app.use(cors());

//check if config file exists
if (!fs.existsSync(path.join(__dirname, "config.sui"))) {
  //create config file
  fs.writeFileSync(
    path.join(__dirname, "config.sui"),
    "EXCLUDES="
  );
}

//check if config file exists
if (!fs.existsSync(path.join(__dirname, "plugins"))) {
  //create config file
  fs.mkdirSync(path.join(__dirname, "plugins"));
}

//check if config file exists
if (!fs.existsSync(path.join(__dirname, "comps"))) {
  //create config file
  fs.mkdirSync(path.join(__dirname, "comps"));
}

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

let importedComponents = {};

function extractCssFileName(line) {
  const importMatch = line.match(/href=['"]([^'"]+)['"]/);
  return importMatch ? importMatch[1] : null;
}

function extractScriptSrc(line) {
  const srcMatch = line.match(/src=['"]([^'"]+)['"]/);
  return srcMatch ? srcMatch[1] : null;
}
let pageAssets = [];

async function transpilesUIp(page, pageName) {
  


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
          if (hook && hook.name.includes("setBodyClass")) {
            hook.textContent += variableName || "";
          } else {
            pageAssetsTOBeAdded.hooks.push({
              name: "setBodyClass",
              textContent: variableName,
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

          var hook = pageAssetsTOBeAdded.hooks.find(
            (hook) => hook.name === "setTitle"
          );

          if (hook && hook.name.includes("setTitle")) {
            hook.textContent += variableName || "";
          } else {
            pageAssetsTOBeAdded.hooks.push({
              name: "setTitle",
              textContent: variableName,
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

          var hook = pageAssetsTOBeAdded.hooks.find(
            (hook) => hook.name === "setRootClass"
          );
          if (hook && hook.name.includes("setRootClass")) {
            hook.textContent += variableName || "";
          } else {
            pageAssetsTOBeAdded.hooks.push({
              name: "setRootClass",
              textContent: variableName,
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

          var hook = pageAssetsTOBeAdded.hooks.find(
            (hook) => hook.name === "setHtmlClass"
          );
          if (hook && hook.name.includes("setHtmlClass")) {
            hook.textContent += variableName || "";
          } else {
            pageAssetsTOBeAdded.hooks.push({
              name: "setHtmlClass",
              textContent: variableName,
            });
          }
          break;

        case (match = line.match(/<UseStyles[^>]*>/)) !== null:
          let href = extractCssFileName(line);
          if (href && (href.includes(".scss") || href.includes(".sass"))) {
          
            href = href.replace(".scss", ".min.css");
            href = href.replace(".sass", ".min.css");
          }
          else if (href && ( href.includes(".css"))) {

            if (href.includes("http://") || href.includes("https://")) {
              //do nothing
            } else {
              href = href.replace(".css", ".min.css");
            }

          }
      


          


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
        case line.includes("include states"):
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
        case line.includes("include cookies"):
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

              if (lines[i].startsWith("//")) {
                i++;
                continue;
              } else if (lines[i].includes("//")) {
                //remove comments
                lines[i] = lines[i].split("//")[0];
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

          case line.includes("use component"):
            let promises = [];
            if (!importedComponents[pageName]) {
              importedComponents[pageName] = {};
            }
           
            // Format component name from 'url' or component * from 'url'
            let componentName = line.split("component")[1];
            componentName = componentName.split("from")[0].trim().replace(/['"]+/g, "").trim();
            let componentUrl = line.split("from");
          
            if (componentUrl.length > 1) {
              componentUrl = componentUrl[1].trim().replace(/['"]+/g, "").trim();
          
              if (componentName == "*") {
                promises.push(
                  fetch(componentUrl)
                    .then((response) => response.text())
                    .then((data) => {
                      const lines = data.split(/\r?\n/);
                      lines.forEach((line) => {
                        let name = line.split("=")[0].trim();
                        let urlToComp = line.split("=")[1]?.trim();
          
                        if (name && urlToComp) {
                          importedComponents[pageName][name] = urlToComp;
                        }
                      });
                    })
                ); 
                lines.splice(lines.indexOf(line), 1);
              } else {
                importedComponents[pageName][componentName] = componentUrl;
                lines.splice(lines.indexOf(line), 1);
            
              }
            } else {
              if (componentName == "*") {
                promises.push(new Promise((resolve, reject) => {
                  fs.readdir("comps", (err, files) => {
                    if (err) {
                      console.error('Error reading comps folder:', err);
                      reject(err);
                    } else {
                      files.forEach((file) => {
                        const componentName = file.split(".")[0];
                        importedComponents[pageName][componentName] = `./comps/${file}`;
                      });
                      resolve();
                    }
                  });

                }));

                lines.splice(lines.indexOf(line), 1);
           
               
              } else if (componentName != "") {
                componentUrl = componentName;
              } else {
                throw new Error("Component name is required");
              }
            }

            await Promise.all(promises);
           
     
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
          
              
              let tag = line.match(/<([^<>]+)>/);

          
           
              if (tag) {
                tag = tag[1];

                if (tag.includes("{")) {
                  tag = tag.replace(/\{([^{}]+)\}/g, "");
                  tag = tag.replace(/\s/g, "");
                  tag = tag.replace(/\//g, "");
                } else {
                  tag = tag.replace(/\s/g, "");
                  tag = tag.replace(/\//g, "");
                }

          
       


        
                let component = importedComponents[pageName];

      
                if (component && component[tag]) {
                  component = component[tag];
                  lines.splice(lines.indexOf(line), 1);

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

                    if (component.includes("https://") || component.includes("http://")) {
                      let componentHtml = "";
                      try {
                        const response = await fetch(component);
                        if (response.ok) {
                          const line = await response.text();
                          for (const param of params) {
                            //remove " and ' from the value and any other special characters
                            line = line.replace(`\${${param.key}}`, param.value);
                          }
                          componentHtml += line;
                          
                          html += await transpileComp(componentHtml);
                        }
                      } catch (error) {
                        console.error("Error fetching component:", error);
                      }
                    } else {
              

                      const componentHtml = fs.readFileSync(component, 'utf8');
                      let processedComponentHtml = componentHtml;
                      
                      // Replace params with their values
                      for (const param of params) {
                        processedComponentHtml = processedComponentHtml.replace(
                          `\${${param.key}}`,
                          param.value
                        );

                      }
                    
                      html += await transpileComp(processedComponentHtml);
                    }
                    
                  }
                  else{
                    if (
                      component.includes("https://") ||
                      component.includes("http://")
                    ) {
                       let componentHtml = "";
                      try {
                        const response = await fetch(component);
                        if (response.ok) {
                          const line = await response.text();
                          for (const param of params) {
                            //remove " and ' from the value and any other special characters
                            line = line.replace(`\${${param.key}}`, param.value);
                          }
                          componentHtml += line;
                          html +=await transpileComp(componentHtml);
                        }
                      } catch (error) {
                        console.error("Error fetching component:", error);
                      }

                    } else {
                      const componentHtml = fs.readFileSync(filePath, 'utf8');
                  
                      html += await transpileComp(componentHtml);


                    }
                  }
                } else {
                  html += line;
                }
          
              }
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
async function transpileComp(page) {
  const lines = page.split(/\r?\n/);
  try {
    let html = "";
    let inSUIP = false;
    let sUIPHooks = false;

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

        case line.includes("<Link"):
          let to = line.match(/to=['"]([^'"]+)['"]/);
          if (to) {
            to = to[1];
          } else {
        
            throw new Error("to attribute is required");
          }

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
            
                
                let tag = line.match(/<([^<>]+)>/);
  
            
             
                if (tag) {
                  tag = tag[1];
  
                  if (tag.includes("{")) {
                    tag = tag.replace(/\{([^{}]+)\}/g, "");
                    tag = tag.replace(/\s/g, "");
                    tag = tag.replace(/\//g, "");
                  } else {
                    tag = tag.replace(/\s/g, "");
                    tag = tag.replace(/\//g, "");
                  }
  
            
                  console.log(importedComponents[pageName]);
          
                  let component = importedComponents[pageName];
  
        
                  if (component && component[tag]) {
                    component = component[tag];
                    lines.splice(lines.indexOf(line), 1);
  
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
  
                      if (component.includes("https://") || component.includes("http://")) {
                        let componentHtml = "";
                        try {
                          const response = await fetch(component);
                          if (response.ok) {
                            const line = await response.text();
                            for (const param of params) {
                              //remove " and ' from the value and any other special characters
                              line = line.replace(`\${${param.key}}`, param.value);
                            }
                            componentHtml += line;
                            
                            html += await transpileComp(componentHtml);
                          }
                        } catch (error) {
                          console.error("Error fetching component:", error);
                        }
                      } else {
                
  
                        const componentHtml = fs.readFileSync(component, 'utf8');
                        let processedComponentHtml = componentHtml;
                        
                        // Replace params with their values
                        for (const param of params) {
                          processedComponentHtml = processedComponentHtml.replace(
                            `\${${param.key}}`,
                            param.value
                          );
  
                        }
                      
                        html += await transpileComp(processedComponentHtml);
                      }
                      
                    }
                    else{
                      if (
                        component.includes("https://") ||
                        component.includes("http://")
                      ) {
                         let componentHtml = "";
                        try {
                          const response = await fetch(component);
                          if (response.ok) {
                            const line = await response.text();
                            for (const param of params) {
                              //remove " and ' from the value and any other special characters
                              line = line.replace(`\${${param.key}}`, param.value);
                            }
                            componentHtml += line;
                            html += await transpileComp(componentHtml);
                          }
                        } catch (error) {
                          console.error("Error fetching component:", error);
                        }
  
                      } else {
                        const componentHtml = fs.readFileSync(filePath, 'utf8');
                    
                        html += await transpileComp(componentHtml);
  
  
                      }
                    }
                  } else {
                    html += line;
                  }
            
                }
              } 
            
            } else {
              html += line;
            }
        
      }
    }

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
      }

      const pageContent = fs.readFileSync(`./pages/${route}.suip`, "utf8");
      route = route.trim();

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

async function transpileAndStorePage(pageKey, pageContent) {

  const transpiledHtml = await transpilesUIp(pageContent, pageKey);

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

async function notifyClients() {
  let startTime = Date.now();
  let routes = await fetchRoutes();

  let pagesToTranspile = await fetchPagesToTranspile(routes);
  let transpilePromises = [];

  for (const [pageKey, pageContent] of Object.entries(pagesToTranspile)) {
    transpilePromises.push(transpileAndStorePage(pageKey, pageContent));
  }

  // Wait for all transpilation promises to resolve
  await Promise.all(transpilePromises);
  
 
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
  let sprintEvents =[];
const orig = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(...args) {
 
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
    pages: ${JSON.stringify(pages)},
    pageAssets: ${JSON.stringify(pageAssets)},
    hooksLoaded: false,
    assetsLoaded: false,
    notFoundMessage: null,
    states:[],
    stylesAdded: new Set(),
    scriptsAdded: new Set(),
    urlParams:{},
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
              scriptElement.textContent = 'document.addEventListener("sprintReady", () => {'+ script.textContent+ '});';
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
            document.querySelector('link[href="' + CSS.escape(style.href)+ '"]')
          ) {
            document.querySelector('link[href="' + style.href + '"]').remove();
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
            document.querySelector('script[src="' + script.src.replace(/"/g, '\\\"') + '"]')
          ) {
            document.querySelector('script[src="' + script.src.replace(/"/g, '\\\"') + '"]').remove();
          }
           else if (script.textContent) {
            Array.from(document.getElementsByTagName("script")).forEach(
              (s, j) => {
                if (script.autoReady) {
                  //add sprintReady event listene to the script textContent to check if the same
                  if (
                    s.textContent ===
                    'document.addEventListener("sprintReady", () => {' +
                      script.textContent +
                      "});"
                     

                  ) {
                    s.remove();
                    for (let k = 0; k < sprintEvents.length; k++) {
                      const event = sprintEvents[k];
                      if (
                        event.type == "sprintReady" &&
                        event.fn.toString() === '() => {' + script.textContent + '}'

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
  
      await this.render(currentPath);
    },
    async renderString(inputString) {
      let html = "";
      const renderDataRegex = /<render[dataData]+\\s+data=['"]([^'"]+)['"]>(.*?)<\\/render[dataData]+>/gi;

      let match;
      const processedData = new Set();
      while ((match = renderDataRegex.exec(inputString)) !== null) {
        const data = match[1];
        const template = match[2];
        if (processedData.has(data)) {
          continue; // Skip processing if already processed
        }
    
        let dataType = data.split(".")[0];
    
        const getValue = (storage, key) => {
          switch (storage) {
            case "s":
              const state = this.states.find((state) => state.name === key);
              return state;
    
            case "l":
              let value = localStorage.getItem(key);
              return value ? value : "";
    
            case "c":
              const cookieValue = document.cookie.split(key + "=")[1];
              return cookieValue ? cookieValue.split(";")[0] : "";
    
            case "ss":
              return sessionStorage.getItem(key) || "";
            case "u":
              return this.urlParams[key] || "";
    
            default:
              return "";
          }
        };
        let value = getValue(dataType, data.split(".")[1]);
        if(value === "" || value === null || value === undefined){
          value = "{}";
        } 

        let dataValue = JSON.parse(value);
    
        if (dataValue && dataValue instanceof Object) {
          let renderedData = "";
          let genAmount = 0;
    
          for (const key in dataValue) {
            let data = dataValue[key];
    
            let newTemplate = template.split(/\\r?\\n/).map((line) => {
              let newLine = line;
    
              const matches = newLine.match(/{(.*?)}/g);
    
              if (matches) {
                for (const match of matches) {
                  let key = match.replace(/{|}/g, "");
    
                  if (key == "index") newLine = newLine.replace(match, genAmount);
                  else newLine = newLine.replace(match, data[key] || "");
                }
              }
    
              return newLine;
            });
    
            renderedData += newTemplate.join("\\n");
            genAmount++;
          }
    
          html += renderedData;
        }
    
        processedData.add(data);
      }
    
      return inputString.replace(renderDataRegex, html);
    },
    async updateDOM(oldHtml, newHtml) {
      // Parse the old and new HTML strings into DOM elements
      const parser = new DOMParser();
      const oldDoc = parser.parseFromString(oldHtml, 'text/html');
      const newDoc = parser.parseFromString(newHtml, 'text/html');
  
      // Get the root elements
      const oldRoot = oldDoc.body;
      const newRoot = newDoc.body;
  
      // Helper function to recursively update the DOM
      const updateElements = (oldEl, newEl) => {
          // Update or add new children
          const newChildren = Array.from(newEl.childNodes);
          newChildren.forEach((newChild, index) => {
              const oldChild = oldEl.childNodes[index];
              if (oldChild) {
                  if (newChild.nodeType === Node.ELEMENT_NODE && oldChild.nodeType === Node.ELEMENT_NODE) {
                      // Update attributes and recursive call for children
                      updateElements(oldChild, newChild);
                  } else if (newChild.nodeType !== Node.ELEMENT_NODE || oldChild.nodeType !== Node.ELEMENT_NODE || newChild.nodeName !== oldChild.nodeName) {
                      // Replace if node types or names differ
                      oldEl.replaceChild(newChild, oldChild);
                  }
              } else {
                  // Append new child
                  oldEl.appendChild(newChild);
              }
          });
  
          // Remove any extra old children
          while (oldEl.childNodes.length > newChildren.length) {
              oldEl.removeChild(oldEl.lastChild);
          }
  
          // Update element attributes
          if (oldEl.nodeType === Node.ELEMENT_NODE && newEl.nodeType === Node.ELEMENT_NODE) {
              const oldAttributes = Array.from(oldEl.attributes);
              const newAttributes = Array.from(newEl.attributes);
  
              // Remove old attributes not present in new element
              oldAttributes.forEach(attr => {
                  if (!newEl.hasAttribute(attr.name)) {
                      oldEl.removeAttribute(attr.name);
                  }
              });
  
              // Add/update attributes from new element
              newAttributes.forEach(attr => {
                  if (oldEl.getAttribute(attr.name) !== attr.value) {
                      oldEl.setAttribute(attr.name, attr.value);
                  }
              });
          }
      };
  
      // Start the recursive updating process from the root elements
      updateElements(oldRoot, newRoot);
  
      // Replace the old root element's inner HTML with the updated HTML
      const rootElement = document.getElementById("root");
      rootElement.innerHTML = oldRoot.innerHTML;
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
      
      
          let pageSegments = page.split(/(!?\\[[^\\]]+\\])/g);
          pageSegments = pageSegments.filter(entry => entry.trim() !== '');
          pageSegments.shift();
    
          return pageSegments.length === amountOfSlashes;
        });
  
  
  
  
   
  
        
  
        pagePath = await this.pages[pageKeys[0]];
      path = pageKeys[0];

  
        if (!path) {
          if (!this.notFoundMessage) {
            rootElement.innerHTML = '<h1 style="text-align:center">404 Not Found</h1><p style="text-align:center">The page you are looking for does not exist.</p>';
            return;
          } else {
            pagePath = this.pages["404"];
            path = "404";
            this.addHooks("404");
            this.addAssets("404");
          }
        }
  
  

   
  
        //get params
        const params = {};
        let pageSegments = path.split(/(!?\\[[^\\]]+\\])/g);
  
        
      urlSegments.shift();
      pageSegments.shift();
      pageSegments.forEach(async (segment, index) => {
        if (segment.includes("[!") && urlSegments[index] !== segment) {
            const variable = segment.replace(/\\[\\]!/g, "");
        
            if (urlSegments[index] !== variable) {
              
                if (!this.notFoundMessage) {
                  rootElement.innerHTML = '<h1 style="text-align:center">404 Not Found</h1> <p style="text-align:center">The page you are looking for does not exist.</p>';
                  return;
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
            const key = segment.split("=")[0].replace(/\\[\\]/g, "");
            params[key] = urlSegment;
          }
  
  
        });
  
        this.urlParams = params;
  
     
      
      } else {
        pagePath = this.pages[path];
      
        if (!this.pages[path]) {
          if (!this.notFoundMessage) {
            rootElement.innerHTML ='<h1 style="text-align:center">404 Not Found</h1><p style="text-align:center">The page you are looking for does not exist.</p>';
            return;
          } else {
            pagePath = this.pages["404"];
            path = "404";
            this.addHooks("404");
            this.addAssets("404");

          }
        }
  
  
      }
  
  
  
   
     
    if (this.isLoading) {
      const { states } = this;
      const { localStorage, sessionStorage } = window;

      let html = await pagePath;
        

  
        
      
  
  
          html = html.replace(/\\$\\{(.*?)}/g, function (match, stateName) {
            const stateNameMatch = stateName.match("or")
            ? stateName.split("or")
            : [stateName];
          
          if (stateNameMatch && stateNameMatch.length > 1) {
            throw new Error("Invalid state name");
          }
  
          const name = stateNameMatch[0].split(".")[1].trim();
  
          const type = stateNameMatch[0].split(".")[0].trim().charAt(0);
  
          const getValue = async (storage, key) => {
            const value = await storage.getItem(key);
            return value ? value : "";
          };
  
          const defaultValue = stateNameMatch[1]?.replace(/['"]+/g, "").trim() || "";
  
            switch (type) {
                case "s":
                
                    const state = states.find((state) => state.name === name);
                    return state ? state.value : defaultValue;
  
                case "l":{
                    let value =  getValue(localStorage, name.split(".")[1]);
                    return value ? value : defaultValue;
                }
  
                case "c":
                    const cookieValue =document.cookie.split(name + "=")[1];
                    return cookieValue ? cookieValue.split(";")[0] : defaultValue;
  
                case "ss":
                  {
                    let value =  getValue(sessionStorage, name);
                    return value !== "" ? value : defaultValue;
                  }
  
                case "u":{
  
        
               
                    let value =  app.urlParams[name];
                    return value ? value : defaultValue;
                }
  
                default:
                    return "";
            }
        });

      
        html = await this.renderString(html);
        await this.removeAssets(path);
        await this.removeHooks(path);
  
      
        await Promise.all([this.addHooks(path), this.addAssets(path)]);
        if (this.pages[path]) {
      
       
            await this.updateDOM(rootElement, await html);
        
        }
        else{
          rootElement.innerHTML = await html;
  
        }
  
        this.isLoading = false;
        
        const sprintReady = async () => {
          if (this.assetsLoaded && this.hooksLoaded) {
            const sprintReadyEvent = new Event("sprintReady");
            document.dispatchEvent(sprintReadyEvent);
          } else {
            setTimeout(sprintReady, 100);
          }
        };
  
        await sprintReady();
        
    }
  },
  
    async init(notFoundMessage) {
      this.notFoundMessage = notFoundMessage;
  `;
  if (pages["404"]) {
    finalScript += `
    this.notFoundMessage = ${JSON.stringify(pages["404"])};
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
          this.navigateTo(currentPath);
        }
      });
      

        this.render();
  
    },
  };
  
  app.init();
`;


 
   let minified = await Terser.minify(finalScript);
   fs.writeFileSync("assets/app.js", minified.code);

   console.log("Reloaded in " + (Date.now() - startTime) + "ms");
  
  clients.forEach(async (client) => {
    console.log("Reloading client...");
    client.write("data: reload\n\n");


  
  });

}





const directoriesToWatch = ["pages", "comps", "assets"];
directoriesToWatch.forEach((directory) => {
  fs.watch(
    path.join(__dirname, directory),
    { recursive: true },
    (eventType, filename) => {
  
      if (filename && !filename.includes("app.js")) {
        notifyClients();
      }
    }
  );
});

eventEmitter.on("fileChanged", () => {
  notifyClients();
});



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function readPagesFolder() {
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

function readPlugins() {
  const pluginsFolderPath = path.join(__dirname, "plugins");
  let pages = [];
  try {
    //find all files in plugins folder
    const files = fs.readdirSync(pluginsFolderPath);

    //loop through each file
    files.forEach((file) => {
      pages.push(file);
    });
  } catch (error) {
    console.error("Error reading plugins folder:", error);
  }

  return pages;
}

app.get("*", (req, res, next) => {
  if (req.url.includes("pages")) {
    //check req.url doesn't have any file requests like /pages/home,etc. send a list of pages
    if (req.url === "/pages") {
      let pages = readPagesFolder();
      //remove any spacing in the array
      for (let i = 0; i < pages.length; i++) {
        pages[i] = pages[i].trim();
      }

      res.set("Content-Type", "text/plain");

      res.send(
        `ROUTES=${pages}`
      );
    } else {
      // Construct the path to the .suip file based on the URL
      const pagePath = path.join(__dirname, req.url + ".suip");
      // Check if the file exists
      if (!fs.existsSync(pagePath)) {
        return res.status(404).send("Not found");
      }
      // Read the .suip file content
      const pageContent = fs.readFileSync(pagePath, "utf8");

      // Send the response
      res.send(pageContent);
    }
  } else if (req.url.includes("plugins")) {
    if (req.url === "/plugins") {
      let pages = readPlugins();

      res.send("PLUGINS=" + pages);
    } else {
      const pagePath = path.join(__dirname, req.url);
      // Check if the file exists
      if (!fs.existsSync(pagePath)) {
        return res.status(404).send("Not found");
      }
      // Read the .suip file content
      const pageContent = fs.readFileSync(pagePath, "utf8");
      res.set("Content-Type", "text/javascript");
      // Send the response
      res.send(pageContent);
    }
  } else if (req.url.includes("/comps")) {
    if (req.url === "/comps") {
      //get all the files in the comps folder
      let comps = fs.readdirSync(path.join(__dirname, "comps"));
      //remove any spacing in the array
      for (let i = 0; i < comps.length; i++) {
        comps[i] = comps[i].trim().replace(".suip", "");
      }
      res.set("Content-Type", "text/plain");
      res.send(`${comps}`);
    } else {
      // Construct the path to the .suip file based on the URL
      const pagePath = path.join(__dirname, req.url + ".suip");
      // Check if the file exists
      if (!fs.existsSync(pagePath)) {
        return res.status(404).send("Not found");
      }
      // Read the .suip file content
      const pageContent = fs.readFileSync(pagePath, "utf8");

      // Send the response
      res.send(pageContent);
    }
  } else if (req.url.includes("/events")) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(": ping\n\n");

    clients.push(res);

    req.on("close", () => {
      clients = clients.filter((client) => client !== res);
    });
  
  } else {
    let type = mime.lookup(req.url);
    if (type) {
      // search in the public/assets folder
      const assetPath = path.join(__dirname, req.url);

      // Check if the file exists
      if (!fs.existsSync(assetPath)) {
        return res.status(404).send("Not found");
      }

      //check if the file is a scss or css file or sass
      if (assetPath.includes(".scss") || assetPath.includes(".sass")) {
        let content = fs.readFileSync(assetPath, "utf8");
        let result = sass.compileString(content, {
          style: "compressed",
        });

        res.set("Content-Type", "text/css");
        return res.send(result.css.toString());
      }

      res.set("Content-Type", type);

      res.sendFile(assetPath);
    } else {
      return res.sendFile(path.join(__dirname, "index.html"));
    }
  }
});

app.listen(port, async () => {
  console.log("\x1b[31m%s\x1b[0m", "Sprint UI is running on port " + port);

  //check version file

  if ((await getVersion(versionFileURL)) > sV) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "Sprint UI is not up to date. Please update to the latest version"
    );
  } else if ((await getVersion(versionFileURL)) < sV) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "Sprint UI is running a development version"
    );
  } else {
    console.log("\x1b[31m%s\x1b[0m", "Sprint UI is up to date");
  }

  console.log("\x1b[33m%s\x1b[0m", "To go into production run: npm run build");
});


