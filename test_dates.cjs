const http = require('https');
http.get('https://raporkita-db.dianrizkisofiawan0431.workers.dev/db/jadwal_kbm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const items = parsed.data || parsed;
      const filtered = items.filter(x => String(x.cabang).toLowerCase().includes('semarang 4') && String(x.kelas).toLowerCase() === '2 ips c');
      console.log('Matches:', filtered.length);
      console.log(JSON.stringify(filtered.map(x => x.tanggal), null, 2));
    } catch(e) {}
  });
});
