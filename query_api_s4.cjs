const http = require('https');
http.get('https://raporkita-db.dianrizkisofiawan0431.workers.dev/db/jadwal_kbm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const items = parsed.data || parsed;
      const s4 = items.filter(x => String(x.cabang).toLowerCase().includes('semarang 4'));
      console.log('Semarang 4 Total:', s4.length);
      const uniqueKelas = [...new Set(s4.map(x => x.kelas))];
      console.log('Semarang 4 Kelas:', uniqueKelas);
    } catch(e) {}
  });
});
