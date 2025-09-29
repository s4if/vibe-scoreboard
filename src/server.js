import { serve } from 'bun';
import { Database } from 'bun:sqlite';
import { file } from 'bun';
import path from 'path';

// Initialize SQLite database
const db = new Database('livescore.db');

// Drop existing tables and create new structure
db.exec(`
  DROP TABLE IF EXISTS players;
  DROP TABLE IF EXISTS competitions;
  
  CREATE TABLE competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competition_id) REFERENCES competitions (id) ON DELETE CASCADE
  );
`);

// Insert sample data if tables are empty
const compCount = db.query('SELECT COUNT(*) as count FROM competitions').get();
if (compCount.count === 0) {
  // Insert competitions
  const insertComp = db.prepare('INSERT INTO competitions (name) VALUES (?)');
  const competitions = [
    'Chess Tournament',
    'Basketball League', 
    'Soccer Championship',
    'Tennis Open',
    'Golf Masters',
    'Swimming Competition'
  ];
  
  for (const compName of competitions) {
    insertComp.run(compName);
  }
  
  // Insert sample players for each competition
  const insertPlayer = db.prepare('INSERT INTO players (competition_id, name, score) VALUES (?, ?, ?)');
  
  // Chess Tournament players
  insertPlayer.run(1, 'Magnus Carlsen', 2850);
  insertPlayer.run(1, 'Hikaru Nakamura', 2780);
  insertPlayer.run(1, 'Fabiano Caruana', 2760);
  insertPlayer.run(1, 'Ding Liren', 2740);
  insertPlayer.run(1, 'Ian Nepomniachtchi', 2720);
  insertPlayer.run(1, 'Alireza Firouja', 2700);
  insertPlayer.run(1, 'Levon Aronian', 2680);
  
  // Basketball League players
  insertPlayer.run(2, 'LeBron James', 95);
  insertPlayer.run(2, 'Stephen Curry', 92);
  insertPlayer.run(2, 'Kevin Durant', 91);
  insertPlayer.run(2, 'Giannis Antetokounmpo', 90);
  insertPlayer.run(2, 'Luka Dončić', 89);
  insertPlayer.run(2, 'Jayson Tatum', 87);
  insertPlayer.run(2, 'Nikola Jokić', 88);
  
  // Soccer Championship players
  insertPlayer.run(3, 'Lionel Messi', 98);
  insertPlayer.run(3, 'Cristiano Ronaldo', 96);
  insertPlayer.run(3, 'Kylian Mbappé', 94);
  insertPlayer.run(3, 'Erling Haaland', 93);
  insertPlayer.run(3, 'Kevin De Bruyne', 91);
  insertPlayer.run(3, 'Robert Lewandowski', 89);
  insertPlayer.run(3, 'Mohamed Salah', 88);
  
  // Tennis Open players
  insertPlayer.run(4, 'Novak Djokovic', 99);
  insertPlayer.run(4, 'Carlos Alcaraz', 95);
  insertPlayer.run(4, 'Daniil Medvedev', 92);
  insertPlayer.run(4, 'Stefanos Tsitsipas', 89);
  insertPlayer.run(4, 'Casper Ruud', 87);
  insertPlayer.run(4, 'Andrey Rublev', 85);
  insertPlayer.run(4, 'Holger Rune', 84);
  
  // Golf Masters players
  insertPlayer.run(5, 'Scottie Scheffler', 85);
  insertPlayer.run(5, 'Rory McIlroy', 83);
  insertPlayer.run(5, 'Jon Rahm', 82);
  insertPlayer.run(5, 'Brooks Koepka', 81);
  insertPlayer.run(5, 'Patrick Cantlay', 80);
  insertPlayer.run(5, 'Xander Schauffele', 79);
  insertPlayer.run(5, 'Justin Thomas', 78);
  
  // Swimming Competition players
  insertPlayer.run(6, 'Michael Phelps', 100);
  insertPlayer.run(6, 'Caeleb Dressel', 98);
  insertPlayer.run(6, 'Adam Peaty', 96);
  insertPlayer.run(6, 'Katie Ledecky', 97);
  insertPlayer.run(6, 'Ryan Murphy', 94);
  insertPlayer.run(6, 'Sarah Sjöström', 95);
  insertPlayer.run(6, 'Dana Vollmer', 92);
}

// WebSocket connections storage
const connections = new Set();

// Basic authentication middleware
function basicAuth(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }
  
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  
  // Hardcoded credentials
  return username === 'admin' && password === 'admin123';
}

// API routes
async function handleApiRoutes(req, url) {
  if (url.pathname === '/api/competitions') {
    if (req.method === 'GET') {
      // Get competitions with their top 5 players
      const competitions = db.query('SELECT * FROM competitions ORDER BY id').all();
      
      // Get top 5 players for each competition
      const competitionsWithPlayers = competitions.map(competition => {
        const players = db.query(`
          SELECT id, name, score, updated_at 
          FROM players 
          WHERE competition_id = ? 
          ORDER BY score DESC 
          LIMIT 5
        `).all(competition.id);
        
        return {
          ...competition,
          players: players
        };
      });
      
      return new Response(JSON.stringify(competitionsWithPlayers), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (req.method === 'PUT') {
      if (!basicAuth(req)) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const body = await req.json();
      const updatePlayer = db.prepare('UPDATE players SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      
      // Update player scores
      for (const player of body) {
        updatePlayer.run(player.score, player.id);
      }
      
      // Broadcast updates to all WebSocket clients
      const updatedCompetitions = db.query('SELECT * FROM competitions ORDER BY id').all();
      const competitionsWithPlayers = updatedCompetitions.map(competition => {
        const players = db.query(`
          SELECT id, name, score, updated_at 
          FROM players 
          WHERE competition_id = ? 
          ORDER BY score DESC 
          LIMIT 5
        `).all(competition.id);
        
        return {
          ...competition,
          players: players
        };
      });
      
      const message = JSON.stringify({ type: 'update', data: competitionsWithPlayers });
      
      for (const conn of connections) {
        conn.send(message);
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Get all players for a competition (for admin panel)
  if (url.pathname === '/api/players' && req.method === 'GET') {
    const competitionId = url.searchParams.get('competition_id');
    if (competitionId) {
      const players = db.query(`
        SELECT id, name, score, updated_at 
        FROM players 
        WHERE competition_id = ? 
        ORDER BY score DESC
      `).all(competitionId);
      
      return new Response(JSON.stringify(players), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Add new player
  if (url.pathname === '/api/players' && req.method === 'POST') {
    if (!basicAuth(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const body = await req.json();
    const insertPlayer = db.prepare('INSERT INTO players (competition_id, name, score) VALUES (?, ?, ?)');
    
    const result = insertPlayer.run(body.competition_id, body.name, body.score || 0);
    
    // Get the newly created player
    const newPlayer = db.query('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
    
    return new Response(JSON.stringify(newPlayer), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Delete player
  if (url.pathname.startsWith('/api/players/') && req.method === 'DELETE') {
    if (!basicAuth(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const playerId = url.pathname.split('/').pop();
    const deletePlayer = db.prepare('DELETE FROM players WHERE id = ?');
    
    deletePlayer.run(playerId);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Return a placeholder response to indicate no API route was handled
  return new Response('No API route matched', { status: 200, headers: { 'X-Not-Handled': 'true' } }); // Using custom header to indicate "not handled"
}

// WebSocket handler
function handleWebSocket(req, server) {
  const upgraded = server.upgrade(req);
  if (!upgraded) {
    return new Response('Upgrade failed', { status: 400 });
  }
  // Return undefined for successful upgrade (Bun handles this internally)
  return undefined;
}

// Serve static files
async function serveStaticFile(urlPath) {
  const filePath = path.join(import.meta.dir, 'public', urlPath);
  
  try {
    const fileContent = await file(filePath).text();
    const contentType = getContentType(filePath);
    
    return new Response(fileContent, {
      headers: { 'Content-Type': contentType }
    });
  } catch (error) {
    // Return null if file is not found
    return null;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.vue': return 'text/html';
    default: return 'text/plain';
  }
}

// Main server handler
const server = serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);
    
    // Handle WebSocket upgrade
    if (url.pathname === '/ws') {
      const wsResponse = handleWebSocket(req, server);
      if (wsResponse !== undefined) {
        return wsResponse;
      }
      // If undefined, WebSocket upgrade was successful, so return undefined
      return undefined;
    }
    
    // Handle API routes
    const apiResponse = await handleApiRoutes(req, url);
    if (apiResponse && !apiResponse.headers.get('X-Not-Handled')) {
      return apiResponse;
    }
    
    // Serve static files
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const response = await serveStaticFile('index.html');
      return response || new Response('Index page not found', { status: 404 });
    }
    
    if (url.pathname === '/admin.html') {
      const response = await serveStaticFile('admin.html');
      return response || new Response('Admin page not found', { status: 404 });
    }
    
    const staticResponse = await serveStaticFile(url.pathname);
    if (staticResponse) {
      return staticResponse;
    }
    
    // Serve Vue.js from CDN
    if (url.pathname === '/vue.js') {
      return fetch('https://unpkg.com/vue@3/dist/vue.global.js');
    }
    
    return new Response('Not Found', { status: 404 });
  },
  websocket: {
    open(ws) {
      connections.add(ws);
      console.log('Client connected');
      
      // Send current data to new client with top 5 players
      const competitions = db.query('SELECT * FROM competitions ORDER BY id').all();
      const competitionsWithPlayers = competitions.map(competition => {
        const players = db.query(`
          SELECT id, name, score, updated_at 
          FROM players 
          WHERE competition_id = ? 
          ORDER BY score DESC 
          LIMIT 5
        `).all(competition.id);
        
        return {
          ...competition,
          players: players
        };
      });
      
      ws.send(JSON.stringify({ type: 'init', data: competitionsWithPlayers }));
    },
    message(ws, message) {
      console.log('Received message:', message);
    },
    close(ws) {
      connections.delete(ws);
      console.log('Client disconnected');
    },
  },
});

console.log('Server running on http://localhost:3000');
