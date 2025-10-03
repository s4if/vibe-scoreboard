export function seedAdminUsers(db) {
  console.log("Seeding admin users...");

  const adminUsers = [
    { username: "admin1", password: "saif123" },
    { username: "admin2", password: "bams456" },
    { username: "admin3", password: "isma789" },
    { username: "admin4", password: "ardi123" },
    { username: "admin5", password: "ibad456" },
    { username: "admin6", password: "mahf789" },
  ];

  const insertAdminUser = db.prepare(
    "INSERT INTO admin_users (username, password) VALUES (?, ?)",
  );

  for (const user of adminUsers) {
    insertAdminUser.run(user.username, user.password);
  }

  console.log("Admin users seeded successfully!");
}
