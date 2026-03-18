const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data.sqlite');

db.run(`UPDATE users SET trust_score = ROUND(trust_score, 1) WHERE role='worker'`, function(err){
  if(err) {
    console.error('Error:', err);
  } else {
    console.log(`✅ Rounded ${this.changes} ratings to 1 decimal`);
    db.close();
    process.exit();
  }
});
