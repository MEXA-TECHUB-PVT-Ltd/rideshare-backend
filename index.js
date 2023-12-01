require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const ejs = require("ejs");

// project files directories
require("./app/config/db.config");
const api = require("./app/routes/api");

const app = express();

app.set("view engine", "ejs");


const PORT = process.env.PORT || 3025;

app.use(cors());
app.use(express.json());

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/signup", (req, res) => {
    res.render(path.join(__dirname, "app", "templates", "signup.ejs"));
})

app.use('/api', api)


app.listen(PORT, () => console.log(`app is listening on ${PORT}`));
