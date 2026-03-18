const fs = require('fs');
const path = require('path');
const url = require('url');
const http = require('http');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();

const downloads = [
  {url: 'http://googleusercontent.com/image_generation_content/0', file: 'tailor_girl.jpg', phone: '9000000005'}, // Rekha - tailor
  {url: 'http://googleusercontent.com/image_generation_content/1', file: 'maid_girl.jpg', phone: '9000000002'},   // Sunita - maid
  {url: 'http://googleusercontent.com/image_generation_content/0', file: 'painter_man.jpg', phone: '9000000004'}, // Kumar - painter
  {url: 'http://googleusercontent.com/image_generation_content/1', file: 'electrician_man.jpg', phone: '9000000003'} // Amit - electrician
];

const photosDir = path.join(__dirname, 'public', 'photos');
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });

function downloadFile(fileUrl, dest) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(fileUrl);
    const getter = parsed.protocol === 'https:' ? https : http;
    const req = getter.get(fileUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect
        return resolve(downloadFile(res.headers.location, dest));
      }
      if (res.statusCode !== 200) return reject(new Error('Request Failed. Status Code: ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', (err) => reject(err));
    });
    req.on('error', reject);
  });
}

(async ()=>{
  try{
    for (const d of downloads){
      const dest = path.join(photosDir, d.file);
      console.log('Downloading', d.url, '→', dest);
      await downloadFile(d.url, dest).catch(err=>{
        console.warn('Download failed for', d.url, '— creating placeholder instead. Error:', err.message);
        // create a small placeholder if download fails
        const placeholder = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"240\" height=\"240\"><rect width=\"240\" height=\"240\" fill=\"#eee\"/><text x=\"120\" y=\"130\" font-size=\"18\" text-anchor=\"middle\">${path.basename(d.file)}</text></svg>`;
        fs.writeFileSync(dest, placeholder);
      });
    }

    // Update DB paths
    const dbPath = path.join(__dirname, 'data.sqlite');
    const db = new sqlite3.Database(dbPath);
    db.serialize(()=>{
      const stmt = db.prepare('UPDATE users SET photo_path = ? WHERE phone = ?');
      downloads.forEach(d=>{
        const webpath = '/photos/' + d.file;
        console.log('Setting photo for', d.phone, '->', webpath);
        stmt.run(webpath, d.phone);
      });
      stmt.finalize(()=>{
        // show updated rows
        db.all("SELECT id,name,phone,photo_path FROM users WHERE phone IN ('9000000002','9000000003','9000000004','9000000005') ORDER BY phone", (err, rows)=>{
          if (err) console.error('DB read error', err);
          else console.log('Updated users:\n', JSON.stringify(rows, null, 2));
          db.close();
        });
      });
    });
  }catch(err){
    console.error('Unexpected error', err);
  }
})();
