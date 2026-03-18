const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');

console.log('=== CHECKING JOB APPLICATIONS DATABASE ===\n');

// Check job_applications table
db.all('SELECT * FROM job_applications', (err, rows) => {
  if (err) {
    console.error('Error querying job_applications:', err);
    return;
  }
  
  console.log(`Total applications in database: ${rows ? rows.length : 0}`);
  
  if (rows && rows.length > 0) {
    console.log('\nApplications:');
    rows.forEach((app, index) => {
      console.log(`${index + 1}. Application ID: ${app.id}, Job ID: ${app.job_id}, Worker ID: ${app.worker_id}, Status: ${app.status}`);
    });
  } else {
    console.log('No applications found in database');
  }
  
  // Check jobs table
  db.all('SELECT id, title, employer_id, created_at FROM jobs', (err, jobs) => {
    if (err) {
      console.error('Error querying jobs:', err);
      return;
    }
    
    console.log(`\nTotal jobs in database: ${jobs ? jobs.length : 0}`);
    
    if (jobs && jobs.length > 0) {
      console.log('\nJobs:');
      jobs.forEach((job, index) => {
        console.log(`${index + 1}. Job ID: ${job.id}, Title: ${job.title}, Employer ID: ${job.employer_id}`);
      });
    }
    
    // Check users table
    db.all('SELECT id, name, phone, role FROM users', (err, users) => {
      if (err) {
        console.error('Error querying users:', err);
        db.close();
        return;
      }
      
      console.log(`\nTotal users in database: ${users ? users.length : 0}`);
      
      if (users && users.length > 0) {
        console.log('\nUsers:');
        users.forEach((user, index) => {
          console.log(`${index + 1}. User ID: ${user.id}, Name: ${user.name}, Phone: ${user.phone}, Role: ${user.role}`);
        });
      }
      
      db.close();
      console.log('\n=== DATABASE CHECK COMPLETE ===');
    });
  });
});
