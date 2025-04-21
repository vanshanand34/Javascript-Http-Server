const net = require("net");
const fs = require("fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");
console.log("arguments: ", process.argv);

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
        console.log("arguments: ", process.argv);
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
        else if (requestPath == "/files") {
            console.log("directory", process.argv);
            const fileContent = getFileContent("./files/foo.txt");
            socket.write(getContentWithLength(fileContent, "application/octet-stream"));
            socket.end();
        }
        else {
            socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
            socket.end();
            return;
        }
    });
});

server.listen(4221, "localhost");
