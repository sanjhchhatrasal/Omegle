let socket = io();

let room;
let messagebox = document.querySelector("#messagebox");
let messagecontainer = document.querySelector("#message-container");
let chatform = document.querySelector("#chatform");

socket.emit("joinroom");

socket.on("joined", function (roomname) {
  room = roomname;
  document.querySelector(".nobody").classList.add("hidden");
});

chatform.addEventListener("submit", function (event) {
  event.preventDefault();
  socket.emit("message", { room: room, message: messagebox.value });
  messagebox.value = "";
});

socket.on("recieve-message", function (data) {
  let newMessagecontainer = document.createElement("p");
  newMessagecontainer.textContent = data.text;
  console.log(data.text, data.id);

  if (data.id === socket.id) {
    newMessagecontainer.classList.add("self");
  }
  messagecontainer.append(newMessagecontainer);

  messagecontainer.scrollTop = messagecontainer.scrollHeight;
});

//WEBRTC starts
let local;
let remote;
let peerConnection;
let inCall = false;
let stunServer = {
  iceServers: [{ urls: "stun.l.google.com:19302" }],
};

async function initialize() {
  try {
    local = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    document.querySelector("#localVideo").srcObject = local;
    document.querySelector("#localVideo").style.display = "block";
    document.querySelector(".videoblock").style.display = "block";

    initiateOffer();

    inCall: true;
  } catch (err) {
    console.log("Rejected by browser");
  }
}

async function initiateOffer() {
  await createPeerConnection();
}

async function createPeerConnection() {
  peerConnection = await RTCPeerConnection(stunServer);

  remote = new MediaStream();
  document.querySelector("#remoteVideo").srcObject = remote;
  document.querySelector("#remoteVideo").style.display = "block";
  document.querySelector("#localVideo").classList.add("smallFrame");
  document.querySelector(".videoblock").style.display = "block";

  local.getTracks().forEach(track => {
    peerConnection.addTrack(track, local)
  });

  peerConnection.ontrack = (event) => event.streams[0].getTracks().forEach(track => {
    remote.addTrack(track);
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate){
        console.log("Sending Ice Candidates")

        socket.emit("signalingMessage", {
            room,
            message: JSON.stringify({
                type: "candidate",
                candidate: event.candidate
            })
        })
    }
  }

  peerConnection.onconnectionstatechange = () => {
    console.log("connection state changed", peerConnection.connectionState)
  }
}

initialize();
