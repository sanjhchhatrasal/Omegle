const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("index");
});

server.listen(3000);