const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname,'..','data.sqlite'));

// mapping from skill token to photo path
const skillMap = {
  electrician: '/photos/electrician_man.jpg',
  painter: '/photos/painter_man.jpg',
  tailor: '/photos/tailor_girl.jpg',
  maid: '/photos/maid_girl.jpg',
  plumber: '/photos/photo1.svg',
  helper: '/photos/photo2.svg',
  driver: '/photos/photo3.svg',
  carpenter: '/photos/photo4.svg',
  gardener: '/photos/photo5.svg',
  cleaner: '/photos/photo6.svg'
};

function choosePhotoForSkills(skills){
  if (!skills) return null;
  const toks = skills.toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
  for (const t of toks){
    if (skillMap[t]) return skillMap[t];
  }
  return null;
}

db.all("SELECT id, name, skills, photo_path FROM users WHERE role='worker'", (err, rows)=>{
  if (err) { console.error(err); process.exit(1); }
  const stmt = db.prepare("UPDATE users SET photo_path = ? WHERE id = ?");
  let changed = 0;
  rows.forEach(r=>{
    const candidate = choosePhotoForSkills(r.skills);
    if (candidate && r.photo_path !== candidate){
      stmt.run(candidate, r.id);
      changed++;
      console.log(`Updating id=${r.id} name=${r.name} -> ${candidate}`);
    }
  });
  stmt.finalize(()=>{
    console.log('Done. Updated', changed, 'rows.');
    db.close();
  });
});
