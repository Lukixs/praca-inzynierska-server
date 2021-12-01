const http = require("http").createServer();
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

let clientNo = 0;
let clientName;

io.on("connection", (socket) => {
  clientNo++;
  const currentClientNo = clientNo;
  const currentRoom = Math.round(currentClientNo / 2);
  console.log(
    `user ${socket.id.substring(0, 3)} connected to room: ${currentRoom}`
  );

  socket.on("joinRoom", (name) => {
    if (name == "" || !name) clientName = `player ${socket.id.substring(0, 3)}`;
    else clientName = name;
    socket.join(currentRoom);
    // console.log("socket joined " + currentRoom);
    const playerMoveOnWhite = currentClientNo % 2 == 1;
    socket.emit("joined", playerMoveOnWhite);
  });

  socket.on("message", (message) => {
    console.log(message);
    // io.emit(
    //   "message",
    //   `${socket.id.substr(0, 5)} said ${message}, ${currentRoom} `
    // );

    if (currentRoom === "") {
      socket.broadcast.emit("message", `${message} to everyone`);
      socket.emit("message", `${message} to room ${currentRoom} `);
    } else {
      socket
        .to(currentRoom)
        .emit("message", clientName, `${message} to room ${currentRoom} `);
      socket.emit("message", clientName, `${message} to room ${currentRoom} `);
    }
  });

  socket.on("place-pawn", (pawn) => {
    // console.log(pawn);
    if (currentRoom != "") socket.to(currentRoom).emit("place-pawn", pawn);
  });

  socket.on("move-pawn", (pawn) => {
    // console.log(pawn);
    if (currentRoom != "") socket.to(currentRoom).emit("move-pawn", pawn);
  });

  socket.on("pawn-scored", (pawn) => {
    // console.log(pawn);
    if (currentRoom != "") socket.to(currentRoom).emit("pawn-scored", pawn);
  });

  socket.on("remove-pawn", (pawn) => {
    // console.log(pawn);
    if (currentRoom != "") socket.to(currentRoom).emit("remove-pawn", pawn);
  });
});

http.listen(8081, () => console.log("listening on http://localhost:8080"));
