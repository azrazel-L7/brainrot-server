const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = new WebSocket.Server({ port: PORT });

console.log("Servidor iniciado na porta " + PORT);

const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;

  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms[code]);

  return code;
}

server.on("connection", (ws) => {

  console.log("Jogador conectado!");

  ws.on("message", (message) => {

    const data = JSON.parse(message.toString());

    // Criar sala
    if (data.type === "createRoom") {

      const code = generateRoomCode();

      rooms[code] = {
        players: [ws]
      };

      ws.roomCode = code;

      ws.send(JSON.stringify({
        type: "roomCreated",
        code: code
      }));

      return;
    }

    // Entrar na sala
    if (data.type === "joinRoom") {

      const room = rooms[data.code];

      if (!room) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Sala não encontrada."
        }));
        return;
      }

      if (room.players.length >= 2) {
        ws.send(JSON.stringify({
          type: "error",
          message: "Sala cheia."
        }));
        return;
      }

      room.players.push(ws);

      ws.roomCode = data.code;

      room.players.forEach(player => {
        player.send(JSON.stringify({
          type: "gameStart"
        }));
      });

      return;
    }

    // Enviar mensagens apenas para o outro jogador da sala
    if (ws.roomCode && rooms[ws.roomCode]) {

      rooms[ws.roomCode].players.forEach(player => {

        if (
          player !== ws &&
          player.readyState === WebSocket.OPEN
        ) {
          player.send(message.toString());
        }

      });

    }

  });

  ws.on("close", () => {

    console.log("Jogador desconectado!");

    if (!ws.roomCode) return;

    const room = rooms[ws.roomCode];

    if (!room) return;

    room.players = room.players.filter(player => player !== ws);

    room.players.forEach(player => {

      if (player.readyState === WebSocket.OPEN) {

        player.send(JSON.stringify({
          type: "playerLeft"
        }));

      }

    });

    if (room.players.length === 0) {
      delete rooms[ws.roomCode];
    }

  });

});
