const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/../data.sqlite');
db.all("SELECT id,name,phone,role,skills,photo_path FROM users WHERE role='worker' ORDER BY id", (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('workers count:', rows.length);
  console.log(rows.slice(0,20));
  db.close();
});
