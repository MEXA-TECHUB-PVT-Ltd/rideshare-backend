require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const ejs = require("ejs");
const http = require("http");

// Other project files and configurations
require("./app/config/db.config");
const api = require("./app/routes/api");
const { setupSocket } = require("./app/config/socketSetup");
const setupRideEvents = require("./app/utils/rideEvents");

const app = express();
const server = http.createServer(app);

app.set("view engine", "ejs");

const PORT = process.env.PORT || 3025;

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/socket", (req, res) => {
  res.render(path.join(__dirname, "app", "views", "socket.ejs"));
});

app.use("/api", api);

// Set up Socket.IO
setupSocket(server);
setupRideEvents();

server.listen(PORT, () => console.log(`App is listening on ${PORT}`));
