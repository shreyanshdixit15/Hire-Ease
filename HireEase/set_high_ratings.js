const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

db.run('UPDATE users SET trust_score = 4.8 WHERE role = "worker"', function(err) {
  if (err) {
    console.error(err);
  } else {
    console.log('✅ Updated all ' + this.changes + ' workers to 4.8 stars');
    db.all('SELECT name, trust_score FROM users WHERE role="worker" LIMIT 20', (e, r) => {
      console.log('\nSample workers:');
      r.forEach(w => console.log(w.name + ': ⭐ ' + w.trust_score));
      db.close();
    });
  }
});
