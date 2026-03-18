const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Twilio Configuration (set environment variables or use .env file)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid_here';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token_here';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

let twilioClient = null;
try {
  if (TWILIO_ACCOUNT_SID !== 'your_account_sid_here') {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio configured - Real SMS enabled');
  } else {
    console.log('⚠️  Twilio not configured - Using simulated OTP (check console)');
  }
} catch (err) {
  console.log('⚠️  Twilio error - Using simulated OTP:', err.message);
}

// Multer for uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Simple in-memory OTP store for demo
const otps = {}; // phone -> {code, expires, role, tempUser}

// SQLite DB
const dbFile = path.join(__dirname, 'data.sqlite');
const dbExists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    role TEXT,
    verified INTEGER DEFAULT 0,
    skills TEXT,
    lat REAL,
    lon REAL,
    voice_path TEXT,
    id_doc TEXT,
    trust_score REAL DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER,
    title TEXT,
    description TEXT,
    pay TEXT,
    lat REAL,
    lon REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER,
    rating INTEGER,
    comment TEXT,
    client_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS job_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    worker_id INTEGER,
    worker_phone TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ensure id_type and id_verified columns exist for ID verification workflow
db.serialize(() => {
  db.all("PRAGMA table_info(users)", (err, cols) => {
    if (err) return console.error('PRAGMA error', err);
    const names = (cols||[]).map(c => c.name);
    if (!names.includes('id_type')) {
      db.run("ALTER TABLE users ADD COLUMN id_type TEXT", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('id_verified')) {
      db.run("ALTER TABLE users ADD COLUMN id_verified INTEGER DEFAULT 0", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('available')) {
      db.run("ALTER TABLE users ADD COLUMN available INTEGER DEFAULT 1", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('password')) {
      db.run("ALTER TABLE users ADD COLUMN password TEXT", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('hourly_rate')) {
      db.run("ALTER TABLE users ADD COLUMN hourly_rate REAL", (e) => { if (e) console.error(e); });
    }
  });
});

// Ensure jobs table has columns to track acceptance and status
db.serialize(() => {
  db.all("PRAGMA table_info(jobs)", (err, cols) => {
    if (err) return console.error('PRAGMA jobs error', err);
    const names = (cols||[]).map(c => c.name);
    if (!names.includes('accepted_by')) {
      db.run("ALTER TABLE jobs ADD COLUMN accepted_by TEXT", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('status')) {
      db.run("ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'open'", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('accepted_at')) {
      db.run("ALTER TABLE jobs ADD COLUMN accepted_at DATETIME", (e) => { if (e) console.error(e); });
    }
    // urgent flag for emergency jobs
    if (!names.includes('urgent')) {
      db.run("ALTER TABLE jobs ADD COLUMN urgent INTEGER DEFAULT 0", (e) => { if (e) console.error(e); });
    }
    // client info columns
    if (!names.includes('client_name')) {
      db.run("ALTER TABLE jobs ADD COLUMN client_name TEXT", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('client_phone')) {
      db.run("ALTER TABLE jobs ADD COLUMN client_phone TEXT", (e) => { if (e) console.error(e); });
    }
    if (!names.includes('location')) {
      db.run("ALTER TABLE jobs ADD COLUMN location TEXT", (e) => { if (e) console.error(e); });
    }
  });
});

// Utility: Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x){return x*Math.PI/180;}
  const R = 6371;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  const { phone, role } = req.body;
  if (!phone || !role) return res.status(400).json({ success: false, message: 'Phone and role required' });
  
  // Validate phone format (must start with + for international)
  const phoneNumber = phone.startsWith('+') ? phone : '+91' + phone; // Default to India
  
  const code = Math.floor(1000 + Math.random()*9000).toString();
  otps[phoneNumber] = { code, expires: Date.now() + 5*60*1000, role, originalPhone: phone };
  
  // Try to send real SMS via Twilio
  if (twilioClient) {
    try {
      await twilioClient.messages.create({
        body: `Your QuickHire OTP is: ${code}. Valid for 5 minutes.`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log('✅ OTP sent via SMS to', phoneNumber, ':', code);
      return res.json({ success: true, message: 'OTP sent to your phone via SMS' });
    } catch (err) {
      console.error('❌ Twilio SMS error:', err.message);
      console.log('📱 Fallback - OTP for', phoneNumber, ':', code);
      return res.json({ success: true, message: 'OTP sent (simulated - check console)', otp: code });
    }
  } else {
    // Simulated OTP for development
    console.log('📱 Simulated OTP for', phoneNumber, ':', code);
    return res.json({ success: true, message: 'OTP sent (check console for development)', otp: code });
  }
});

// Register endpoint - verify OTP and create user
app.post('/api/register', (req, res) => {
  const { name, phone, otp, role, skills, lat, lon, password, hourly_rate } = req.body;
  if (!phone || !role || !otp) return res.status(400).json({ success: false, message: 'Phone, role, and OTP required' });
  if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
  
  // DEMO MODE: Accept any 4-digit OTP for demo purposes
  if (!/^\d{4}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid 4-digit OTP' });
  }
  
  // Try both formats for phone lookup
  const phoneNumber = phone.startsWith('+') ? phone : '+91' + phone;
  const record = otps[phoneNumber] || otps[phone];
  
  // For demo: if no OTP record exists or OTP doesn't match, still allow registration with any 4-digit code
  // In production, you would enforce strict validation
  // if (!record) return res.status(400).json({ success: false, message: 'No OTP found. Please request OTP first.' });
  // if (Date.now() > record.expires) return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
  // if (otp !== record.code) return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
  
  // OTP verified, create user - store original phone format with password
  const storePhone = record ? record.originalPhone : phone;
  console.log(`[REGISTRATION] Storing user - Phone: ${storePhone}, Password: ${password ? 'SET' : 'NOT SET'}, Role: ${role}`);
  
  // Check if user already exists
  db.get('SELECT id FROM users WHERE phone = ?', [storePhone], (checkErr, existing) => {
    if (checkErr) {
      console.error('[REGISTRATION] Check error:', checkErr);
      return res.status(500).json({ success: false, message: checkErr.message });
    }
    
    if (existing) {
      // User exists - UPDATE with new password and details
      console.log(`[REGISTRATION] User exists (ID: ${existing.id}), updating...`);
      db.run(`UPDATE users SET name = ?, role = ?, skills = ?, lat = ?, lon = ?, password = ?, hourly_rate = ?, verified = 1, trust_score = 4.5 WHERE phone = ?`,
        [name || '', role, skills || '', lat || null, lon || null, password, hourly_rate || null, storePhone], function(updateErr) {
          if (updateErr) {
            console.error('[REGISTRATION] Update error:', updateErr);
            return res.status(500).json({ success: false, message: updateErr.message });
          }
          console.log(`[REGISTRATION] User updated successfully`);
          db.get('SELECT * FROM users WHERE phone = ?', [storePhone], (e, row) => {
            if (e) return res.status(500).json({ success: false, message: e.message });
            console.log(`[REGISTRATION] User retrieved:`, row ? `ID: ${row.id}, Phone: ${row.phone}, Password: ${row.password ? 'EXISTS' : 'NULL'}` : 'NOT FOUND');
            delete otps[phoneNumber];
            delete otps[phone];
            if (row) delete row.password;
            return res.json({ success: true, message: 'Registration successful!', user: row });
          });
        });
    } else {
      // User doesn't exist - INSERT new user
      console.log(`[REGISTRATION] New user, inserting...`);
      db.run(`INSERT INTO users (name, phone, role, skills, lat, lon, verified, trust_score, password, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name || '', storePhone, role, skills || '', lat || null, lon || null, 1, 4.5, password, hourly_rate || null], function(err){
          if (err) {
            console.error('[REGISTRATION] Insert error:', err);
            return res.status(500).json({ success: false, message: err.message });
          }
          console.log(`[REGISTRATION] User inserted with ID: ${this.lastID}`);
          db.get('SELECT * FROM users WHERE phone = ?', [storePhone], (e, row) => {
            if (e) return res.status(500).json({ success: false, message: e.message });
            console.log(`[REGISTRATION] User retrieved:`, row ? `ID: ${row.id}, Phone: ${row.phone}, Password: ${row.password ? 'EXISTS' : 'NULL'}` : 'NOT FOUND');
            delete otps[phoneNumber];
            delete otps[phone];
            if (row) delete row.password;
            return res.json({ success: true, message: 'Registration successful!', user: row });
          });
        });
    }
  });
});

// Login endpoint - authenticate with phone and password
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  console.log(`[LOGIN] Attempt - Phone: ${phone}, Password: ${password ? 'PROVIDED' : 'MISSING'}`);
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone and password required' });
  
  // Normalize phone formats - try multiple variations
  const phoneVariations = [
    phone,
    phone.startsWith('+') ? phone : '+91' + phone,
    phone.startsWith('+91') ? phone.substring(3) : phone,
    phone.startsWith('91') && phone.length > 10 ? phone.substring(2) : phone
  ];
  console.log(`[LOGIN] Checking phone variations:`, phoneVariations);
  
  // Build SQL query to check all phone variations
  const placeholders = phoneVariations.map(() => '?').join(' OR phone = ');
  db.get(`SELECT * FROM users WHERE phone = ${placeholders}`, phoneVariations, (err, user) => {
    if (err) {
      console.error('[LOGIN] Database error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!user) {
      console.log('[LOGIN] User not found for any phone variation');
      return res.status(401).json({ success: false, message: 'User not found. Please register first.' });
    }
    
    console.log(`[LOGIN] User found - ID: ${user.id}, Phone: ${user.phone}, Password in DB: ${user.password ? 'EXISTS' : 'NULL'}, Role: ${user.role}`);
    
    // Check password
    if (!user.password) {
      console.log('[LOGIN] Password not set for user');
      return res.status(401).json({ success: false, message: 'Password not set for this account. Please contact support.' });
    }
    
    if (user.password !== password) {
      console.log(`[LOGIN] Password mismatch - Provided length: ${password.length}, DB length: ${user.password.length}`);
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    
    console.log('[LOGIN] Login successful');
    // Login successful - don't send password back
    delete user.password;
    return res.json({ success: true, message: 'Login successful!', user });
  });
});

// Get user profile
app.get('/api/profile/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('[PROFILE] Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }
    // Don't send password back
    delete user.password;
    return res.json({ success: true, user });
  });
});

// Update user profile
app.put('/api/profile/:id', (req, res) => {
  const userId = req.params.id;
  const { name, skills, hourly_rate, password } = req.body;
  
  if (!name) {
    return res.json({ success: false, message: 'Name is required' });
  }
  
  let updateQuery = 'UPDATE users SET name = ?';
  let params = [name];
  
  if (skills !== undefined) {
    updateQuery += ', skills = ?';
    params.push(skills);
  }
  
  if (hourly_rate !== undefined) {
    updateQuery += ', hourly_rate = ?';
    params.push(hourly_rate);
  }
  
  if (password) {
    updateQuery += ', password = ?';
    params.push(password);
  }
  
  updateQuery += ' WHERE id = ?';
  params.push(userId);
  
  db.run(updateQuery, params, function(err) {
    if (err) {
      console.error('[PROFILE UPDATE] Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    if (this.changes === 0) {
      return res.json({ success: false, message: 'User not found or no changes made' });
    }
    return res.json({ success: true, message: 'Profile updated successfully' });
  });
});

// Get worker applications
app.get('/api/worker/:id/applications', (req, res) => {
  const workerId = req.params.id;
  console.log('[WORKER APPS] Request for worker ID:', workerId);
  const query = `
    SELECT ja.*, j.title as job_title, j.description as job_description, j.pay, j.created_at as job_created_at
    FROM job_applications ja
    LEFT JOIN jobs j ON ja.job_id = j.id
    WHERE ja.worker_id = ?
    ORDER BY ja.id DESC
  `;
  
  db.all(query, [workerId], (err, applications) => {
    if (err) {
      console.error('[WORKER APPLICATIONS] Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    console.log('[WORKER APPS] Found applications:', applications ? applications.length : 0);
    if (applications && applications.length > 0) {
      console.log('[WORKER APPS] Sample:', applications[0]);
    }
    return res.json({ success: true, applications: applications || [] });
  });
});

// Get employer jobs
app.get('/api/employer/:id/jobs', (req, res) => {
  const employerId = req.params.id;
  console.log('[EMPLOYER JOBS] Request for employer ID:', employerId);
  db.all('SELECT * FROM jobs WHERE employer_id = ? ORDER BY created_at DESC', [employerId], (err, jobs) => {
    if (err) {
      console.error('[EMPLOYER JOBS] Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    console.log('[EMPLOYER JOBS] Found jobs:', jobs ? jobs.length : 0);
    if (jobs && jobs.length > 0) {
      console.log('[EMPLOYER JOBS] Sample:', jobs[0]);
    }
    return res.json({ success: true, jobs: jobs || [] });
  });
});

app.post('/api/upload-voice', upload.single('voice'), (req, res) => {
  const { phone, name, skills } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'No audio file uploaded' });
  if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
  
  const voicePath = '/uploads/' + path.basename(req.file.path);
  
  // Check if user exists
  db.get('SELECT id FROM users WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    
    if (row) {
      // Update existing user
      db.run('UPDATE users SET voice_path = ? WHERE phone = ?', 
        [voicePath, phone], function(err2){
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        return res.json({ success: true, path: voicePath, message: 'Voice resume uploaded successfully' });
      });
    } else {
      // User doesn't exist yet - this shouldn't happen in our flow
      return res.status(400).json({ success: false, message: 'User not found. Please complete registration first.' });
    }
  });
});

// Delete voice file for a user (demo; identifies user by phone)
app.post('/api/delete-voice', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: 'Phone required' });
  db.get('SELECT voice_path FROM users WHERE phone = ?', [phone], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!row || !row.voice_path) return res.json({ success: true, ok: true, message: 'No voice resume to delete' });
    const filePath = path.join(__dirname, row.voice_path.replace(/^\//, ''));
    fs.unlink(filePath, (e)=>{
      // ignore unlink errors but proceed to clear DB
      db.run('UPDATE users SET voice_path = NULL WHERE phone = ?', [phone], function(err2){
        if (err2) return res.status(500).json({ success: false, message: err2.message });
        return res.json({ success: true, ok: true, message: 'Voice resume deleted successfully' });
      });
    });
  });
});

app.post('/api/upload-id', upload.single('iddoc'), (req, res) => {
  const { phone, id_type } = req.body;
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  if (!id_type) return res.status(400).json({ success: false, message: 'Please select ID type' });
  
  const stored = '/uploads/' + path.basename(req.file.path);
  const idTypeNames = {
    'aadhaar': 'Aadhaar Card',
    'pan': 'PAN Card',
    'driving_license': 'Driving License',
    'voter_id': 'Voter ID',
    'passport': 'Passport'
  };
  
  db.run('UPDATE users SET id_doc = ?, id_type = ?, id_verified = 0 WHERE phone = ?', [ stored, id_type, phone ], function(err){
    if (err) return res.status(500).json({ success: false, message: err.message });
    return res.json({ success: true, path: stored, message: `${idTypeNames[id_type] || 'ID'} uploaded successfully - verification pending` });
  });
});

// endpoint to upload site logo (admin or owner can POST multipart/form-data with field 'logo')
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const assetsDir = path.join(__dirname, 'public', 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  const dest = path.join(assetsDir, 'logo.png');
  fs.copyFile(req.file.path, dest, (err)=>{
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ ok: true, path: '/assets/logo.png' });
  });
});

// Admin: verify uploaded ID for a user (set id_verified and set verified flag)
app.post('/api/admin/verify-id/:id', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE users SET id_verified = 1, verified = 1 WHERE id = ?', [id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ ok: true });
  });
});

app.get('/api/workers', (req, res) => {
  const { lat, lon, skill, radius } = req.query;
  db.all('SELECT * FROM users WHERE role = "worker"', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let result = rows || [];
    if (skill) result = result.filter(r => (r.skills || '').toLowerCase().includes(skill.toLowerCase()));
    if (lat && lon) {
      const la = parseFloat(lat); const lo = parseFloat(lon); const rad = parseFloat(radius) || 10;
      result = result.map(r => ({...r, distance_km: r.lat && r.lon ? haversine(la, lo, r.lat, r.lon) : null})).filter(r => r.distance_km === null || r.distance_km <= rad);
    }
    // compute trust_score from ratings table
    const ids = result.map(r => r.id);
    if (ids.length === 0) return res.json({ workers: result });
    db.all(`SELECT worker_id, AVG(rating) as avg FROM ratings WHERE worker_id IN (${ids.join(',')}) GROUP BY worker_id`, [], (e, ratings) => {
      const map = {};
      (ratings||[]).forEach(rr=>map[rr.worker_id]=rr.avg);
      result = result.map(r=> ({...r, trust_score: map[r.id] ? parseFloat(map[r.id]).toFixed(1) : (r.trust_score||0)}));
      return res.json({ workers: result });
    });
  });
});

app.post('/api/jobs', (req, res) => {
  const { employer_id, title, description, pay, lat, lon, urgent, client_name, client_phone, location } = req.body;
  console.log('[POST JOB] Received employer_id:', employer_id, 'title:', title);
  // store urgent as 0/1
  const urgentVal = urgent ? 1 : 0;
  db.run(
    'INSERT INTO jobs (employer_id, title, description, pay, lat, lon, urgent, client_name, client_phone, location) VALUES (?,?,?,?,?,?,?,?,?,?)', 
    [employer_id||null, title, description, pay||'', lat||null, lon||null, urgentVal, client_name||'', client_phone||'', location||''], 
    function(err){
      if (err) {
        console.error('[POST JOB] Error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('[POST JOB] Job created with ID:', this.lastID, 'employer_id:', employer_id);
      if (urgentVal) console.log('[NOTIFY] Urgent job created id=', this.lastID, 'title=', title, 'lat=', lat, 'lon=', lon);
      return res.json({ ok: true, job_id: this.lastID });
    }
  );
});

// Convenience route: create an emergency job quickly (uses geolocation if provided)
app.post('/api/jobs/emergency', (req, res) => {
  const { employer_id, title, description, pay, lat, lon, client_name, client_phone, location } = req.body;
  const urgentVal = 1;
  db.run(
    'INSERT INTO jobs (employer_id, title, description, pay, lat, lon, urgent, client_name, client_phone, location) VALUES (?,?,?,?,?,?,?,?,?,?)', 
    [employer_id||null, title||'Emergency Request', description||'Urgent worker needed', pay||'', lat||null, lon||null, urgentVal, client_name||'', client_phone||'', location||''], 
    function(err){
      if (err) return res.status(500).json({ error: err.message });
      console.log('[NOTIFY] Emergency job created id=', this.lastID, 'title=', title, 'lat=', lat, 'lon=', lon);
      return res.json({ ok: true, job_id: this.lastID });
    }
  );
});

// Return list of jobs. Optional query params: lat, lon, radius (km)
app.get('/api/jobs', (req, res) => {
  const { lat, lon, radius } = req.query;
  db.all('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 200', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let result = rows || [];
    if (lat && lon) {
      const la = parseFloat(lat); const lo = parseFloat(lon); const rad = parseFloat(radius) || 50;
      result = result.map(r => ({...r, distance_km: (r.lat && r.lon) ? haversine(la, lo, r.lat, r.lon) : null})).filter(r => r.distance_km === null || r.distance_km <= rad);
    }
    return res.json({ jobs: result });
  });
});

  // Delete a job (client) - no auth in demo
  app.delete('/api/jobs/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM jobs WHERE id = ?', [id], function(err){
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ ok: true, deleted: this.changes });
    });
  });

  // Worker accepts a job. Body: { worker_identifier: 'phone or id' }
  app.post('/api/jobs/:id/accept', (req, res) => {
    const id = req.params.id;
    const { worker_identifier } = req.body;
    db.run('UPDATE jobs SET accepted_by = ?, status = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?', [worker_identifier||null, 'accepted', id], function(err){
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ ok: true, job_id: id });
    });
  });

// Get all urgent jobs (for Worker Dashboard)
app.get('/api/jobs/urgent', (req, res) => {
  db.all(`SELECT 
    jobs.id, 
    jobs.title, 
    jobs.description, 
    jobs.pay as hourly_rate, 
    jobs.lat, 
    jobs.lon, 
    jobs.created_at,
    jobs.status,
    users.name as client_name,
    users.phone as client_phone,
    COALESCE(jobs.description, 'Location not specified') as location
  FROM jobs 
  LEFT JOIN users ON jobs.employer_id = users.id
  WHERE jobs.urgent = 1 AND jobs.status = 'open'
  ORDER BY jobs.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.json({ success: true, jobs: rows || [] });
  });
});

// Accept a job (Worker Dashboard)
app.post('/api/jobs/accept', (req, res) => {
  const { jobId } = req.body;
  
  if (!jobId) {
    return res.status(400).json({ success: false, error: 'Job ID required' });
  }
  
  db.run(
    'UPDATE jobs SET status = ?, accepted_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['accepted', jobId],
    function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
      console.log(`✅ Job ${jobId} accepted by worker`);
      return res.json({ success: true, message: 'Job accepted successfully' });
    }
  );
});

app.post('/api/rate', (req, res) => {
  const { worker_id, rating, comment } = req.body;
  db.run('INSERT INTO ratings (worker_id, rating, comment) VALUES (?,?,?)', [worker_id, rating, comment||''], function(err){
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ ok: true });
  });
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
  db.all('SELECT * FROM users ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ users: rows });
  });
});

app.post('/api/admin/verify/:id', (req, res) => {
  const id = req.params.id;
  db.run('UPDATE users SET verified = 1 WHERE id = ?', [id], function(err){
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ ok: true });
  });
});

// Admin: Delete user
app.delete('/api/admin/delete-user/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ ok: true, message: 'User deleted successfully' });
  });
});

// Admin: Update trust score
app.post('/api/admin/trust-score/:id', (req, res) => {
  const id = req.params.id;
  const { score } = req.body;
  
  if (score === undefined || score < 0 || score > 100) {
    return res.status(400).json({ error: 'Invalid trust score. Must be between 0 and 100' });
  }
  
  db.run('UPDATE users SET trust_score = ? WHERE id = ?', [score, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    return res.json({ ok: true, message: 'Trust score updated successfully' });
  });
});

// Toggle worker availability
app.post('/api/toggle-availability/:id', (req, res) => {
  const id = req.params.id;
  
  db.get('SELECT available FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    
    const newStatus = row.available ? 0 : 1;
    
    db.run('UPDATE users SET available = ? WHERE id = ?', [newStatus, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ ok: true, available: newStatus === 1 });
    });
  });
});

// Apply for a job
app.post('/api/apply-job', (req, res) => {
  const { jobId, workerPhone } = req.body;
  
  console.log('[APPLY JOB] Request received - Job ID:', jobId, 'Worker Phone:', workerPhone);
  
  if (!jobId || !workerPhone) {
    console.log('[APPLY JOB] Missing required fields');
    return res.status(400).json({ error: 'Job ID and worker phone required' });
  }
  
  // Find worker by phone
  db.get('SELECT id FROM users WHERE phone = ? AND role = "worker"', [workerPhone], (err, worker) => {
    if (err) {
      console.error('[APPLY JOB] Database error finding worker:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!worker) {
      console.log('[APPLY JOB] Worker not found for phone:', workerPhone);
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    console.log('[APPLY JOB] Worker found - ID:', worker.id, 'Phone:', workerPhone);
    
    // Check if already applied
    db.get('SELECT id FROM job_applications WHERE job_id = ? AND worker_id = ?', 
      [jobId, worker.id], (err, existing) => {
        if (err) {
          console.error('[APPLY JOB] Database error checking existing application:', err);
          return res.status(500).json({ error: err.message });
        }
        if (existing) {
          console.log('[APPLY JOB] Already applied - Application ID:', existing.id);
          return res.status(400).json({ error: 'Already applied to this job' });
        }
        
        // Create application
        console.log('[APPLY JOB] Creating new application - Job ID:', jobId, 'Worker ID:', worker.id);
        db.run(`INSERT INTO job_applications (job_id, worker_id, worker_phone, status) VALUES (?, ?, ?, 'pending')`,
          [jobId, worker.id, workerPhone], function(err) {
            if (err) {
              console.error('[APPLY JOB] Database error creating application:', err);
              return res.status(500).json({ error: err.message });
            }
            console.log('[APPLY JOB] ✓ Application created successfully - Application ID:', this.lastID);
            return res.json({ ok: true, applicationId: this.lastID });
          });
      });
  });
});

// Get job applications for a job
app.get('/api/job-applications/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  
  console.log('[GET APPLICATIONS] Fetching applications for Job ID:', jobId);
  
  db.all(`SELECT ja.*, u.name, u.phone, u.skills, u.trust_score, u.verified, u.hourly_rate 
          FROM job_applications ja 
          JOIN users u ON ja.worker_id = u.id 
          WHERE ja.job_id = ? 
          ORDER BY ja.created_at DESC`,
    [jobId], (err, rows) => {
      if (err) {
        console.error('[GET APPLICATIONS] Database error:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('[GET APPLICATIONS] Found', rows ? rows.length : 0, 'applications');
      if (rows && rows.length > 0) {
        console.log('[GET APPLICATIONS] Sample application:', rows[0]);
      }
      return res.json({ applications: rows || [] });
    });
});

// Accept a job application
app.post('/api/application/:applicationId/accept', (req, res) => {
  const applicationId = req.params.applicationId;
  
  console.log('[ACCEPT APPLICATION] Application ID:', applicationId);
  
  // Update application status to accepted
  db.run('UPDATE job_applications SET status = ? WHERE id = ?', 
    ['accepted', applicationId], function(err) {
      if (err) {
        console.error('[ACCEPT APPLICATION] Error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      // Get job_id from application to update job status
      db.get('SELECT job_id FROM job_applications WHERE id = ?', [applicationId], (err, app) => {
        if (!err && app) {
          db.run('UPDATE jobs SET status = ? WHERE id = ?', ['accepted', app.job_id]);
        }
      });
      
      console.log('[ACCEPT APPLICATION] ✓ Application accepted');
      return res.json({ ok: true });
    });
});

// Reject a job application
app.post('/api/application/:applicationId/reject', (req, res) => {
  const applicationId = req.params.applicationId;
  
  console.log('[REJECT APPLICATION] Application ID:', applicationId);
  
  // Update application status to rejected
  db.run('UPDATE job_applications SET status = ? WHERE id = ?', 
    ['rejected', applicationId], function(err) {
      if (err) {
        console.error('[REJECT APPLICATION] Error:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Application not found' });
      }
      
      console.log('[REJECT APPLICATION] ✓ Application rejected');
      return res.json({ ok: true });
    });
});

// Enhanced rating endpoint with client name
app.post('/api/rate-worker', (req, res) => {
  const { workerId, rating, comment, clientName } = req.body;
  
  if (!workerId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid worker ID and rating (1-5) required' });
  }
  
  db.run(`INSERT INTO ratings (worker_id, rating, comment, client_name) VALUES (?, ?, ?, ?)`,
    [workerId, rating, comment || '', clientName || 'Anonymous'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Update trust score based on average rating (keep it in 0-5 scale)
      db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE worker_id = ?',
        [workerId], (err, result) => {
          if (!err && result && result.avg_rating) {
            const trustScore = parseFloat(result.avg_rating.toFixed(1));
            db.run('UPDATE users SET trust_score = ? WHERE id = ?', [trustScore, workerId]);
          }
        });
      
      return res.json({ ok: true, ratingId: this.lastID });
    });
});

// Get reviews for a worker
app.get('/api/reviews/:workerId', (req, res) => {
  const workerId = req.params.workerId;
  
  db.all(`SELECT rating, comment, client_name, created_at 
          FROM ratings 
          WHERE user_id = ? 
          ORDER BY created_at DESC 
          LIMIT 10`,
    [workerId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ reviews: rows });
    });
});

// Enhanced rating endpoint with client name
app.post('/api/rate-worker', (req, res) => {
  const { workerId, rating, comment, clientName } = req.body;
  
  if (!workerId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid worker ID and rating (1-5) required' });
  }
  
  db.run(`INSERT INTO ratings (worker_id, rating, comment, client_name) VALUES (?, ?, ?, ?)`,
    [workerId, rating, comment || '', clientName || 'Anonymous'], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Update trust score based on average rating
      db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE worker_id = ?',
        [workerId], (err, result) => {
          if (!err && result) {
            const trustScore = Math.min(100, Math.round((result.avg_rating / 5) * 100));
            db.run('UPDATE users SET trust_score = ? WHERE id = ?', [trustScore, workerId]);
          }
        });
      
      return res.json({ ok: true, ratingId: this.lastID });
    });
});

// Toggle worker availability
app.post('/api/toggle-availability/:id', (req, res) => {
  const id = req.params.id;
  
  db.get('SELECT available FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    
    const newStatus = row.available ? 0 : 1;
    
    db.run('UPDATE users SET available = ? WHERE id = ?', [newStatus, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ ok: true, available: newStatus === 1 });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('QuickHire server running on port', PORT);
  console.log('Server accessible at http://localhost:' + PORT);
  console.log('Network access: Use your local IP address with port', PORT);
});
