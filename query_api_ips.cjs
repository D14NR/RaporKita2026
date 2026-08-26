const http = require('https');
http.get('https://raporkita-db.dianrizkisofiawan0431.workers.dev/db/jadwal_kbm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const items = parsed.data || parsed;
      const ips = items.filter(x => String(x.kelas).toLowerCase().includes('ips c') || String(x.kelas).toLowerCase().includes('2 ips'));
      console.log('Found:', ips.length);
      console.log(JSON.stringify(ips, null, 2));
    } catch(e) {}
  });
});
