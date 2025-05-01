const net = require("net");
const fs = require("fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");


function getContentWithLength(stringToReturn, customHeaders = "", contentType = "text/plain") {
    const response = `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\nContent-Length: ${stringToReturn.length}${customHeaders}\r\n\r\n${stringToReturn}`
    console.log("response\n", response)
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
        const request = data.toString();
        const requestData = request.split("\r\n");
        const requestPath = requestData[0].split(" ")[1];
        let closeConnectionHeader = "";
        let encodingHeader = "";

        console.log(requestData);
        for (const header of requestData) {
            if (header.includes("Connection: close")) {
                closeConnectionHeader = "\r\nConnection: close";
            }
            if (header.endsWith("Accept-Encoding: gzip")) {
                encodingHeader = "\r\nContent-Encoding: gzip";
            }
        }

        try {
            if (requestPath == "/") {
                socket.write(`HTTP/1.1 200 OK${closeConnectionHeader}${encodingHeader}\r\n\r\n`);
            }
            else if (requestPath.includes("/echo/")) {
                const stringToReturn = requestPath.split("/echo/")[1];
                socket.write(getContentWithLength(stringToReturn, closeConnectionHeader + encodingHeader));
            }
            else if (requestPath.includes("user-agent")) {
                let userAgent = "";
                for (const header of requestData) {
                    if (header.includes("User-Agent")) {
                        userAgent = header.split("User-Agent: ")[1];
                        break;
                    }
                }
                console.log(userAgent);
                socket.write(getContentWithLength(userAgent, closeConnectionHeader + encodingHeader));
            }
            else if (requestPath.startsWith("/files/")) {
                const directory = process.argv[3];
                const files = fs.readdirSync(directory);
                const fileRequested = requestPath.split("/files/")[1];
                if (request.split(" ")[0] == "GET") {
                    let fileFound = "";
                    for (const file of files) {
                        if (fileRequested == file.split(".")[0]) {
                            fileFound = file;
                            break;
                        }
                    }
                    if (fileFound) {
                        const fileContent = getFileContent(`${directory}/${fileFound}`);
                        socket.write(
                            getContentWithLength(
                                fileContent, closeConnectionHeader + encodingHeader, "application/octet-stream"
                            )
                        );
                    } else {
                        socket.write(`HTTP/1.1 404 Not Found${closeConnectionHeader}${encodingHeader}\r\n\r\n`);
                    }
                } else if (request.split(" ")[0] == "POST") {
                    const requestBody = requestData[requestData.length - 1];
                    fs.writeFileSync(`${directory}/${fileRequested}`, requestBody);
                    socket.write(`HTTP/1.1 201 Created${closeConnectionHeader}${encodingHeader}\r\n\r\n`);
                }
            } else {
                socket.write(`HTTP/1.1 404 Not Found${closeConnectionHeader}${encodingHeader}\r\n\r\n`);
            }

            if (closeConnectionHeader != "") {
                socket.end();
                socket.destroy();
                console.log("`Connection: close` header detected, closing connection");
                return;
            }

        } catch (err) {
            console.log(err);
            socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
            socket.end();
        }

    });
});

server.listen(4221, "localhost");
