const http = require('http');
http.get('http://localhost:3000/api/workers', res => {
  console.log('status', res.statusCode);
  let data='';
  res.on('data', c=> data+=c);
  res.on('end', ()=> {
    try{ const j = JSON.parse(data); console.log('workers length', (j.workers && j.workers.length) || 0); }
    catch(e){ console.error('parse error', e); console.log(data.slice(0,500)); }
  });
}).on('error', e=> { console.error('request error', e.message); process.exit(1); });
