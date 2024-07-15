const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const session = require('express-session');
const https = require("https");
const app = express();
const port = 3000;
const fs = require("node:fs");
const path = require("path");
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



async function notifyClients() {
 
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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cheaplolboosting'
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

// Discord OAuth
passport.use(new DiscordStrategy({
  clientID: '1260496859999244349',
  clientSecret: 'mJB0WDxnHzKISEiKZKfjse18BlVebLoH',
  callbackURL: 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'email']

}, async (accessToken, refreshToken, profile, done) => {
   console.log(profile);
   console.log(accessToken);
    console.log(refreshToken);

  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE email = ?', [profile.email]);
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      const [result] = await db.query('INSERT INTO Users (username, email, role) VALUES (?, ?, ?)', [profile.username, profile.email, 'customer']);
      const [newUser] = await db.query('SELECT * FROM Users WHERE user_id = ?', [result.insertId]);
      done(null, newUser[0]);
    }
  } catch (error) {
    done(error);
  }
}));

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

app.get("*", async (req, res, next) => {
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
  }

  else if (req.url === "/logout") {
    req.logout(function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
     res.redirect('/');
    });

  }

    
  else if (req.url === "/user") {
    res.json({ user: req.user });
  }
  else if (req.url === "/auth/discord") {
    passport.authenticate('discord')(req, res, next);
  }
  else if (req.url.includes("/auth/discord/callback")) {
    passport.authenticate('discord', {
      failureMessage: true
    })(req, res, next, function() {
      res.redirect('/');
      
    });
  }
   
  else if (req.url.includes("/events")) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write(": ping\n\n");

    clients.push(res);

    req.on("close", () => {
      clients = clients.filter((client) => client !== res);
    });
  
  }
   else {
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
        let result = await sass.compileAsync(assetPath,{
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
// User registration
app.post('/register', async (req, res) => {
  const { username, password, email,lolUsername,role } = req.body;
  if (!username || !password || !email || !lolUsername) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await db.query('INSERT INTO Users (username, password_hash, email, role,gamename,role) VALUES (?, ?, ?, ?,?)', [username, hashedPassword, email, 'customer', lolUsername,role]);
    res.status(201).json({ message: 'User registered', userId: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// User login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
    if (rows.length === 0 || !await bcrypt.compare(password, rows[0].password_hash)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    //set the last login time
    await db.query('UPDATE Users SET last_login_date = CURRENT_TIMESTAMP WHERE user_id = ?', [rows[0].user_id]);

    req.login(rows[0], err => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Logged in', user: rows[0] });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Passport configuration
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await db.query('SELECT * FROM Users WHERE user_id = ?', [id]);
    done(null, rows[0]);
  } catch (error) {
    done(error, null);
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


