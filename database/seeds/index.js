import { seedCompetitions } from "./competitions.js";
import { seedPlayers } from "./players.js";
import { seedCompetitionPlayers } from "./competition-players.js";
import { seedAdminUsers } from "./admin-users.js";

export async function seedDatabase(db) {
  // Check if competitions table is empty
  const compCount = db
    .query("SELECT COUNT(*) as count FROM competitions")
    .get();

  if (compCount.count === 0) {
    console.log("Seeding database...");

    // Seed competitions first
    seedCompetitions(db);

    // Seed players and get their IDs
    const playerIds = await seedPlayers(db);

    // Seed competition-players relationships
    //seedCompetitionPlayers(db, playerIds);

    // Seed admin users
    seedAdminUsers(db);

    console.log("Database seeding completed successfully!");
  } else {
    console.log("Database already seeded. Skipping...");
  }
}
