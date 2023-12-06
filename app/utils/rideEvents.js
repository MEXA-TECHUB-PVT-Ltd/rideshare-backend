const { getIo } = require("../config/socketSetup");
const { updateRecord } = require("./dbHeplerFunc");
const { checkUserExists } = require("./dbValidations");

function setupRideEvents() {
  const io = getIo();

  io.on("connection", (socket) => {
    socket.on("startRide", async (data) => {
      try {
        const { ride_id, ride_status } = data;
        const rides = await checkUserExists("rides", "id", ride_id);
        if (rides.rowCount === 0) {
          return;
        }
        const userData = { ride_status: ride_status };
        await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        io.emit("rideStarted", ride_id);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("pickupLocationReached", async (data) => {
      try {
        const { ride_id, user_id } = data;

        // Perform database operation, for example, update ride status
        // This is just a sample, adjust according to your database schema and requirements
        const userData = { ride_status: "pickup_reached" };
        await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        // Emitting an event after successful update
        io.emit("pickupLocationReached", { ride_id, user_id });
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });

    socket.on("rideCompleted", async (data) => {
        try {
        const { ride_id } = data;
          
        // Perform database operation, for example, update ride status
        // This is just a sample, adjust according to your database schema and requirements
        const userData = { ride_status: "completed" };
        await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        // Emitting an event after successful update
        io.emit("rideCompleted", ride_id);
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });
  });
}

module.exports = setupRideEvents;
