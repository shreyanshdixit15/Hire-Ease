const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

// Cap all ratings at 4.9 max (including those at 5.0)
db.run(`UPDATE users SET trust_score = 4.9 WHERE trust_score >= 5.0 AND role='worker'`, function(err){
  if(err) {
    console.error('Error:', err);
  } else {
    console.log(`✅ Capped ${this.changes} ratings at 4.9`);
    
    // Show top workers
    db.all('SELECT name, skills, trust_score FROM users WHERE role="worker" ORDER BY trust_score DESC LIMIT 20', (err, rows) => {
      if (!err) {
        console.log('\n🌟 Top 20 workers with improved ratings:');
        rows.forEach((r, i) => console.log(`  ${(i+1).toString().padStart(2)}. ${r.name.padEnd(20)} (${r.skills.padEnd(25)}): ⭐ ${r.trust_score}`));
      }
      db.close();
    });
  }
});
