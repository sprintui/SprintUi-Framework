const express = require("express");
const https = require("https");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const fs = require("node:fs");
const path = require("path");
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
let clients = [];
var mime = require('mime-types')
const versionFileURL =
  "https://raw.githubusercontent.com/sprintui/SprintUi-Framework/main/version.txt";
const sV = fs.readFileSync(".v", "utf8");
console.log(sV);

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
    "EXCLUDES=\nELL=false\nNL=false\n"
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




function notifyClients() {
  clients.forEach(client => {
    client.write('data: reload\n\n');
  });
}

fs.watch(path.join(__dirname, "pages"), { recursive: true }, (eventType, filename) => {
  if (filename) {
    eventEmitter.emit('fileChanged');
  }

});

eventEmitter.on('fileChanged', () => {

  notifyClients();
});

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

function getLongLoading() {
  let longLoading = false;
  let noLoading = false;
  let configPath = path.join(__dirname, "config.sui");
  let config = fs.readFileSync(configPath, "utf8");
  let configArray = config.split(/\r?\n/);
  configArray.forEach((line) => {
    if (line.includes("ELL")) {
      let value = line.split("=");
      if (value[1].toLowerCase() == "true") {
        longLoading = true;
      }
    }
    else if (line.includes("NL")) {
      let value = line.split("=");
      if (value[1].toLowerCase() == "true") {
        noLoading = true;
      }
    }

  });

  return { longLoading, noLoading };
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

      let enableLongLoading = getLongLoading();

      res.set("Content-Type", "text/plain");

      res.send(`ROUTES=${pages}\nELL=${enableLongLoading.longLoading}\nNL=${enableLongLoading.noLoading}`
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
  else if(req.url.includes("/events")){
  
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(': ping\n\n');
    
      clients.push(res);
    
      req.on('close', () => {
        clients = clients.filter(client => client !== res);
      });
   }
   else 
   {
    //check for asset file:js,css,image file types
    if (
      mime.lookup(req.url)
    ) {
      // search in the public/assets folder
      const assetPath = path.join(__dirname, req.url);

      // Check if the file exists
      if (!fs.existsSync(assetPath)) {
        return res.status(404).send("Not found");
      }

      res.set("Content-Type", mime.lookup(req.url));

      res.sendFile(assetPath);
    } else {
      return res.sendFile(path.join(__dirname, "index.html"));
    }
  }
});

app.listen(port, async () => {
  console.log("\x1b[31m%s\x1b[0m", "Sprint UI is running on port " + port);

  //check version file

  if ((await getVersion(versionFileURL)) != sV) {
    console.log(
      "\x1b[31m%s\x1b[0m",
      "Sprint UI is not up to date. Please update to the latest version"
    );
  } else {
    console.log("\x1b[32m%s\x1b[0m", "SprintUi UI is up to date");
  }

  console.log("\x1b[33m%s\x1b[0m", "To go into production run: npm run build");
});
