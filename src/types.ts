export interface Student {
  id: string; // NISN / Student ID
  name: string;
  class: string;
  parent_name: string;
  academic_year: string;
  semester: string;
}

export interface DataSiswa {
  id: string;
  nis: string;
  nama: string;
  tanggal_lahir?: string; // format 'YYYY-MM-DD'
  asal_sekolah?: string;
  jenjang_studi?: string;
  no_whatsapp_siswa?: string;
  no_whatsapp_orang_tua?: string;
  email?: string;
  kelompok_kelas?: string;
  cabang?: string;
  created_at?: string;
  updated_at?: string;
  id_sekolah?: string;
  id_kelompok_kelas?: string;
  mata_pelajaran?: string;
}

export interface RegularSchedule {
  id: string | number;
  student_id: string;
  day: string;
  subject: string;
  time_start: string;
  time_end: string;
  teacher: string;
  classroom?: string;
  tanggal?: string;
  kelas?: string;
}

export interface AdditionalSchedule {
  id: number;
  student_id: string;
  day: string;
  subject: string;
  time_start: string;
  time_end: string;
  teacher: string;
  status: string; // e.g. 'Aktif', 'Selesai', 'Batal'
  tanggal?: string;
  kelas?: string;
}

export interface Attendance {
  id: number;
  student_id: string;
  date: string;
  subject?: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';
  notes?: string;
}

export interface LearningProgress {
  id: number;
  student_id: string;
  date: string;
  subject: string;
  progress_title: string;
  status: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Butuh Perhatian';
  notes?: string;
  penguasaan?: number;
  penjelasan?: number;
  kondisi?: number;
}

export interface Grade {
  id: number;
  student_id: string;
  subject: string;
  type: string;
  score: number;
  weight?: string;
  notes?: string;
}

export interface NilaiEvaluasi {
  id: string;
  nis: string;
  nama: string;
  tanggal: string;
  mata_pelajaran: string;
  sub_bab: string;
  nilai: number;
  cabang?: string;
  created_at?: string;
  updated_at?: string;
  siswa_id?: string;
}

export interface NilaiSnbtUtbk {
  id: string;
  nis: string;
  nama: string;
  tanggal: string;
  jenis_tes: string;
  pu?: number; // Penalaran Umum
  ppu?: number; // Pengetahuan & Pemahaman Umum
  pbm?: number; // Pemahaman Bacaan & Menulis
  pk?: number; // Pengetahuan Kuantitatif
  lib?: number; // Literasi Bahasa Indonesia
  ling?: number; // Literasi Bahasa Inggris
  pm?: number; // Penalaran Matematika
  rerata?: number;
  total?: number;
  cabang?: string;
  created_at?: string;
  updated_at?: string;
  siswa_id?: string;
}

export interface NilaiStandar {
  id: string;
  nis: string;
  nama: string;
  tanggal: string;
  jenis_tes: string;
  mata_pelajaran: string;
  nilai: number;
  cabang?: string;
  created_at?: string;
  updated_at?: string;
  siswa_id?: string;
}

export interface OutsideService {
  id: string;
  nis: string;
  nama?: string;
  tanggal: string;
  mata_pelajaran?: string;
  materi_sub_bab?: string;
  durasi?: string;
  pengajar?: string;
  cabang?: string;
  created_at?: string;
  updated_at?: string;
  siswa_id?: string;
}

export interface Pengajar {
  id: string;
  kode_pengajar?: string;
  nama: string;
  bidang_studi: string;
  email?: string;
  no_whatsapp?: string;
  domisili?: string;
  username?: string;
}

export interface PermintaanPelayanan {
  id: string;
  nis: string;
  nama_siswa?: string;
  nama?: string;
  cabang?: string;
  tanggal: string;
  mata_pelajaran: string;
  pengajar: string;
  keperluan?: string;
  status?: 'Menunggu' | 'Disetujui' | 'Ditolak' | string;
  tanggal_disetujui?: string;
  jam_disetujui?: string;
  created_at?: string;
  updated_at?: string;
}


