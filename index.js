const http = require("http").createServer();
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

let rooms = [
  { id: "room1", name: "Pokój 1", players: [] },
  { id: "room2", name: "Pokój 2", players: [] },
  { id: "room3", name: "Pokój 3", players: [] },
  { id: "room4", name: "Pokój 4", players: [] },
  { id: "room5", name: "Pokój 5", players: [] },
  { id: "room6", name: "Pokój 6", players: [] },
];
let playerColor;

io.on("connection", (socket) => {
  let currentRoomId;
  let clientName;

  socket.emit("rooms", rooms);

  socket.on("joinRoom", (playerName, roomName) => {
    if (playerName == "" || !playerName)
      clientName = `player ${socket.id.substring(0, 3)}`;
    else clientName = playerName;

    const currentPlayer = { name: clientName, id: socket.id };
    const currentRoom = rooms.find((room) => room.name == roomName);
    if (!currentRoom || currentRoom.players.length >= 2) return;
    socket.join(currentRoom.id);
    currentRoom.players.push(currentPlayer);
    currentRoomId = currentRoom.id;

    playerColor = currentRoom.players.length % 2 == 1;
    socket.emit("joined");
    socket.broadcast.emit("rooms", rooms);
  });

  socket.on("message", (message) => {
    if (currentRoomId === "") return;

    socket.to(currentRoomId).emit("message", clientName, message);
    socket.emit("message", clientName, message);
  });

  socket.on("place-pawn", (pawn) => {
    if (currentRoomId != "") socket.to(currentRoomId).emit("place-pawn", pawn);
  });

  socket.on("move-pawn", (pawn) => {
    if (currentRoomId != "") socket.to(currentRoomId).emit("move-pawn", pawn);
  });

  socket.on("pawn-scored", (pawn) => {
    if (currentRoomId != "") socket.to(currentRoomId).emit("pawn-scored", pawn);
  });

  socket.on("remove-pawn", (pawn) => {
    if (currentRoomId != "") socket.to(currentRoomId).emit("remove-pawn", pawn);
  });

  socket.on("get-player-color", () => {
    socket.emit("player-color", playerColor);
  });
});

http.listen(8081, () => console.log("listening on http://localhost:8080"));
