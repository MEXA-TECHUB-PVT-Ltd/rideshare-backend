const socketIo = require("socket.io");

let io;

function setupSocket(server) {
  io = socketIo(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("A user connected via WebSocket");
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    console.log("Socket.io not initialized");
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { setupSocket, getIo };
