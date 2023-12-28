const { pool } = require("../config/db.config");
const { getIo } = require("../config/socketSetup");
const { updateRecord, createRecord } = require("./dbHeplerFunc");
const { checkUserExists } = require("./dbValidations");

const rideSocketMap = new Map();

function setupRideEvents() {
  const io = getIo();

  io.on("connection", (socket) => {
    socket.on("startRide", async (data) => {
      try {
        const { ride_id } = data;
        rideSocketMap.set(ride_id, socket.id);
        const rides = await checkUserExists("rides", "id", ride_id);
        if (rides.rowCount === 0) {
          return;
        }
        const userData = { ride_status: "started" };
        const updateResult = await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        io.emit("rideStarted", { result: updateResult });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("pickupLocationReached", async (data) => {
      try {
        const { ride_id } = data;
        const userData = { ride_status: "waiting" };
        const updateResult = await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        socket.emit("pickupLocationReached", { result: updateResult });
      } catch (error) {
        console.error("Error updating ride status:", error);
        // Handle error (e.g., emit an error event to client)
        socket.emit("updateError", { error: "Error updating ride status" });
      }
    });

    socket.on("ongoing", async (data) => {
      try {
        const { ride_id } = data;

        const userData = { ride_status: "ongoing" };
        const updateResult = await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        // Emitting an event after successful update
        io.emit("ongoing", { result: updateResult });
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });

    socket.on("rideCompleted", async (data) => {
      try {
        const { ride_id, ride_duration, ride_end_time } = data;

        const userData = {
          ride_status: "completed",
          ride_duration,
          ride_end_time,
        };

        const updateResult = await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        
        // Emitting an event after successful update
        io.emit("rideCompleted", { result: updateResult });
        
        const socketId = rideSocketMap.get(ride_id);
        if (socketId && io.sockets.sockets.get(socketId)) {
          io.sockets.sockets.get(socketId).disconnect();
          rideSocketMap.delete(ride_id);
        }
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });
    socket.on("break", async (data) => {
      try {
        const { ride_id, break_start, duration } = data;
        const status = "on_break";

        const breakData = {
          ride_id,
          break_start,
          duration,
          status,
        };

        // Store the break data
        await createRecord("ride_breaks", breakData, []);

        const userData = { ride_status: "break" };
        await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        // Fetch the updated ride details along with all associated breaks
        const rideBreakDetailsQuery = `
      SELECT 
        r.*, 
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', rb.id,
          'break_start', rb.break_start,
          'break_end', rb.break_end,
          'duration', rb.duration,
          'status', rb.status
        )) AS break_details
      FROM 
        rides r
      LEFT JOIN 
        ride_breaks rb ON r.id = rb.ride_id
      WHERE 
        r.id = $1
      GROUP BY 
        r.id`;

        const rideBreakDetailsResult = await pool.query(rideBreakDetailsQuery, [
          ride_id,
        ]);
        const rideBreakDetails = rideBreakDetailsResult.rows[0];

        // Emitting an event after successful update
        io.emit("break", { result: rideBreakDetails });
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });

    socket.on("continue", async (data) => {
      try {
        const { ride_id, break_id, break_end } = data;
        const status = "completed";

        // Update the specific break record
        const breakData = {
          break_end,
          status,
        };

        await updateRecord("ride_breaks", breakData, [], {
          column: "id",
          value: break_id,
        });

        // Update the ride record
        const userData = { ride_status: "ongoing" };
        await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        // Fetch updated ride and break details
        const rideBreakDetailsQuery = `
      SELECT 
        r.*, 
        JSON_AGG(JSON_BUILD_OBJECT(
          'id', rb.id,
          'break_start', rb.break_start,
          'break_end', rb.break_end,
          'duration', rb.duration,
          'status', rb.status
        )) AS break_details
      FROM 
        rides r
      LEFT JOIN 
        ride_breaks rb ON r.id = rb.ride_id
      WHERE 
        r.id = $1
      GROUP BY 
        r.id`;

        const rideBreakDetailsResult = await pool.query(rideBreakDetailsQuery, [
          ride_id,
        ]);
        const rideBreakDetails = rideBreakDetailsResult.rows[0];

        // Emitting an event after successful update
        io.emit("continue", { result: rideBreakDetails });
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });

    socket.on("wait", async (data) => {
      try {
        const { ride_id, wait_time, wait_time_cost } = data;
        const userData = { ride_status: "on_wait", wait_time, wait_time_cost };
        const updateResult = await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        // Emitting an event after successful update
        io.emit("wait", { result: updateResult });
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });
    socket.on("cancel", async (data) => {
      try {
        const { ride_id, canceled_reason, canceled_ride_cost } = data;

        const userData = {
          ride_status: "canceled",
          canceled_ride_cost,
          canceled_reason,
        };
        const updateResult = await updateRecord("rides", userData, [], {
          column: "id",
          value: ride_id,
        });

        const socketId = rideSocketMap.get(ride_id);
        if (socketId && io.sockets.sockets.get(socketId)) {
          io.sockets.sockets.get(socketId).disconnect();
          rideSocketMap.delete(ride_id);
        }

        // Emitting an event after successful update
        io.emit("cancel", { result: updateResult });
      } catch (error) {
        console.error(error);
        // Handle error (e.g., emit an error event to client)
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected.`);
      // Remove the disconnected socket from rideSocketMap
      for (const [rideId, socketId] of rideSocketMap) {
        if (socketId === socket.id) {
          rideSocketMap.delete(rideId);
          console.log(`Ride ${rideId} disassociated from socket ${socketId}`);
        }
      }
    });
  });
}

module.exports = setupRideEvents;
