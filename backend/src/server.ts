import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createApp } from './app.js';
import { ENV } from './config/env.js';

const app = createApp();
const server = http.createServer(app);

// Initialize WebSocket server for real-time order & notification updates
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Map<string, WebSocket>();

wss.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId') || `guest-${Date.now()}`;

  clients.set(userId, ws);
  console.log(`[WebSocket] Client connected: ${userId} (Total: ${clients.size})`);

  ws.send(JSON.stringify({ type: 'CONNECTED', userId, timestamp: new Date().toISOString() }));

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`[WebSocket] Received from ${userId}:`, data);

      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch {
      // ignore non-json
    }
  });

  ws.on('close', () => {
    clients.delete(userId);
    console.log(`[WebSocket] Client disconnected: ${userId} (Total: ${clients.size})`);
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Error for ${userId}:`, err);
  });
});

export function broadcastToUser(userId: string, event: string, payload: any) {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ type: event, data: payload, timestamp: new Date().toISOString() }));
  }
}

export function broadcastAll(event: string, payload: any) {
  const message = JSON.stringify({ type: event, data: payload, timestamp: new Date().toISOString() });
  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

server.listen(ENV.PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌿 Thaluwa Bazar Backend Server (থলুৱা বজাৰ)`);
  console.log(`🚀 REST API:   http://localhost:${ENV.PORT}/api/v1`);
  console.log(`⚡ WebSocket:  ws://localhost:${ENV.PORT}/ws`);
  console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
  console.log(`======================================================\n`);
});
