export function seedCompetitionPlayers(db, playerIds) {
  const insertCompetitionPlayer = db.prepare('INSERT INTO competition_players (competition_id, player_id, score) VALUES (?, ?, ?)');
  
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
  
  console.log('Competition-Players relationships seeded successfully');
}