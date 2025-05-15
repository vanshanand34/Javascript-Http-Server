const net = require("net");
const fs = require("fs");


function getContentWithLength(stringToReturn, customHeaders = "", contentType = "text/plain") {
    const response = (
        `HTTP/1.1 200 OK\r\nContent-Type: ${contentType}\r\n` +
        `Content-Length: ${stringToReturn.length}` +
        `${customHeaders}\r\n\r\n` + `${stringToReturn}`
    );
    return response;
}

function getFileContent(directory, files, fileRequested) {
    try {
        let fileFound = null;
        for (const file of files) {
            if (file.split('.')[0] == fileRequested) {
                fileFound = file;
                break;
            }
        }
        if (!fileFound) return null;
        const path = `${directory}/${fileFound}`;
        const file = fs.readFileSync(path, 'utf-8');
        return file;
    } catch (err) {
        console.log("Error while reading file : " + err);
        return null;
    }
}


const server = net.createServer((socket) => {
    console.log(process.argv);
    socket.on("close", () => {
        socket.end();
    });
    socket.on("data", (data) => {
        const request = data.toString();
        const requestData = request.split("\r\n");

        // First parsing the request line (GET /path/ HTTP/1.1)
        const requestLine = requestData[0];
        const requestPath = requestLine.split(" ")[1];
        const requestMethod = requestLine.split(" ")[0];

        // Parsing the request headers untill empty line indicating end of headers and start of body
        const headers = {};
        for (const requestPart of requestData.slice(1)) {
            if (requestPart == '') break;
            const parsedHeader = requestPart.split(": ");
            headers[parsedHeader[0]] = parsedHeader.slice(1).join(": ");
        }

        // Parsing request body
        const requestBody = requestData[requestData.length - 1];

        // Building response headers (if any)
        let closeConnectionHeader = headers["Connection"] == "close" ? "\r\nConnection: close" : "";
        let encodingHeader = headers['Accept-Encoding'] == 'gzip' ? "\r\nContent-Encoding: gzip" : "";
        let responseHeaders = closeConnectionHeader + encodingHeader;

        console.log(requestMethod, requestPath, headers);

        try {
            if (requestPath == "/") {
                socket.write(`HTTP/1.1 200 OK${responseHeaders}\r\n\r\n`);
            }
            else if (requestPath.includes("/echo/")) {
                const stringToReturn = requestPath.split("/echo/")[1];
                socket.write(getContentWithLength(stringToReturn, responseHeaders));
            }
            else if (requestPath.includes("user-agent")) {
                let userAgent = headers['User-Agent'] || "";
                socket.write(getContentWithLength(userAgent, responseHeaders));
            }
            else if (requestPath.startsWith("/files/")) {
                const directory = process.argv[3];
                const files = fs.readdirSync(directory);
                const fileRequested = requestPath.split("/files/")[1];
                if (requestMethod == "GET") {
                    const fileContent = getFileContent(directory, files, fileRequested);
                    if (fileContent) {
                        socket.write(
                            getContentWithLength(
                                fileContent, responseHeaders, contentType = "application/octet-stream"
                            )
                        );
                    } else {
                        socket.write(`HTTP/1.1 404 Not Found${responseHeaders}\r\n\r\n`);
                    }
                } else if (requestMethod == "POST") {
                    fs.writeFileSync(`${directory}/${fileRequested}`, requestBody);
                    socket.write(`HTTP/1.1 201 Created${responseHeaders}\r\n\r\n`);
                }
            } else {
                socket.write(`HTTP/1.1 404 Not Found${responseHeaders}\r\n\r\n`);
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
