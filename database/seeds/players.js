export function seedPlayers(db) {
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
  
  const insertPlayer = db.prepare('INSERT INTO players (name) VALUES (?)');
  const playerIds = [];
  
  for (const playerName of players) {
    const result = insertPlayer.run(playerName);
    playerIds.push(result.lastInsertRowid);
  }
  
  console.log('Players seeded successfully');
  return playerIds;
}