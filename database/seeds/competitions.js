export function seedCompetitions(db) {
  const competitions = [
    "Cable Crimping",
    "Linux Administration",
    "Mikrotik",
    "Cisco",
  ];

  const insertComp = db.prepare("INSERT INTO competitions (name) VALUES (?)");

  for (const compName of competitions) {
    insertComp.run(compName);
  }

  console.log("Competitions seeded successfully");
}
