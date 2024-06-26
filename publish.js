const fs = require("node:fs");
const readline= require("readline");
const path = require("path");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function getProjectVersion(){
    return fs.readFileSync(".v", "utf8");
}

rl.question(`Welcome to EasyPublish CLI, Current Project Version ${getProjectVersion()} \n Project will be updated to ${parseFloat(getProjectVersion()) + 0.1} \n Do you want to continue? (y/n)`, (answer) => {
    if(answer === "y"){
       
            
                    rl.question("Do you have a git repository setup as in you can run git commit or commands like git push? (y/n)", (answer) => {
                        if(answer === "y"){
                            console.log("Updating Project Version...");
                            fs.writeFileSync(".v", parseFloat(getProjectVersion()) + 0.1.toString());
                        }   
                        else
                        {
                            rl.question("Would you like to have instruction or find them yourselves and come back? (y/n)", (answer) => {
                                    if(answer === "y"){
                                        console.log(" git remote add origin https://github.com/OWNER/REPOSITORY.git \n git remote -v");
                                    rl.close();
                                }else{
                                    console.log("Cool, seeya next Time");
                                    rl.close();
                                }
                            });
                        }
                    });
            
            




    }else{
        console.log("Aborted");
        rl.close();
    }


});