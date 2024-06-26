const fs = require('fs');
const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Prompt user for URL
rl.question('Enter the URL containing content in the format (Name=urltoComponent): ', (url) => {
    // Read the content from the URL
    const client = url.startsWith('https') ? https : http;
    client.get(url, function(response) {
        let data = '';
        response.on('data', chunk => {
            data += chunk;
        });

        response.on('end', () => {
            console.log('Components fetched successfully.');

            // Split the content by lines
            const lines = data.split('\n');

            // Iterate through each line
            lines.forEach(line => {
                // Split the line by '=' to get the name and URL
                const parts = line.split('=');
                const name = parts[0].trim();
                let componentUrl = parts[1].trim();
                

                // Download the component and save it in the comps folder with the name supplied
                const fileName = `comps/${name}.suip`; // Assuming .suip is the file extension
                downloadFile(componentUrl, fileName, function(err) {
                    if (err) {
                        console.error(`Failed to download ${name}: ${err}`);
                    } else {
                        console.log(`Downloaded ${name} successfully.`);
                    }
                });
            });
        });
    }).on('error', err => {
        console.error(`Error while fetching content: ${err}`);
    });

    rl.close();
});

// Function to download a file from a URL
function downloadFile(url, path, callback) {
    const file = fs.createWriteStream(path);
    const client = url.startsWith('https') ? https : http;
    client.get(url, function(response) {
        let totalBytes = 0;
        const totalSize = parseInt(response.headers['content-length'], 10) || 0;

        response.on('data', chunk => {
            totalBytes += chunk.length;
            const percentage = ((totalBytes / totalSize) * 100).toFixed(2);
            process.stdout.write(`Downloading: ${percentage}%\r`);
            file.write(chunk);
        });

        response.on('end', () => {
            file.end();
            callback(null);
        });
    }).on('error', function(err) { // Handle errors
        fs.unlink(path, () => {}); // Delete the file async. (But we don't check the result)
        callback(err.message);
    });
}
