let socket = io();

let room;
let messagebox = document.querySelector("#messagebox");
let messagecontainer = document.querySelector("#message-container");
let chatform = document.querySelector("#chatform");

socket.emit("joinroom");

socket.on("joined", function(roomname){
    room = roomname;
    document.querySelector(".nobody").classList.add("hidden")
})

chatform.addEventListener("submit", function(event){
    event.preventDefault();
    socket.emit("message", {room : room, message: messagebox.value});
    messagebox.value = ""
});

socket.on("recieve-message", function(data){
    let newMessagecontainer = document.createElement("p");
    newMessagecontainer.textContent = data.message;

    if(data.id === socket.id){
        newMessagecontainer.classList.add("self");
    } 
    messagecontainer.append(newMessagecontainer);

    messagecontainer.scrollTop = messagecontainer.scrollHeight;
})