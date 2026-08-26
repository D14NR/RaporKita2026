const http = require('https');
http.get('https://raporkita-db.dianrizkisofiawan0431.workers.dev/db/jadwal_kbm', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const rawSchedules = JSON.parse(data).data || JSON.parse(data);
    const normalize = (val) => String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const activeCabang = 'Semarang 4';
    const activeKelas = '2 IPS C';
    const rawSubjectsStr = 'SOSIOLOGI, BAHASA INGGRIS TINGKAT LANJUT, EKONOMI, BAHASA INDONESIA, BAHASA INGGRIS, MATEMATIKA, SEJARAH';
    const studentSubjects = rawSubjectsStr.split(/[;,]/).map(s => String(s).trim().toLowerCase().replace(/\s+/g, ' ')).filter(Boolean);

    const isScheduleMatch = (row, targetJenis) => {
      if (!row) return false;
      const rowJenis = normalize(row.jenis_kbm || row.jenis || row.tipe);
      if (targetJenis === 'Reguler') {
        if (rowJenis.includes('khusus')) return false;
      } else {
        if (!rowJenis.includes('khusus')) return false;
      }

      if (activeCabang) {
        const normCabang = normalize(activeCabang);
        const rowCabang = normalize(row.cabang);
        if (rowCabang && !rowCabang.includes(normCabang) && !normCabang.includes(rowCabang)) {
          return false;
        }
      }

      const normActiveKelas = normalize(activeKelas);
      const rowKelasRaw = normalize(row.kelompok_kelas || row.kelas || row.sekolah);
      if (normActiveKelas) {
        if (!rowKelasRaw) return false;
        const rowItems = rowKelasRaw.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
        const matchesClass = rowItems.some(item => {
          if (item === normActiveKelas) return true;
          const cleanActive = normActiveKelas.replace(/[^a-z0-9]/g, '');
          const cleanItem = item.replace(/[^a-z0-9]/g, '');
          if (cleanItem === cleanActive) return true;
          const activeNums = normActiveKelas.match(/\d+/g) || [];
          const itemNums = item.match(/\d+/g) || [];
          if (activeNums.length > 0 && itemNums.length > 0) {
            if (activeNums[0] !== itemNums[0]) return false;
          }
          return cleanItem.includes(cleanActive) || cleanActive.includes(cleanItem);
        });
        if (!matchesClass) return false;
      }

      const rowSubjectRaw = row.mata_pelajaran || row.mapel || row.subject || row.nama_mapel || row.pelajaran;
      const rowSubject = normalize(rowSubjectRaw);
      if (!rowSubject || rowSubject === 'mata pelajaran' || rowSubject === '-') return false;
      
      if (studentSubjects.length > 0) {
        const subjectMatch = studentSubjects.some(subj => {
          if (!subj) return false;
          return rowSubject.includes(subj) || subj.includes(rowSubject);
        });
        if (!subjectMatch) return false;
      }
      return true;
    };

    const filtered = rawSchedules.filter(r => isScheduleMatch(r, 'Reguler'));
    console.log('Total matched:', filtered.length);
    console.log('Matched items dates:', filtered.map(r => r.tanggal));
  });
});
