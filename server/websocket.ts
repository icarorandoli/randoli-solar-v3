import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

function log(message: string, source = "websocket") {
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
  console.log(`${time} [${source}] ${message}`);
}

export interface WsClient {
  ws: WebSocket;
  userId: string;
  role: string;
  projectIds?: string[];
}

const clients = new Map<string, WsClient>();

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    let userId: string | null = null;

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "auth") {
          userId = msg.userId;
          clients.set(userId!, { ws, userId: userId!, role: msg.role || "integrador" });
          ws.send(JSON.stringify({ type: "auth_ok" }));
          log(`WS: user ${userId} connected`, "websocket");
        }

        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        log(`WS: user ${userId} disconnected`, "websocket");
      }
    });

    ws.on("error", () => {
      if (userId) clients.delete(userId);
    });
  });

  log("WebSocket server attached to HTTP server at /ws", "websocket");
  return wss;
}

export function broadcastToAdmins(event: object) {
  for (const [, client] of Array.from(clients)) {
    if (["admin", "engenharia", "financeiro"].includes(client.role)) {
      trySend(client.ws, event);
    }
  }
}

export function broadcastToUser(userId: string, event: object) {
  const client = clients.get(userId);
  if (client) trySend(client.ws, event);
}

export function broadcastToProjectParticipants(projectOwnerId: string, event: object) {
  broadcastToAdmins(event);
  broadcastToUser(projectOwnerId, event);
}

function trySend(ws: WebSocket, data: object) {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  } catch {
    // ignore
  }
}
