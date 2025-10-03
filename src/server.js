import { serve } from "bun";
import { Database } from "bun:sqlite";
import { file } from "bun";
import path from "path";
import { seedDatabase } from "../database/seeds/index.js";

// Initialize SQLite database
const db = new Database("livescore.db");

// Check if tables exist, only create if they don't
const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
const tableNames = tables.map(t => t.name);

if (!tableNames.includes('competitions') || !tableNames.includes('players') || !tableNames.includes('competition_players')) {
  console.log("Creating database tables...");
  
  db.run(`
    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competition_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
      UNIQUE(competition_id, player_id)
    );
  `);

  // Seed database with sample data only if tables were just created
  seedDatabase(db);
} else {
  console.log("Database tables already exist. Skipping creation...");
}

// WebSocket connections storage
const connections = new Set();

// Helper function to get competitions with players for broadcasting
function getCompetitionsWithPlayers() {
  const competitions = db
    .query("SELECT * FROM competitions ORDER BY id LIMIT 4")
    .all();

  const competitionsWithPlayers = competitions.map((competition) => {
    const players = db
      .query(
        `
      SELECT p.id, p.name, cp.score, cp.updated_at
      FROM players p
      JOIN competition_players cp ON p.id = cp.player_id
      WHERE cp.competition_id = ?
      ORDER BY cp.score DESC
      LIMIT 5
    `,
      )
      .all(competition.id);

    return {
      ...competition,
      players: players,
    };
  });

  return competitionsWithPlayers;
}

// Helper function to broadcast to all WebSocket clients
function broadcastToClients() {
  if (connections.size === 0) return;

  const competitionsWithPlayers = getCompetitionsWithPlayers();
  const message = JSON.stringify({
    type: "update",
    data: competitionsWithPlayers,
  });

  for (const conn of connections) {
    try {
      conn.send(message);
    } catch (error) {
      console.log("Error sending to WebSocket client:", error);
      // Remove broken connection
      connections.delete(conn);
    }
  }
}

// Basic authentication middleware
function basicAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii",
  );
  const [username, password] = credentials.split(":");

  // Hardcoded credentials
  return username === "admin" && password === "admin123";
}

// API routes
async function handleApiRoutes(req, url) {
  if (url.pathname === "/api/competitions") {
    if (req.method === "GET") {
      const competitionsWithPlayers = getCompetitionsWithPlayers();

      return new Response(JSON.stringify(competitionsWithPlayers), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      if (!basicAuth(req)) {
        return new Response("Unauthorized", { status: 401 });
      }

      const body = await req.json();
      const updatePlayer = db.prepare(
        "UPDATE competition_players SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?",
      );

      // Update player scores
      for (const player of body) {
        updatePlayer.run(player.score, player.id);
      }

      // Broadcast updates to all WebSocket clients
      broadcastToClients();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Update competition name
  if (url.pathname.startsWith("/api/competitions/") && req.method === "PUT") {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const competitionId = url.pathname.split("/").pop();
    const body = await req.json();
    const updateCompetition = db.prepare(
      "UPDATE competitions SET name = ? WHERE id = ?",
    );

    updateCompetition.run(body.name, competitionId);

    // Get the updated competition
    const updatedCompetition = db
      .query("SELECT * FROM competitions WHERE id = ?")
      .get(competitionId);

    // Broadcast updates to all WebSocket clients
    broadcastToClients();

    return new Response(JSON.stringify(updatedCompetition), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get all players for a competition (for admin panel)
  if (url.pathname === "/api/players" && req.method === "GET") {
    const competitionId = url.searchParams.get("competition_id");
    if (competitionId) {
      const players = db
        .query(
          `
        SELECT p.id, p.name, cp.score, cp.updated_at
        FROM players p
        JOIN competition_players cp ON p.id = cp.player_id
        WHERE cp.competition_id = ?
        ORDER BY cp.score DESC
      `,
        )
        .all(competitionId);

      return new Response(JSON.stringify(players), {
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Add new player
  if (url.pathname === "/api/players" && req.method === "POST") {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // First insert the player if they don't exist
    const existingPlayer = db
      .query("SELECT id FROM players WHERE name = ?")
      .get(body.name);
    let playerId;

    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else {
      const insertPlayer = db.prepare("INSERT INTO players (name) VALUES (?)");
      const result = insertPlayer.run(body.name);
      playerId = result.lastInsertRowid;
    }

    // Then add the player to the competition
    const insertCompetitionPlayer = db.prepare(
      "INSERT INTO competition_players (competition_id, player_id, score) VALUES (?, ?, ?)",
    );
    insertCompetitionPlayer.run(body.competition_id, playerId, body.score || 0);

    // Get the newly created competition player entry
    const newPlayer = db
      .query(
        `
      SELECT p.id, p.name, cp.score, cp.updated_at
      FROM players p
      JOIN competition_players cp ON p.id = cp.player_id
      WHERE cp.competition_id = ? AND cp.player_id = ?
    `,
      )
      .get(body.competition_id, playerId);

    // Broadcast updates to all WebSocket clients
    broadcastToClients();

    return new Response(JSON.stringify(newPlayer), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update player
  if (url.pathname.startsWith("/api/players/") && req.method === "PUT") {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const playerId = url.pathname.split("/").pop();
    const body = await req.json();
    const updatePlayer = db.prepare(
      "UPDATE competition_players SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?",
    );

    updatePlayer.run(body.score, playerId);

    // Get the updated player
    const updatedPlayer = db
      .query(
        `
      SELECT p.id, p.name, cp.score, cp.updated_at
      FROM players p
      JOIN competition_players cp ON p.id = cp.player_id
      WHERE cp.player_id = ?
    `,
      )
      .get(playerId);

    // Broadcast updates to all WebSocket clients
    broadcastToClients();

    return new Response(JSON.stringify(updatedPlayer), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete player from competition
  if (
    url.pathname.startsWith("/api/players/") &&
    req.method === "DELETE" &&
    !url.pathname.includes("/delete")
  ) {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const playerId = url.pathname.split("/").pop();
    const deleteCompetitionPlayer = db.prepare(
      "DELETE FROM competition_players WHERE player_id = ?",
    );

    deleteCompetitionPlayer.run(playerId);

    // Broadcast updates to all WebSocket clients
    broadcastToClients();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get all players for CRUD management
  if (url.pathname === "/api/players/all" && req.method === "GET") {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const players = db.query("SELECT * FROM players ORDER BY name").all();

    return new Response(JSON.stringify(players), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create new player (global players table)
  if (url.pathname === "/api/players/create" && req.method === "POST") {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    // Check if player already exists
    const existingPlayer = db
      .query("SELECT id FROM players WHERE name = ?")
      .get(body.name);
    if (existingPlayer) {
      return new Response(JSON.stringify({ error: "Player already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const insertPlayer = db.prepare("INSERT INTO players (name) VALUES (?)");
    const result = insertPlayer.run(body.name);

    const newPlayer = db
      .query("SELECT * FROM players WHERE id = ?")
      .get(result.lastInsertRowid);

    // Note: No broadcast here since this only adds to global players table, not to competitions

    return new Response(JSON.stringify(newPlayer), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Update player name (global players table)
  if (
    url.pathname.startsWith("/api/players/") &&
    url.pathname.endsWith("/update") &&
    req.method === "PUT"
  ) {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const playerId = url.pathname.split("/")[3]; // Get the ID before /update
    const body = await req.json();

    // Check if name already exists for another player
    const existingPlayer = db
      .query("SELECT id FROM players WHERE name = ? AND id != ?")
      .get(body.name, playerId);
    if (existingPlayer) {
      return new Response(
        JSON.stringify({ error: "Player name already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const updatePlayer = db.prepare("UPDATE players SET name = ? WHERE id = ?");
    updatePlayer.run(body.name, playerId);

    const updatedPlayer = db
      .query("SELECT * FROM players WHERE id = ?")
      .get(playerId);

    // Broadcast updates to all WebSocket clients since player name change affects scoreboard
    broadcastToClients();

    return new Response(JSON.stringify(updatedPlayer), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete player completely (from players table)
  if (
    url.pathname.startsWith("/api/players/") &&
    url.pathname.endsWith("/delete") &&
    req.method === "DELETE"
  ) {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const playerId = url.pathname.split("/")[3]; // Get the ID before /delete

    // First remove from competition_players
    const deleteCompetitionPlayer = db.prepare(
      "DELETE FROM competition_players WHERE player_id = ?",
    );
    deleteCompetitionPlayer.run(playerId);

    // Then remove from players table
    const deletePlayer = db.prepare("DELETE FROM players WHERE id = ?");
    deletePlayer.run(playerId);

    // Broadcast updates to all WebSocket clients
    broadcastToClients();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get available players not in a specific competition
  if (url.pathname === "/api/players/available" && req.method === "GET") {
    if (!basicAuth(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const competitionId = url.searchParams.get("competition_id");
    if (!competitionId) {
      return new Response(
        JSON.stringify({ error: "competition_id is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const availablePlayers = db
      .query(
        `
      SELECT p.* FROM players p
      WHERE p.id NOT IN (
        SELECT cp.player_id FROM competition_players cp
        WHERE cp.competition_id = ?
      )
      ORDER BY p.name
    `,
      )
      .all(competitionId);

    return new Response(JSON.stringify(availablePlayers), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Return a placeholder response to indicate no API route was handled
  return new Response("No API route matched", {
    status: 200,
    headers: { "X-Not-Handled": "true" },
  });
}

// WebSocket handler
function handleWebSocket(req, server) {
  const upgraded = server.upgrade(req);
  if (!upgraded) {
    return new Response("Upgrade failed", { status: 400 });
  }
  // Return undefined for successful upgrade (Bun handles this internally)
  return undefined;
}

// Serve static files
async function serveStaticFile(urlPath) {
  const filePath = path.join(import.meta.dir, "public", urlPath);

  try {
    const fileContent = await file(filePath).text();
    const contentType = getContentType(filePath);

    return new Response(fileContent, {
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    // Return null if file is not found
    return null;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".js":
      return "application/javascript";
    case ".vue":
      return "text/html";
    default:
      return "text/plain";
  }
}

// Main server handler
const server = serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade
    if (url.pathname === "/ws") {
      const wsResponse = handleWebSocket(req, server);
      if (wsResponse !== undefined) {
        return wsResponse;
      }
      // If undefined, WebSocket upgrade was successful, so return undefined
      return undefined;
    }

    // Handle API routes
    const apiResponse = await handleApiRoutes(req, url);
    if (apiResponse && !apiResponse.headers.get("X-Not-Handled")) {
      return apiResponse;
    }

    // Serve static files
    if (url.pathname === "/" || url.pathname === "/index.html") {
      const response = await serveStaticFile("index.html");
      return response || new Response("Index page not found", { status: 404 });
    }

    if (url.pathname === "/admin.html") {
      const response = await serveStaticFile("admin.html");
      return response || new Response("Admin page not found", { status: 404 });
    }

    if (url.pathname === "/players.html") {
      const response = await serveStaticFile("players.html");
      return (
        response || new Response("Players page not found", { status: 404 })
      );
    }

    const staticResponse = await serveStaticFile(url.pathname);
    if (staticResponse) {
      return staticResponse;
    }

    // Serve Vue.js from CDN
    if (url.pathname === "/vue.js") {
      return fetch("https://unpkg.com/vue@3/dist/vue.global.js");
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      connections.add(ws);
      console.log("Client connected");

      // Send current data to new client with top 5 players
      const competitionsWithPlayers = getCompetitionsWithPlayers();
      ws.send(JSON.stringify({ type: "init", data: competitionsWithPlayers }));
    },
    message(ws, message) {
      console.log("Received message:", message);
    },
    close(ws) {
      connections.delete(ws);
      console.log("Client disconnected");
    },
  },
});

console.log("Server running on http://localhost:3000");
