const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server);

let waitingUsers = [];
let rooms = {}

io.on("connection", function(socket){
    socket.on("joinroom", function(){
       if(waitingUsers.length > 0){
            let partner = waitingUsers.shift();
            const roomname = `${socket.id}-${partner.id}`;
            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit("joined", roomname)
       } else{
        waitingUsers.push(socket)
       }

       socket.on("message", function(data){
         io.emit("recieve-message", {id: socket.id, text: data.message});
       })


       socket.on("diconnect", function(){
        let index = waitingUsers.indexOf((waitingUsers) => waitingUsers.id === socket.id);
        waitingUsers.splice(index, 1)
       })
    })

})

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/chat", (req, res) => {
    res.render("chat")
})

server.listen(3000);