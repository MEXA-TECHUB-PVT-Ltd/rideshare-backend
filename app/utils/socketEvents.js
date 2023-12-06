module.exports = function (io) {
  io.on("connection", (socket) => {
    socket.on("startRide", (rideId) => {
      console.log(`Ride started: ${rideId}`);
      io.emit("rideStarted", { rideId: rideId });
    });
  });
};
