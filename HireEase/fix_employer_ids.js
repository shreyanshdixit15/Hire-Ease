const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');

console.log('=== FIXING JOB EMPLOYER IDs ===\n');

// Update jobs 12 and 15 to have employer_id = 338
db.run('UPDATE jobs SET employer_id = ? WHERE id IN (12, 15)', [338], function(err) {
  if (err) {
    console.error('Error updating jobs:', err);
    db.close();
    return;
  }
  
  console.log(`✓ Updated ${this.changes} jobs to have employer_id = 338`);
  
  // Verify the update
  db.all('SELECT id, title, employer_id FROM jobs WHERE id IN (12, 15)', (err, jobs) => {
    if (err) {
      console.error('Error querying jobs:', err);
      db.close();
      return;
    }
    
    console.log('\nVerifying updated jobs:');
    jobs.forEach(job => {
      console.log(`- Job ID: ${job.id}, Title: ${job.title}, Employer ID: ${job.employer_id}`);
    });
    
    db.close();
    console.log('\n=== FIX COMPLETE ===');
  });
});
