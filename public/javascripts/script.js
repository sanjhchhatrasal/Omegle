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
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function initialize() {  
  socket.on("signalingMessage", handleSignalingMessage)
  try {
    local = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    document.querySelector("#localVideo").srcObject = local;
    document.querySelector("#localVideo").style.display = "block";

    initiateOffer();

    inCall = true;

  } catch (err) {
    console.log("Rejected by browser" ,err);
  }
}

async function initiateOffer() {
  await createPeerConnection();
  try{
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("signalingMessage", {
      room,
      message: JSON.stringify({
        type: "offer",
        offer
      })
    })
  } catch (err){
    console.log("Error in creating offer", err)
  }
}

async function createPeerConnection() {
  peerConnection =  new RTCPeerConnection(stunServer);

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

const handleSignalingMessage = async (message) => {
    const {type, offer, answer, candidate } = JSON.parse(message);
    if(type === "offer") handleOffer(offer);
    if(type === "answer") handleAnswer(answer);
    if(type === "candidate" && peerConnection){
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch(err){
        console.log(err)
      }
    }
    if(type === "hangup"){
      hangup()
    }
}

const handleOffer =  async(offer) => {
  await createPeerConnection();
  try{
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer)
    socket.emit("signalingMessage", {
      room,
      message: JSON.stringify({
        type: "answer",
        answer
      })
    });
    inCall = true;

  } catch(err){
    console.log("Failed to handle offer ",err)
  }
}

const handleAnswer = async (answer) => {
   try{
    await peerConnection.setRemoteDescription(answer);
   } catch (err){
    console.log("Failed to handle answer ",err)
   }
}

document.querySelector("#video-call-btn").addEventListener("click", function(){
  socket.emit("startVideoCall", {room})
})

socket.on("incomingCall", function(){
  document.querySelector("#incoming-call").classList.remove("hidden")
});

socket.on("callAccepted", function(){
  initialize();
  document.querySelector(".videoblock").classList.remove("hidden")
})

document.querySelector("#accept-call").addEventListener("click", function(){
  document.querySelector("#incoming-call").classList.add("hidden");
  initialize();
  document.querySelector(".videoblock").classList.remove("hidden");
  socket.emit("acceptCall", {room})
});

document.querySelector("#reject-call").addEventListener("click", function(){
  document.querySelector("#incoming-call").classList.add("hidden");
  socket.emit("rejectCall", {room})
})

socket.on("callRejected", function(){
  alert("Call rejected by other user");
})

document.querySelector("#hangup").addEventListener("click", function(){
 hangup()
})

function hangup(){
  if(peerConnection){
    peerConnection.close();
    peerConnection = null;
    local.getTracks().forEach(track => track.stop());

    document.querySelector(".videoblock").style.display = "none";
    socket.emit("signalingMessage", {room, message: JSON.stringify({type: "hangup"})});
    inCall = false;
  }
}


