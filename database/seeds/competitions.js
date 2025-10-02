export function seedCompetitions(db) {
  const competitions = [
    'Chess Tournament',
    'Basketball League', 
    'Soccer Championship',
    'Tennis Open',
    'Golf Masters',
    'Swimming Competition'
  ];
  
  const insertComp = db.prepare('INSERT INTO competitions (name) VALUES (?)');
  
  for (const compName of competitions) {
    insertComp.run(compName);
  }
  
  console.log('Competitions seeded successfully');
}