const http = require("http").createServer();
const io = require("socket.io")(http, {
  cors: { origin: "*" },
  pingTimeout: 10000,
});

let rooms = [
  { id: "0", name: "Pokój 1", players: [] },
  { id: "1", name: "Pokój 2", players: [] },
  { id: "2", name: "Pokój 3", players: [] },
  { id: "3", name: "Pokój 4", players: [] },
  { id: "4", name: "Pokój 5", players: [] },
  { id: "5", name: "Pokój 6", players: [] },
];

io.on("connection", (socket) => {
  let currentRoomId;
  let clientName;
  let currentPlayer = { name: clientName, id: socket.id, color: undefined };

  socket.emit("rooms", rooms);

  socket.on("joinRoom", (playerName, roomName) => {
    if (playerName == "" || !playerName)
      clientName = `Player ${socket.id.substring(0, 3)}`;
    else clientName = playerName;

    currentPlayer.name = clientName;
    currentPlayer.id = socket.id;
    const currentRoom = rooms.find((room) => room.name == roomName);
    if (!currentRoom || currentRoom.players.length >= 2) return;
    socket.join(currentRoom.id);
    currentRoomId = currentRoom.id;
    socket.emit("joined");
  });

  socket.on("get-available-colors", () => {
    socket.emit("available-colors", findAvailableColors());
  });

  socket.on("set-player-color", (color) => {
    currentPlayer.color = color;

    rooms[currentRoomId].players.push(currentPlayer);

    socket.to(currentRoomId).emit("available-colors", findAvailableColors());
    socket.emit("color-setted");

    socket
      .to(currentRoomId)
      .emit("players-in-room", rooms[currentRoomId].players);
    socket.emit("players-in-room", rooms[currentRoomId].players);
    socket.to(currentRoomId).emit("user-has-joined-chat", clientName);

    socket.broadcast.emit("rooms", rooms);
  });

  socket.on("get-player-color", () => {
    currentPlayer = rooms[currentRoomId].players.find(
      (player) => player.id == currentPlayer.id
    );
    socket.emit("player-color", currentPlayer.color);
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

  socket.on("surrender", () => {
    if (currentRoomId == "") return;
    socket.to(currentRoomId).emit("player-surrendered", currentPlayer.name);
    socket.emit("player-surrendered", currentPlayer.name);
    socket.emit("show-rematch-option");
  });

  socket.on("set-rematch", () => {
    if (currentRoomId == "") return;

    rooms[currentRoomId].players.forEach((player) => {
      if (player.color == "white") player.color = "black";
      else player.color = "white";
    });
    socket
      .to(currentRoomId)
      .emit("players-in-room", rooms[currentRoomId].players);
    socket.emit("players-in-room", rooms[currentRoomId].players);
    socket.to(currentRoomId).emit("setup-game");
    socket.emit("setup-game");
  });

  function findAvailableColors() {
    const playersInRoom = rooms[currentRoomId].players;
    if (playersInRoom.length >= 2) {
      return { white: false, black: false };
    }
    if (playersInRoom.length == 1) {
      return {
        white: playersInRoom[0].color != "white",
        black: playersInRoom[0].color != "black",
      };
    }
    return { white: true, black: true };
  }

  socket.on("disconnecting", (reason) => {
    // console.log("Disconectig", reason);

    if (currentRoomId) {
      rooms[currentRoomId].players = rooms[currentRoomId].players.filter(
        (player) => {
          return player.id != socket.id;
        }
      );
      socket.to(currentRoomId).emit("user-has-left", clientName);
      socket.broadcast.emit("rooms", rooms);
    }
  });
});

http.listen(8081, () => console.log("listening on http://localhost:8081"));
