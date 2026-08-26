const snbt = [
  { tanggal: "2026-08-20", jenis_tes: "TO 1", mata_pelajaran: "PU", scor: 80 },
  { tanggal: "2026-08-20", jenis_tes: "TO 1", mata_pelajaran: "PK", scor: 90 },
  { tanggal: "2026-08-25", jenis_tes: "TO 2", mata_pelajaran: "PU", scor: 85 }
];
const map = new Map();
snbt.forEach(row => {
  const key = `${row.tanggal}_${row.jenis_tes}`;
  if (!map.has(key)) map.set(key, { tanggal: row.tanggal, jenis_tes: row.jenis_tes, scores: [] });
  map.get(key).scores.push(row);
});
console.log(Array.from(map.values()));
