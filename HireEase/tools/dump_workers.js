const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id,name,phone,photo_path FROM users WHERE role = 'worker' ORDER BY id", (err, rows)=>{
  if (err){ console.error('ERR', err); process.exit(1); }
  console.log('total_workers=', rows.length);
  const counts = {};
  rows.forEach(r=>{ counts[r.name] = (counts[r.name]||0)+1; });
  console.log('name_counts_sample:', Object.entries(counts).slice(0,50));
  console.log(JSON.stringify(rows.map(r=>({id:r.id,name:r.name,phone:r.phone,photo:r.photo_path})), null, 2));
  db.close();
});
