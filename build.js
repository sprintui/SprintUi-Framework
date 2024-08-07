const fs = require("node:fs");
const program = require("commander");
const path = require("path");
const https = require("https");
const sass = require("sass");
const { fetch } = require("node-fetch");
program

  .option("-ex, --exclude <value>", "Exclude files from the build", "")

  .parse(process.argv);
const options = program.opts();
const Terser = require("terser");

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
          } else if (href && href.includes(".css")) {
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
        case (match = line.match(
          /<render[dataData]+\s+data=['"]([^'"]+)['"]>(.*?)<\/render[dataData]+>/gi
        )):
          // Skip all lines until the end tag of <renderData> is found
          while (!line.includes("</renderData>") && i < lines.length) {
            i++;
            line = lines[i];
          }
          break;

        case (match = line.match(/<script>/)) !== null:
          {
            const head = line.includes("head={true}");
            const preload = line.includes("preload={true}");
            const async = line.includes("async={true}");
            const defer = line.includes("defer={true}");
            const type = line.match(/type=['"]([^'"]+)['"]/);

            const autoReady = line.includes("autoReady={false}");
            const sprintIgnore = line.includes("sprintIgnore={true}");

            // Initialize scriptContent as an empty string

            let scriptContent = "";

            // Start from the line following the opening <UseScript> tag
            let i = lines.indexOf(line) + 1;
            // Loop through lines until the closing </UseScript> tag is found
            while (i < lines.length && !lines[i].includes("</script>")) {
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

              const urlPattern = /https?:\/\/[^\s]+/;
              const commentPattern = /\/\/.*/;

              for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith("//")) {
                  lines.splice(i, 1);
                  i--; // Adjust the index after removing the element
                } else if (lines[i].includes("//")) {
                  const urlMatch = lines[i].match(urlPattern);
                  if (urlMatch) {
                    // Preserve URL and remove the comment
                    const url = urlMatch[0];
                    const lineWithoutComment = lines[i]
                      .split(commentPattern)[0]
                      .trim();
                    lines[i] = `${lineWithoutComment} ${url}`;
                  } else {
                    // No URL, just remove the comment
                    lines[i] = lines[i].split("//")[0].trim();
                  }
                }
              }

              scriptContent += lines[i];
              i++;
            }

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
                autoReady: false,
                sprintIgnore: sprintIgnore ? true : false,
              };
              pageAssetsTOBeAdded.scripts.push(newScript);
              pageAssetsTOBeAdded.scripts.push(fAndG);
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
          componentName = componentName
            .split("from")[0]
            .trim()
            .replace(/['"]+/g, "")
            .trim();
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
              promises.push(
                new Promise((resolve, reject) => {
                  fs.readdir("comps", (err, files) => {
                    if (err) {
                      console.error("Error reading comps folder:", err);
                      reject(err);
                    } else {
                      files.forEach((file) => {
                        const componentName = file.split(".")[0];
                        importedComponents[pageName][
                          componentName
                        ] = `./comps/${file}`;
                      });
                      resolve();
                    }
                  });
                })
              );

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
                            line = line.replace(
                              `\${${param.key}}`,
                              param.value
                            );
                          }
                          componentHtml += line;

                          html += await transpileComp(componentHtml);
                        }
                      } catch (error) {
                        console.error("Error fetching component:", error);
                      }
                    } else {
                      const componentHtml = fs.readFileSync(component, "utf8");
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
                  } else {
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
                            line = line.replace(
                              `\${${param.key}}`,
                              param.value
                            );
                          }
                          componentHtml += line;
                          html += await transpileComp(componentHtml);
                        }
                      } catch (error) {
                        console.error("Error fetching component:", error);
                      }
                    } else {
                      const componentHtml = fs.readFileSync(component, "utf8");

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

          var hook = pageAssets.hooks.find((hook) => hook.name === "setTitle");
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
                            line = line.replace(
                              `\${${param.key}}`,
                              param.value
                            );
                          }
                          componentHtml += line;

                          html += await transpileComp(componentHtml);
                        }
                      } catch (error) {
                        console.error("Error fetching component:", error);
                      }
                    } else {
                      const componentHtml = fs.readFileSync(component, "utf8");
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
                  } else {
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
                            line = line.replace(
                              `\${${param.key}}`,
                              param.value
                            );
                          }
                          componentHtml += line;
                          html += await transpileComp(componentHtml);
                        }
                      } catch (error) {
                        console.error("Error fetching component:", error);
                      }
                    } else {
                      const componentHtml = fs.readFileSync(component, "utf8");

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
      } else if (options.exclude) {
        if (options.exclude.split(",").includes(route)) {
          console.log("Excluding " + route);
          return;
        }
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
  console.log(`Transpiling ${pageKey}...`);
  const transpiledHtml = await transpilesUIp(pageContent, pageKey);

  pages[pageKey] = transpiledHtml;
}
async function main() {
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
    try {
      // Add a check if assets are already loaded for this page
      if (this.assetsLoaded) {
        return;
      }

      //promise

      const pageAssets = this.pageAssets.find(
        (asset) => asset.page === pageKey
      );
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
            //check if type is importMap

            if (script.autoReady && script.type != "importmap" && script.type != "module") {
           
              scriptElement.textContent = \`document.addEventListener("sprintReady", () => {\${script.textContent}});\`;

            } else {
              scriptElement.textContent = script.textContent;
            }

            scriptElement.async = script.async;
            scriptElement.defer = script.defer;
            scriptElement.preload = script.preload;

            scriptElement.type = script.type || "text/javascript";

            if (script.id && script.type != "importmap" && script.type != "module") {
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
    } catch (e) {
      console.error(e);
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
          document.querySelector(\`link[href="\${style.href}"]\`)
        ) {
          document.querySelector(\`link[href="\${style.href}"]\`).remove();
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
          document.querySelector(
            'script[src="' + script.src.replace(/"/g, '\\"') + '"]'
          )
        ) {
          document
            .querySelector(
              'script[src="' + script.src.replace(/"/g, '\\"') + '"]'
            )
            .remove();
        } else if (script.textContent) {
          Array.from(document.getElementsByTagName("script")).forEach(
            (s, j) => {
              if (script.autoReady) {
                //add sprintReady event listene to the script textContent to check if the same
                if (
                  s.textContent ===
                  \`document.addEventListener("sprintReady", () => {\${script.textContent}});\`
                ) {
                  s.remove();
                  for (let k = 0; k < sprintEvents.length; k++) {
                    const event = sprintEvents[k];
                    if (
                      event.type == "sprintReady" &&
                      event.fn.toString() === \`() => {\${script.textContent}}\`
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

      await this.render(path);
    },

     async renderString(inputString) {
    let html = inputString; // Initialize html with inputString
    const renderDataRegex = /<renderData\\s+data=['"]([^'"]+)['"]>(.*?)<\\/renderData>/gis; // Adjusted regex

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
            return state ? state.value : {};
          case "l":
            let value = localStorage.getItem(key);
            return value ? JSON.parse(value) : {};
          case "c":
            const cookieValue = document.cookie.split(\`\${key}=\`)[1];
            return cookieValue ? JSON.parse(cookieValue.split(";")[0]) : {};
          case "ss":
            return JSON.parse(sessionStorage.getItem(key) || "{}");
          case "u":
            return this.urlParams[key] || {};
          default:
            return {};
        }
      };

      let dataValue = getValue(dataType, data.split(".")[1]);

      if (dataValue && typeof dataValue === "object") {
        let renderedData = "";
        let genAmount = 0;

        for (const key in dataValue) {
          let dataItem = dataValue[key];

          let newTemplate = template
            .split(/\\r?\\n/)
            .map((line) => {
              let newLine = line;

              newLine = newLine.replace(/\\{index}/g, genAmount);

              newLine = newLine.replace(
                /<if\\s*(\\w+?)\\s*(more_then|less_then|equal_to_or_more_then|equal_to_or_less_then|equal_to|not_equal_to)?\\s*([\\w\\d]+)?>([\\s\\S]*?)<\\/if>(?:\\s*<else_if\\s*(\\w+?)\\s*(more_then|less_then|equal_to_or_more_then|equal_to_or_less_then|equal_to|not_equal_to)?\\s*([\\w\\d]+)?>([\\s\\S]*?)<\\/else_if>)*(?:\\s*<else>([\\s\\S]*?)<\\/else>)?/g,
                (
                  match,
                  key,
                  operator,
                  value,
                  ifContent,
                  elseIfKey,
                  elseIfOperator,
                  elseIfValue,
                  elseIfContent,
                  elseContent
                ) => {
                  if (!ifContent) return "";

                  let condition;
                  let keyValue = dataItem[key.trim()];

                  if (value !== undefined) {
                    value = isNaN(value) ? value.trim() : parseFloat(value);
                    keyValue = isNaN(keyValue)
                      ? keyValue
                      : parseFloat(keyValue);

                    switch (operator) {
                      case "more_then":
                        condition = keyValue > value;
                        break;
                      case "less_then":
                        condition = keyValue < value;
                        break;
                      case "equal_to_or_more_then":
                        condition = keyValue >= value;
                        break;
                      case "equal_to_or_less_then":
                        condition = keyValue <= value;
                        break;
                      case "equal_to":
                        condition = keyValue == value;
                        break;
                      case "not_equal_to":
                        condition = keyValue != value;
                        break;
                      default:
                        condition = keyValue; // if no operator, default to checking if the key exists
                    }
                  } else {
                    condition = keyValue;
                  }

                  if (condition) {
                    return ifContent;
                  } else {
                    // Process else_if conditions here
                    // This is a simplified example. You might need to iterate through multiple else_if blocks if they exist.
                    if (elseIfKey) {
                      let elseIfKeyValue = dataItem[elseIfKey.trim()];
                      elseIfValue = isNaN(elseIfValue)
                        ? elseIfValue.trim()
                        : parseFloat(elseIfValue);
                      elseIfKeyValue = isNaN(elseIfKeyValue)
                        ? elseIfKeyValue
                        : parseFloat(elseIfKeyValue);
                      let elseIfCondition = false;

                      switch (elseIfOperator) {
                        case "more_then":
                          elseIfCondition = elseIfKeyValue > elseIfValue;
                          break;
                        case "less_then":
                          elseIfCondition = elseIfKeyValue < elseIfValue;
                          break;
                        case "equal_to_or_more_then":
                          elseIfCondition = elseIfKeyValue >= elseIfValue;
                          break;
                        case "equal_to_or_less_then":
                          elseIfCondition = elseIfKeyValue <= elseIfValue;
                          break;
                        case "equal_to":
                          elseIfCondition = elseIfKeyValue == elseIfValue;
                          break;
                        case "not_equal_to":
                          elseIfCondition = elseIfKeyValue != elseIfValue;
                          break;
                        default:
                          elseIfCondition = elseIfKeyValue; // if no operator, default to checking if the key exists

                      }

                      if (elseIfCondition) {
                        return elseIfContent;
                      }
                    }

                    if (elseContent) {
                      return elseContent;
                    } else {
                      return ""; // or handle the absence of elseContent as needed
                    }
                  }
                }
              );

              //else

              // Handle expressions
              newLine = newLine.replace(/\\{(.*?)}/g, (match, expression) => {
                try {
                  return (
                    new Function(
                      "data",
                      \`with (data) { return \${expression}; }\`
                    )(dataItem) || ""
                  );
                } catch (error) {
                  return "";
                }
              });

              return newLine;
            })
            .join("\\n");

          renderedData += newTemplate; // Accumulate rendered template
          genAmount++;
        }

        html = html.replace(match[0], renderedData); // Replace original tag with rendered content
      }

      processedData.add(data);
    }

    return html;
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
           index--;
            const urlSegment = urlSegments[index];
          
            const key = segment.split("=")[0].replace(/\\[\\]/g, "").replace("[", "").replace("]", "");
      
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
      
        await Promise.all([this.addHooks(path), this.addAssets(path)]);
        if (this.pages[path]) {
          rootElement.innerHTML = await html;
        
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

  async function minifyAndCopyAssets() {
    try {
      // Delete build folder if it exists
      if (fs.existsSync("build")) {
        fs.rmdirSync("build", { recursive: true });
      }

      // Create build directories
      fs.mkdirSync("build");
      fs.mkdirSync("build/assets");

      // Copy assets
      const sourceDir = "./assets";
      const targetDir = "./build/assets";

      const files = fs.readdirSync(sourceDir);

      for (const file of files) {
        await handleFile(sourceDir, file, targetDir);
      }

      

    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function handleFile(sourceDir, file, targetDir) {
    let sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (file.endsWith(".scss") || file.endsWith(".sass")) {
      const result = await sass.compileAsync(sourcePath, {
        outputStyle: "compressed",
      });
      fs.writeFileSync(targetPath.replace(".scss", ".min.css"), result.css);

      console.log(`Compiled ${file}`);
    } else if (file.endsWith(".js")) {
      const minified = await Terser.minify(
        fs.readFileSync(sourcePath, "utf8"),
        { sourceMap: true }
      );
      fs.writeFileSync(targetPath.replace(".js", ".min.js"), minified.code);
      console.log(`Minified ${file}`);
    } else if (file.endsWith(".css")) {
      const result = await sass.compileAsync(sourcePath, {
        outputStyle: "compressed",
      });
      fs.writeFileSync(targetPath.replace(".css", ".min.css"), result.css);
      console.log(`Minified ${file}`);
    } else {
      //if its a folder create it in the build folder then call the function again
      if (
        fs
          .lstatSync(sourcePath)
          .isDirectory()
      ) {
        fs.mkdirSync(targetPath);
        const files = fs.readdirSync(sourcePath);
        for (const file of files) {
          await handleFile(sourcePath, file, targetPath);
        }
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }

    }
  }

  let minified = await Terser.minify(finalScript);
  // Run the function
  await minifyAndCopyAssets();
  //copy index.html to build
  fs.copyFileSync("index.html", "./build/index.html");

  //replace   <script src="/assets/app.js" id="suia"></script> with app.min.js
  let indexHTML = fs.readFileSync("./build/index.html", "utf8");
  indexHTML = indexHTML.replace(
    '<script src="/assets/app.js" id="suia"></script>',
    '<script src="/assets/app.min.js" id="suia"></script>'
  );
  fs.writeFileSync("build/index.html", indexHTML);

  //write app.min.js
  fs.writeFileSync("build/assets/app.min.js", minified.code);

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

  console.log(
    "\x1b[36m%s\x1b[0m",
    "Build Time: " + (Date.now() - startTime) + "ms"
  );

  const sV = fs.readFileSync(".v", "utf8");
  console.log("\x1b[36m%s\x1b[0m", "Version: " + sV);
}

main();
