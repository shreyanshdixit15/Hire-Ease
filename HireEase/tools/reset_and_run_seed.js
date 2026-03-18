const sqlite3 = require('sqlite3').verbose();
const { spawn } = require('child_process');
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Deleting demo users (phone like 90000000%)...');
db.run("DELETE FROM users WHERE phone LIKE '90000000%';", function(err){
  if (err) { console.error('delete error', err); process.exit(1); }
  console.log('Deleted rows:', this.changes);
  db.run("DELETE FROM ratings WHERE worker_id NOT IN (SELECT id FROM users)", function(e){
    if (e) console.error('cleanup ratings error', e);
    db.close();
    console.log('Running seed.js to re-insert demo users...');
    const p = spawn(process.execPath, [path.join(__dirname,'..','seed.js')], { stdio: 'inherit' });
    p.on('close', code => process.exit(code));
  });
});
