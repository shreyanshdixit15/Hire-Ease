// Quick script to add test urgent jobs to the database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbFile);

const testJobs = [
  {
    title: 'Emergency Plumber Needed',
    description: 'Bathroom pipe burst! Need immediate help to fix the leak.',
    pay: '800',
    client_name: 'Rajesh Kumar',
    client_phone: '+919876543210',
    location: 'Sector 15, Noida',
    urgent: 1
  },
  {
    title: 'Urgent Electrician Required',
    description: 'Power outage in entire house. Need electrical wiring inspection and repair.',
    pay: '600',
    client_name: 'Priya Sharma',
    client_phone: '+919876543211',
    location: 'Greater Kailash, Delhi',
    urgent: 1
  },
  {
    title: 'Carpenter Needed Today',
    description: 'Door lock broken, need immediate repair before evening.',
    pay: '500',
    client_name: 'Amit Singh',
    client_phone: '+919876543212',
    location: 'Dwarka, Delhi',
    urgent: 1
  },
  {
    title: 'AC Repair Urgent',
    description: 'Air conditioner stopped working in summer heat. Please come ASAP!',
    pay: '1000',
    client_name: 'Neha Verma',
    client_phone: '+919876543213',
    location: 'Saket, Delhi',
    urgent: 1
  }
];

console.log('Adding test urgent jobs...');

testJobs.forEach((job, index) => {
  db.run(
    `INSERT INTO jobs (title, description, pay, client_name, client_phone, location, urgent, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'))`,
    [job.title, job.description, job.pay, job.client_name, job.client_phone, job.location, job.urgent],
    function(err) {
      if (err) {
        console.error(`Error adding job ${index + 1}:`, err.message);
      } else {
        console.log(`✅ Added: ${job.title} (ID: ${this.lastID})`);
      }
      
      if (index === testJobs.length - 1) {
        console.log('\n✨ All test jobs added! Check Worker Dashboard.');
        db.close();
      }
    }
  );
});
