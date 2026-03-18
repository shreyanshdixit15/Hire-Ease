const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbPath);

const demoWorkers = [
  {name:'Ravi Kumar', phone:'9000000001', skills:'plumber,helper', lat:28.7041, lon:77.1025, verified:1, photo:'/photos/photo1.svg', trust:4.7},
  {name:'Sunita Devi', phone:'9000000002', skills:'maid,cleaning', lat:28.7050, lon:77.1010, verified:1, photo:'/photos/maid_girl.jpg', trust:4.9},
  {name:'Amit Sharma', phone:'9000000003', skills:'electrician', lat:28.7060, lon:77.1035, verified:0, photo:'/photos/electrician_man.jpg', trust:4.5},
  {name:'Kumar Singh', phone:'9000000004', skills:'painter,decor', lat:28.7025, lon:77.1000, verified:1, photo:'/photos/painter_man.jpg', trust:4.8},
  {name:'Rekha Patel', phone:'9000000005', skills:'tailor,helper', lat:28.7030, lon:77.1050, verified:0, photo:'/photos/tailor_girl.jpg', trust:4.4},
  {name:'Raju Yadav', phone:'9000000006', skills:'electrician,plumber', lat:28.7055, lon:77.1040, verified:1, photo:'/photos/photo6.svg', trust:4.8},
  {name:'Manish Kumar', phone:'9000000007', skills:'plumber', lat:28.7065, lon:77.1070, verified:0, photo:'/photos/photo1.svg', trust:4.5},
  {name:'Neha Sharma', phone:'9000000008', skills:'maid,helper', lat:28.7035, lon:77.1005, verified:1, photo:'/photos/photo2.svg', trust:4.7},
  {name:'Sandeep', phone:'9000000009', skills:'electrician', lat:28.7070, lon:77.1055, verified:0, photo:'/photos/photo3.svg', trust:4.4},
  {name:'Pooja', phone:'9000000010', skills:'painter', lat:28.7015, lon:77.0990, verified:1, photo:'/photos/photo4.svg', trust:4.6},
  {name:'Anil', phone:'9000000011', skills:'helper', lat:28.7080, lon:77.1060, verified:0, photo:'/photos/photo5.svg', trust:4.3},
  {name:'Kavita', phone:'9000000012', skills:'tailor', lat:28.7020, lon:77.1030, verified:1, photo:'/photos/photo6.svg', trust:4.6},
  {name:'Vikas', phone:'9000000013', skills:'electrician', lat:28.7050, lon:77.1000, verified:1, photo:'/photos/photo1.svg', trust:4.5},
  {name:'Sunil', phone:'9000000014', skills:'plumber', lat:28.7045, lon:77.1080, verified:0, photo:'/photos/photo2.svg', trust:4.3},
  {name:'Priya', phone:'9000000015', skills:'maid', lat:28.7060, lon:77.1020, verified:1, photo:'/photos/photo3.svg', trust:4.7},
  {name:'Ramesh', phone:'9000000016', skills:'painter,decor', lat:28.7038, lon:77.1042, verified:0, photo:'/photos/photo4.svg', trust:4.4},
  {name:'Seema', phone:'9000000017', skills:'helper,maid', lat:28.7052, lon:77.1039, verified:1, photo:'/photos/photo5.svg', trust:4.6},
  {name:'Deepak', phone:'9000000018', skills:'electrician,plumber', lat:28.7040, lon:77.1015, verified:1, photo:'/photos/photo6.svg', trust:4.7},
  {name:'Rita', phone:'9000000019', skills:'tailor', lat:28.7028, lon:77.1058, verified:0, photo:'/photos/photo1.svg', trust:4.3},
  {name:'Ajay', phone:'9000000020', skills:'helper', lat:28.7075, lon:77.1033, verified:1, photo:'/photos/photo2.svg', trust:4.6}
];
// start with some curated workers, then programmatically add up to 60 total

// generate additional demo workers up to totalCount (include Aman Yadav)
const totalCount = 60;
const basePhone = 9000000001;
const extraNames = [
  'Aman Yadav','Bhupender','Chirag','Divya','Esha','Farhan','Gautam','Harish','Irfan','Jaya',
  'Kiran','Lalit','Meena','Nitin','Omprakash','Pankaj','Quadir','Rohan','Sakshi','Tara',
  'Umesh','Vandana','Waseem','Xavier','Yogesh','Zoya','Arun','Bala','Chintu','Dinesh',
  'Eklavya','Firoz','Gopal','Hema','Indu','Jagdish','Kabir','Laxmi','Mala','Nilesh',
  'Omar','Pradeep','Qasim','Rakhi','Suresh','Tilak','Usha','Vivek','Wasim','Xena',
  'Yash','Zuber','Aarti','Bala2','Chetan','Dolly','Esha2','Fayaz','Girish','Hiral'
];

const skillsList = ['plumber','electrician','painter','maid','tailor','helper','carpenter','driver','gardener','cleaner'];

function randItem(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

const startLen = demoWorkers.length;
let nextIndex = startLen + 1; // number (1-based) for phone suffixing
for (let i = startLen; i < totalCount; i++){
  const idx = i+1;
  const name = (extraNames[i - startLen] || (`Worker ${idx}`));
  // ensure Aman Yadav is included (if not already)
  // phone: basePhone + i
  const phone = (basePhone + i).toString();
  // pick 1-2 skills
  const s1 = randItem(skillsList);
  let s2 = randItem(skillsList);
  if (s2 === s1) s2 = null;
  const skills = s2 ? `${s1},${s2}` : s1;
  const lat = 28.7041 + (Math.random()-0.5)*0.01; // small area around Delhi
  const lon = 77.1025 + (Math.random()-0.5)*0.01;
  const verified = Math.random() > 0.4 ? 1 : 0;
  const photo = `/photos/photo${(i%6)+1}.svg`;
  const trust = parseFloat((4.2 + Math.round(Math.random()*7)/10).toFixed(1)); // 4.2 to 4.9
  demoWorkers.push({ name, phone, skills, lat, lon, verified, photo, trust });
}

function ensurePhotoColumn(cb){
  db.all("PRAGMA table_info(users)", (err, cols)=>{
    if (err) return cb(err);
    const has = cols.some(c=>c.name==='photo_path');
    if (!has){
      db.run("ALTER TABLE users ADD COLUMN photo_path TEXT", cb);
    } else cb();
  });
}

function seed(){
  ensurePhotoColumn((err)=>{
    if (err) return console.error('Error ensuring column', err);
    const stmt = db.prepare('INSERT OR IGNORE INTO users (name, phone, role, skills, lat, lon, verified, trust_score, photo_path) VALUES (?,?,?,?,?,?,?,?,?)');
    demoWorkers.forEach(w=>{
      stmt.run(w.name, w.phone, 'worker', w.skills, w.lat, w.lon, w.verified, w.trust, w.photo);
    });
    stmt.finalize(()=>{
      // add ratings for workers to reflect trust
      db.all('SELECT id, phone FROM users WHERE phone LIKE "900000000%"', (e, rows)=>{
        if (e) { console.error(e); process.exit(1); }
        const rstmt = db.prepare('INSERT INTO ratings (worker_id, rating, comment) VALUES (?,?,?)');
        rows.forEach((r, i)=>{
          // add 3 random ratings
          const base = Math.round((demoWorkers[i].trust||4)*10)/10;
          rstmt.run(r.id, Math.round(base));
          rstmt.run(r.id, Math.max(3, Math.round(base-1)));
          rstmt.run(r.id, Math.min(5, Math.round(base+1)));
        });
        rstmt.finalize(()=>{
          console.log('Seeding complete.');
          // show inserted users
          db.all('SELECT id,name,phone,skills,verified,photo_path,trust_score FROM users WHERE phone LIKE "900000000%" ORDER BY id', (er, us)=>{
            console.log(JSON.stringify(us, null, 2));
            process.exit(0);
          });
        });
      });
    });
  });
}

seed();
