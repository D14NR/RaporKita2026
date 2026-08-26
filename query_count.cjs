const http = require('https');
http.get('https://raporkita-db.dianrizkisofiawan0431.workers.dev/db/jadwal_kbm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const items = parsed.data || parsed;
      console.log('Total items:', items.length);
    } catch(e) {}
  });
});
