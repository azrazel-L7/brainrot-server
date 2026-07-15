const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = new WebSocket.Server({ port: PORT });

console.log("Servidor iniciado na porta " + PORT);

server.on("connection", (ws) => {
  console.log("Jogador conectado!");

  ws.on("message", (message) => {
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Jogador desconectado!");
  });
});
