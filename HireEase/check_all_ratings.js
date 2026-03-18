const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

db.all('SELECT name, skills, trust_score FROM users WHERE role="worker" ORDER BY trust_score', (err, rows) => {
  if (!err) {
    console.log('ALL 60 workers ordered by rating:\n');
    rows.forEach((r, i) => console.log(`${(i+1).toString().padStart(2)}. ${r.name.padEnd(20)} ${r.trust_score}`));
  }
  db.close();
  process.exit();
});
