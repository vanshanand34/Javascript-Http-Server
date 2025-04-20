const net = require("net");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
    socket.on("close", () => {
        socket.end();
    });
    socket.on("data", (data) => {
        const requestHeaders = data.toString().split("\r\n");
        const stringToReturn = requestHeaders[0].split(" ")[1].split("/")[2];
        const response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${stringToReturn.length}\r\n\r\n${stringToReturn}`
        socket.write(response);
        socket.end()
    });
});

server.listen(4221, "localhost");
