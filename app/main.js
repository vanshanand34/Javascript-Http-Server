const net = require("net");
const fs = require("fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

let directory;
let files;
if (process.argv.length < 4) {
    directory = "";
} else {
    directory = process.argv[3];
    files = fs.readdirSync(directory);
}

function getContentWithLength(stringToReturn, contentType = "text/plain") {
    const response = `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${stringToReturn.length}\r\n\r\n${stringToReturn}`
    return response;
}

function getFileContent(path) {
    const file = fs.readFileSync(path, 'utf-8');
    return file;
}

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    console.log(process.argv);
    socket.on("close", () => {
        socket.end();
    });
    socket.on("data", (data) => {
        const requestHeaders = data.toString().split("\r\n");
        const requestPath = requestHeaders[0].split(" ")[1];

        if (requestPath == "/") {
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
            socket.end();
            return;
        }
        else if (requestPath.includes("/echo/")) {
            const stringToReturn = requestPath.split("/echo/")[1];
            socket.write(getContentWithLength(stringToReturn));
            socket.end()
            return;
        }
        else if (requestPath.includes("user-agent")) {
            let userAgent = "";
            for (const header of requestHeaders) {
                if (header.includes("User-Agent")) {
                    userAgent = header.split("User-Agent: ")[1];
                    break;
                }
            }
            socket.write(getContentWithLength(userAgent));
            socket.end();
        }
        else if (requestPath.includes("/files/") && directory !== "") {
            const fileRequested = requestPath.split("/files/")[1];
            let fileFound = "";
            for (const file of files) {
                if (fileRequested == file.split(".")[0]) {
                    fileFound = file;
                    break;
                }
            }
            if (fileFound){
                const fileContent = getFileContent(`${directory}/${fileFound}`);
                socket.write(getContentWithLength(fileContent, "application/octet-stream"));
                socket.end();
                return;
            }
        }

        socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
        socket.end();
    });
});

server.listen(4221, "localhost");
