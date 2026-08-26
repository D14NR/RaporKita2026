const normalize = (val) => String(val || '').trim().toLowerCase().replace(/\s+/g, ' ');

const row = {
  "id": "5f8ba40d-2a41-475d-bce5-e96a9e879dcd",
  "cabang": "Semarang 1",
  "kelas": "1 SMA INSTINDO",
  "sekolah": "SMA INSTITUT INDONESIA SEMARANG",
  "jenjang_studi": "1 SMA",
  "mata_pelajaran": "GEOGRAFI",
  "jenis_kbm": "Khusus"
};

const activeCabang = "Semarang 1";
const activeKelas = "1 SMA";
const activeJenjang = "1 SMA";
const activeSekolah = "SMA INSTITUT INDONESIA SEMARANG";
const studentSubjects = ["GEOGRAFI"].map(normalize);

const isScheduleMatch = (row, targetJenis) => {
  if (!row) return false;
  
  const rowJenis = normalize(row.jenis_kbm || row.jenis || row.tipe);
  if (rowJenis) {
    if (targetJenis === 'Reguler' && rowJenis.includes('khusus')) return false;
    if (targetJenis === 'Khusus' && !rowJenis.includes('khusus') && rowJenis !== 'khusus') return false;
  }

  // 2. Check Cabang
  if (activeCabang) {
    const normCabang = normalize(activeCabang);
    const rowCabang = normalize(row.cabang);
    if (rowCabang && !rowCabang.includes(normCabang) && !normCabang.includes(rowCabang)) {
      return false;
    }
  }

  if (targetJenis === 'Reguler') {
    // 3. Strict Check Kelompok Kelas (Kelompok Kelas matches class in KBM schedule table)
    const normActiveKelas = normalize(activeKelas);
    const rowKelasRaw = normalize(row.kelompok_kelas || row.kelas || row.sekolah);

    if (normActiveKelas) {
      if (!rowKelasRaw) {
        return false;
      }
      const rowItems = rowKelasRaw.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
      const matchesClass = rowItems.some(item => {
        if (item === normActiveKelas) return true;
        
        const cleanActive = normActiveKelas.replace(/[^a-z0-9]/g, '');
        const cleanItem = item.replace(/[^a-z0-9]/g, '');
        
        if (cleanItem === cleanActive) return true;

        // Ensure grade number matches if present
        const activeNums = normActiveKelas.match(/\d+/g) || [];
        const itemNums = item.match(/\d+/g) || [];
        if (activeNums.length > 0 && itemNums.length > 0) {
          if (activeNums[0] !== itemNums[0]) {
            return false;
          }
        }

        return cleanItem.includes(cleanActive) || cleanActive.includes(cleanItem);
      });

      if (!matchesClass) {
        return false;
      }
    }
  } else {
    // targetJenis === 'Khusus'
    // check Jenjang Studi
    const normActiveJenjang = normalize(activeJenjang);
    const rowJenjangRaw = normalize(row.jenjang_studi || row.jenjang);
    
    if (normActiveJenjang) {
      if (!rowJenjangRaw || !rowJenjangRaw.includes(normActiveJenjang)) {
        return false;
      }
    }
    
    // check Sekolah
    const normActiveSekolah = normalize(activeSekolah);
    const rowSekolahRaw = normalize(row.sekolah || row.asal_sekolah);
    
    if (normActiveSekolah) {
      if (!rowSekolahRaw) {
        return false;
      }
      const cleanActiveSekolah = normActiveSekolah.replace(/[^a-z0-9]/g, '');
      const cleanRowSekolah = rowSekolahRaw.replace(/[^a-z0-9]/g, '');
      if (!cleanRowSekolah.includes(cleanActiveSekolah) && !cleanActiveSekolah.includes(cleanRowSekolah)) {
        return false;
      }
    }
  }

  // 4. Check Mata Pelajaran yang dipilih
  const rowSubjectRaw = row.mata_pelajaran || row.mapel || row.subject || row.nama_mapel || row.pelajaran;
  const rowSubject = normalize(rowSubjectRaw);

  if (!rowSubject || rowSubject === 'mata pelajaran' || rowSubject === '-') {
    return false;
  }

  if (studentSubjects.length > 0) {
    const subjectMatch = studentSubjects.some(subj => {
      if (!subj) return false;
      return rowSubject.includes(subj) || subj.includes(rowSubject);
    });
    if (!subjectMatch) return false;
  }

  return true;
};

console.log(isScheduleMatch(row, 'Khusus'));
