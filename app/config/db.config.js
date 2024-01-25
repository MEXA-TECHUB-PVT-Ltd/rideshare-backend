const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  host: process.env.HOST,
  port: process.env.PORT,
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  max: process.env.MAX,
});

pool.on("error", (err) => {
  console.error("Unexpected Error on idle client", err);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error(
      "Could Not Able to connect to Posgresql server Due to some reason:"
    );
    console.log("Error Details =>", err);
  } else {
    console.log("Connected to database successfully");
    console.log("Initializing Tables .....");
    release();
  }
});

const initSQL = fs.readFileSync(
  path.join(__dirname, "..", "models", "init.sql"),
  "utf8"
);

pool.query(initSQL, (err, result) => {
  if (err) {
    console.log("Error Occurred While Initializing Database tables");
    console.log(err);
  } else {
    console.log("All Database tables Initialilzed successfully : ");
  }
});

module.exports = { pool };
