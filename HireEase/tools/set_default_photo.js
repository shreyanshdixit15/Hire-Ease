const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '..', 'data.sqlite'));
const defaultPhoto = '/photos/default_avatar.svg';

console.log('Setting default photo for ALL users to', defaultPhoto);
db.run("UPDATE users SET photo_path = ?", [defaultPhoto], function(err){
  if (err) { console.error('Error updating users', err); process.exit(1); }
  console.log('Updated rows:', this.changes);
  db.close();
});
