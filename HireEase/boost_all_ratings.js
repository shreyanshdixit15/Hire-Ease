const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

// Boost ALL ratings to be in the 4.5-4.9 range
db.run(`UPDATE users SET trust_score = 
  CASE 
    WHEN trust_score < 4.0 THEN 4.5
    WHEN trust_score < 4.2 THEN 4.6
    WHEN trust_score < 4.4 THEN 4.7
    WHEN trust_score < 4.6 THEN 4.8
    ELSE 4.9
  END 
  WHERE role='worker'`, function(err){
  if(err) {
    console.error('Error:', err);
  } else {
    console.log(`✅ Improved ${this.changes} worker ratings to 4.5-4.9 range`);
    
    // Show distribution
    db.all('SELECT trust_score, COUNT(*) as count FROM users WHERE role="worker" GROUP BY trust_score ORDER BY trust_score', (err, rows) => {
      if (!err) {
        console.log('\n📊 Rating Distribution:');
        rows.forEach(r => console.log(`  ⭐ ${r.trust_score}: ${r.count} workers`));
        
        // Show sample workers
        db.all('SELECT name, skills, trust_score FROM users WHERE role="worker" ORDER BY RANDOM() LIMIT 15', (err, samples) => {
          if (!err) {
            console.log('\n🎲 Random sample of 15 workers:');
            samples.forEach(s => console.log(`  ${s.name.padEnd(20)} (${s.skills.padEnd(25)}): ⭐ ${s.trust_score}`));
          }
          db.close();
        });
      } else {
        db.close();
      }
    });
  }
});
