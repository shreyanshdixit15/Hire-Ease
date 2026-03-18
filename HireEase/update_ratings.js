const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

// Update all worker ratings to be higher (boost low ratings more)
db.run(`UPDATE users SET trust_score = 
  CASE 
    WHEN trust_score < 4.0 THEN trust_score + 0.6
    WHEN trust_score < 4.3 THEN trust_score + 0.4
    WHEN trust_score < 4.5 THEN trust_score + 0.3
    ELSE trust_score + 0.2
  END 
  WHERE role='worker'`, function(err){
  if(err) {
    console.error('Error updating ratings:', err);
  } else {
    console.log(`✅ Updated ${this.changes} worker ratings`);
    
    // Show sample of updated ratings
    db.all('SELECT name, skills, trust_score FROM users WHERE role="worker" ORDER BY trust_score DESC LIMIT 10', (err, rows) => {
      if (!err) {
        console.log('\nTop 10 workers after update:');
        rows.forEach(r => console.log(`  ${r.name} (${r.skills}): ⭐ ${r.trust_score}`));
      }
      db.close();
    });
  }
});
