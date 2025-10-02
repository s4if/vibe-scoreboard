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
  DROP TABLE IF EXISTS competition_players;
  
  CREATE TABLE competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE competition_players (
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
  
  // Insert sample players
  const insertPlayer = db.prepare('INSERT INTO players (name) VALUES (?)');
  const insertCompetitionPlayer = db.prepare('INSERT INTO competition_players (competition_id, player_id, score) VALUES (?, ?, ?)');
  
  // Insert players
  const players = [
    'Magnus Carlsen', 'Hikaru Nakamura', 'Fabiano Caruana', 'Ding Liren', 'Ian Nepomniachtchi',
    'Alireza Firouja', 'Levon Aronian', 'LeBron James', 'Stephen Curry', 'Kevin Durant',
    'Giannis Antetokounmpo', 'Luka Dončić', 'Jayson Tatum', 'Nikola Jokić', 'Lionel Messi',
    'Cristiano Ronaldo', 'Kylian Mbappé', 'Erling Haaland', 'Kevin De Bruyne', 'Robert Lewandowski',
    'Mohamed Salah', 'Novak Djokovic', 'Carlos Alcaraz', 'Daniil Medvedev', 'Stefanos Tsitsipas',
    'Casper Ruud', 'Andrey Rublev', 'Holger Rune', 'Scottie Scheffler', 'Rory McIlroy',
    'Jon Rahm', 'Brooks Koepka', 'Patrick Cantlay', 'Xander Schauffele', 'Justin Thomas',
    'Michael Phelps', 'Caeleb Dressel', 'Adam Peaty', 'Katie Ledecky', 'Ryan Murphy',
    'Sarah Sjöström', 'Dana Vollmer'
  ];
  
  const playerIds = [];
  for (const playerName of players) {
    const result = insertPlayer.run(playerName);
    playerIds.push(result.lastInsertRowid);
  }
  
  // Add players to competitions with scores
  // Chess Tournament (Competition ID: 1)
  insertCompetitionPlayer.run(1, playerIds[0], 2850); // Magnus Carlsen
  insertCompetitionPlayer.run(1, playerIds[1], 2780); // Hikaru Nakamura
  insertCompetitionPlayer.run(1, playerIds[2], 2760); // Fabiano Caruana
  insertCompetitionPlayer.run(1, playerIds[3], 2740); // Ding Liren
  insertCompetitionPlayer.run(1, playerIds[4], 2720); // Ian Nepomniachtchi
  insertCompetitionPlayer.run(1, playerIds[5], 2700); // Alireza Firouja
  insertCompetitionPlayer.run(1, playerIds[6], 2680); // Levon Aronian
  
  // Basketball League (Competition ID: 2)
  insertCompetitionPlayer.run(2, playerIds[7], 95);  // LeBron James
  insertCompetitionPlayer.run(2, playerIds[8], 92);  // Stephen Curry
  insertCompetitionPlayer.run(2, playerIds[9], 91);  // Kevin Durant
  insertCompetitionPlayer.run(2, playerIds[10], 90); // Giannis Antetokounmpo
  insertCompetitionPlayer.run(2, playerIds[11], 89); // Luka Dončić
  insertCompetitionPlayer.run(2, playerIds[12], 87); // Jayson Tatum
  insertCompetitionPlayer.run(2, playerIds[13], 88); // Nikola Jokić
  
  // Soccer Championship (Competition ID: 3)
  insertCompetitionPlayer.run(3, playerIds[14], 98); // Lionel Messi
  insertCompetitionPlayer.run(3, playerIds[15], 96); // Cristiano Ronaldo
  insertCompetitionPlayer.run(3, playerIds[16], 94); // Kylian Mbappé
  insertCompetitionPlayer.run(3, playerIds[17], 93); // Erling Haaland
  insertCompetitionPlayer.run(3, playerIds[18], 91); // Kevin De Bruyne
  insertCompetitionPlayer.run(3, playerIds[19], 89); // Robert Lewandowski
  insertCompetitionPlayer.run(3, playerIds[20], 88); // Mohamed Salah
  
  // Tennis Open (Competition ID: 4)
  insertCompetitionPlayer.run(4, playerIds[21], 99); // Novak Djokovic
  insertCompetitionPlayer.run(4, playerIds[22], 95); // Carlos Alcaraz
  insertCompetitionPlayer.run(4, playerIds[23], 92); // Daniil Medvedev
  insertCompetitionPlayer.run(4, playerIds[24], 89); // Stefanos Tsitsipas
  insertCompetitionPlayer.run(4, playerIds[25], 87); // Casper Ruud
  insertCompetitionPlayer.run(4, playerIds[26], 85); // Andrey Rublev
  insertCompetitionPlayer.run(4, playerIds[27], 84); // Holger Rune
  
  // Golf Masters (Competition ID: 5)
  insertCompetitionPlayer.run(5, playerIds[28], 85); // Scottie Scheffler
  insertCompetitionPlayer.run(5, playerIds[29], 83); // Rory McIlroy
  insertCompetitionPlayer.run(5, playerIds[30], 82); // Jon Rahm
  insertCompetitionPlayer.run(5, playerIds[31], 81); // Brooks Koepka
  insertCompetitionPlayer.run(5, playerIds[32], 80); // Patrick Cantlay
  insertCompetitionPlayer.run(5, playerIds[33], 79); // Xander Schauffele
  insertCompetitionPlayer.run(5, playerIds[34], 78); // Justin Thomas
  
  // Swimming Competition (Competition ID: 6)
  insertCompetitionPlayer.run(6, playerIds[35], 100); // Michael Phelps
  insertCompetitionPlayer.run(6, playerIds[36], 98);  // Caeleb Dressel
  insertCompetitionPlayer.run(6, playerIds[37], 96);  // Adam Peaty
  insertCompetitionPlayer.run(6, playerIds[38], 97);  // Katie Ledecky
  insertCompetitionPlayer.run(6, playerIds[39], 94);  // Ryan Murphy
  insertCompetitionPlayer.run(6, playerIds[40], 95);  // Sarah Sjöström
  insertCompetitionPlayer.run(6, playerIds[41], 92);  // Dana Vollmer
  
  // Add some players to multiple competitions to demonstrate many-to-many relationship
  insertCompetitionPlayer.run(2, playerIds[0], 2800); // Magnus Carlsen in Basketball
  insertCompetitionPlayer.run(3, playerIds[7], 90);   // LeBron James in Soccer
  insertCompetitionPlayer.run(1, playerIds[21], 2900); // Novak Djokovic in Chess
  insertCompetitionPlayer.run(4, playerIds[14], 85);  // Lionel Messi in Tennis
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
      // Get competitions with their top 5 players (only 4 competitions for live scoreboard)
      const competitions = db.query('SELECT * FROM competitions ORDER BY id LIMIT 4').all();
      
      // Get top 5 players for each competition
      const competitionsWithPlayers = competitions.map(competition => {
        const players = db.query(`
          SELECT p.id, p.name, cp.score, cp.updated_at 
          FROM players p
          JOIN competition_players cp ON p.id = cp.player_id
          WHERE cp.competition_id = ? 
          ORDER BY cp.score DESC 
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
      const updatePlayer = db.prepare('UPDATE competition_players SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?');
      
      // Update player scores
      for (const player of body) {
        updatePlayer.run(player.score, player.id);
      }
      
      // Broadcast updates to all WebSocket clients
      const updatedCompetitions = db.query('SELECT * FROM competitions ORDER BY id LIMIT 4').all();
      const competitionsWithPlayers = updatedCompetitions.map(competition => {
        const players = db.query(`
          SELECT p.id, p.name, cp.score, cp.updated_at 
          FROM players p
          JOIN competition_players cp ON p.id = cp.player_id
          WHERE cp.competition_id = ? 
          ORDER BY cp.score DESC 
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
  
  // Update competition name
  if (url.pathname.startsWith('/api/competitions/') && req.method === 'PUT') {
    if (!basicAuth(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const competitionId = url.pathname.split('/').pop();
    const body = await req.json();
    const updateCompetition = db.prepare('UPDATE competitions SET name = ? WHERE id = ?');
    
    updateCompetition.run(body.name, competitionId);
    
    // Get the updated competition
    const updatedCompetition = db.query('SELECT * FROM competitions WHERE id = ?').get(competitionId);
    
    // Broadcast updates to all WebSocket clients
    const updatedCompetitions = db.query('SELECT * FROM competitions ORDER BY id LIMIT 4').all();
    const competitionsWithPlayers = updatedCompetitions.map(competition => {
      const players = db.query(`
        SELECT p.id, p.name, cp.score, cp.updated_at 
        FROM players p
        JOIN competition_players cp ON p.id = cp.player_id
        WHERE cp.competition_id = ? 
        ORDER BY cp.score DESC 
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
    
    return new Response(JSON.stringify(updatedCompetition), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get all players for a competition (for admin panel)
  if (url.pathname === '/api/players' && req.method === 'GET') {
    const competitionId = url.searchParams.get('competition_id');
    if (competitionId) {
      const players = db.query(`
        SELECT p.id, p.name, cp.score, cp.updated_at 
        FROM players p
        JOIN competition_players cp ON p.id = cp.player_id
        WHERE cp.competition_id = ? 
        ORDER BY cp.score DESC
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
    
    // First insert the player if they don't exist
    const existingPlayer = db.query('SELECT id FROM players WHERE name = ?').get(body.name);
    let playerId;
    
    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else {
      const insertPlayer = db.prepare('INSERT INTO players (name) VALUES (?)');
      const result = insertPlayer.run(body.name);
      playerId = result.lastInsertRowid;
    }
    
    // Then add the player to the competition
    const insertCompetitionPlayer = db.prepare('INSERT INTO competition_players (competition_id, player_id, score) VALUES (?, ?, ?)');
    insertCompetitionPlayer.run(body.competition_id, playerId, body.score || 0);
    
    // Get the newly created competition player entry
    const newPlayer = db.query(`
      SELECT p.id, p.name, cp.score, cp.updated_at 
      FROM players p
      JOIN competition_players cp ON p.id = cp.player_id
      WHERE cp.competition_id = ? AND cp.player_id = ?
    `).get(body.competition_id, playerId);
    
    return new Response(JSON.stringify(newPlayer), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Update player
  if (url.pathname.startsWith('/api/players/') && req.method === 'PUT') {
    if (!basicAuth(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const playerId = url.pathname.split('/').pop();
    const body = await req.json();
    const updatePlayer = db.prepare('UPDATE competition_players SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE player_id = ?');
    
    updatePlayer.run(body.score, playerId);
    
    // Get the updated player
    const updatedPlayer = db.query(`
      SELECT p.id, p.name, cp.score, cp.updated_at 
      FROM players p
      JOIN competition_players cp ON p.id = cp.player_id
      WHERE cp.player_id = ?
    `).get(playerId);
    
    // Broadcast updates to all WebSocket clients
    const updatedCompetitions = db.query('SELECT * FROM competitions ORDER BY id LIMIT 4').all();
    const competitionsWithPlayers = updatedCompetitions.map(competition => {
      const players = db.query(`
        SELECT p.id, p.name, cp.score, cp.updated_at 
        FROM players p
        JOIN competition_players cp ON p.id = cp.player_id
        WHERE cp.competition_id = ? 
        ORDER BY cp.score DESC 
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
    
    return new Response(JSON.stringify(updatedPlayer), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Delete player
  if (url.pathname.startsWith('/api/players/') && req.method === 'DELETE') {
    if (!basicAuth(req)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const playerId = url.pathname.split('/').pop();
    const deleteCompetitionPlayer = db.prepare('DELETE FROM competition_players WHERE player_id = ?');
    
    deleteCompetitionPlayer.run(playerId);
    
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
      const competitions = db.query('SELECT * FROM competitions ORDER BY id LIMIT 4').all();
      const competitionsWithPlayers = competitions.map(competition => {
        const players = db.query(`
          SELECT p.id, p.name, cp.score, cp.updated_at 
          FROM players p
          JOIN competition_players cp ON p.id = cp.player_id
          WHERE cp.competition_id = ? 
          ORDER BY cp.score DESC 
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
