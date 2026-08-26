const http = require('https');
http.get('https://raporkita-db.dianrizkisofiawan0431.workers.dev/db/jadwal_kbm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed.data || parsed, null, 2).substring(0, 1500));
    } catch(e) {
      console.log(data.substring(0, 500));
    }
  });
});
