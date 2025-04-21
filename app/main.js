const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

function getContentWithLength(stringToReturn) {
    const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${stringToReturn.length}\r\n\r\n${stringToReturn}`
    return response;
}

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
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
        else if (requestPath.includes("echo") && requestPath.split("/echo/").length == 2) {
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
        else {
            const response = `HTTP/1.1 404 Not Found\r\n\r\n`;
            socket.write(response);
            socket.end();
            return;
        }
    });
});

server.listen(4221, "localhost");
