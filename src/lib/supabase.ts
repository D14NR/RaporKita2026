import { createClient } from '@supabase/supabase-js';

// Default keys provided by the user
const DEFAULT_SUPABASE_URL = 'https://lcypcfnixgjeabhbyvef.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBjZm5peGdqZWFiaGJ5dmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzM0MTAsImV4cCI6MjA5NTM0OTQxMH0.gN80tAK3p_OgAtT00jj-elO6EkUZ1rab7aKNYvL-37M';

const DEFAULT_SUPABASE_URL_KBM = 'https://oqpblpjvqimozlfdvykw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY_KBM = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xcGJscGp2cWltb3psZmR2eWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDYyMzcsImV4cCI6MjA4OTMyMjIzN30.xZWJVi3HhofJe6083I_6qmogKQdQIO_kHx9o5Ofc3mc';

const DEFAULT_SUPABASE_URL_UJI = 'https://nkjqcypurlcvcgeinmvq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY_UJI = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ranFjeXB1cmxjdmNnZWlubXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2ODcsImV4cCI6MjA5NjI1OTY4N30.SZkqBdv0sGLuimwAo-2KTew6Y0oOgwLglaqCs7NfTXI';

// Read from env or use default
const metaEnv = (import.meta as any).env || {};
let supabaseUrl = DEFAULT_SUPABASE_URL;
const envUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.VITE_SUPABASE_LPS;
if (envUrl) {
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    supabaseUrl = envUrl;
  } else {
    supabaseUrl = `https://${envUrl}.supabase.co`;
  }
}

const supabaseKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.VITE_SUPABASE_ANON_KEY_LPS || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// KBM Supabase Client
let supabaseKbmUrl = DEFAULT_SUPABASE_URL_KBM;
const kbmEnvUrl = metaEnv.VITE_SUPABASE_URL_KBM;
if (kbmEnvUrl) {
  if (kbmEnvUrl.startsWith('http://') || kbmEnvUrl.startsWith('https://')) {
    supabaseKbmUrl = kbmEnvUrl;
  } else {
    supabaseKbmUrl = `https://${kbmEnvUrl}.supabase.co`;
  }
}

const supabaseKbmKey = metaEnv.VITE_SUPABASE_ANON_KEY_KBM || DEFAULT_SUPABASE_ANON_KEY_KBM;

export const supabaseKbm = createClient(supabaseKbmUrl, supabaseKbmKey);

// UJI MATERI Supabase Client
let supabaseUjiUrl = DEFAULT_SUPABASE_URL_UJI;
const ujiEnvUrl = metaEnv.VITE_SUPABASE_UJI || metaEnv.VITE_SUPABASE_URL_UJI;
if (ujiEnvUrl) {
  if (ujiEnvUrl.startsWith('http://') || ujiEnvUrl.startsWith('https://')) {
    supabaseUjiUrl = ujiEnvUrl;
  } else {
    supabaseUjiUrl = `https://${ujiEnvUrl}.supabase.co`;
  }
}

const supabaseUjiKey = metaEnv.VITE_SUPABASE_ANON_KEY_UJI || DEFAULT_SUPABASE_ANON_KEY_UJI;

export const supabaseUji = createClient(supabaseUjiUrl, supabaseUjiKey);

// SQL script to set up database in Supabase
export const DB_SETUP_SQL = `-- SCRIPT PEMBUATAN TABEL UNTUK RAPOR SISWA DIGITAL
-- Copy dan paste script ini di SQL Editor Supabase Anda.

-- 0. Tabel Langganan Web Push (push_subscriptions_siswa)
CREATE TABLE IF NOT EXISTS public.push_subscriptions_siswa (
    id TEXT PRIMARY KEY NOT NULL,
    nis TEXT NOT NULL,
    nama_siswa TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Tabel Utama Data Siswa (Sesuai Skema Anda)
CREATE TABLE IF NOT EXISTS public.data_siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(50) NOT NULL UNIQUE,
    nama VARCHAR(255) NOT NULL,
    tanggal_lahir DATE NULL,
    asal_sekolah VARCHAR(255) NULL,
    jenjang_studi VARCHAR(100) NULL,
    no_whatsapp_siswa VARCHAR(30) NULL,
    no_whatsapp_orang_tua VARCHAR(30) NULL,
    email VARCHAR(255) NULL,
    kelompok_kelas VARCHAR(255) NULL,
    cabang VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    id_sekolah UUID NULL,
    id_kelompok_kelas UUID NULL,
    mata_pelajaran VARCHAR NULL
);

-- Index Unik
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_siswa_new_nis ON public.data_siswa (nis);
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_siswa_new_uid ON public.data_siswa (id);

-- 2. Tabel Tambahan untuk Melengkapi Rapor
-- Tabel Siswa (Students) untuk Relasi ke tabel lainnya (bisa disinkronisasikan)
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY, -- NISN atau ID Siswa (sama dengan NIS)
    name VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025/2026',
    semester VARCHAR(10) NOT NULL DEFAULT 'Ganjil',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabel Jadwal KBM Reguler (Regular Schedule)
CREATE TABLE IF NOT EXISTS regular_schedule (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL, -- Senin, Selasa, dll
    subject VARCHAR(100) NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    classroom VARCHAR(50)
);

-- 3. Tabel Jadwal KBM Tambahan (Additional Schedule)
CREATE TABLE IF NOT EXISTS additional_schedule (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE,
    day VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    teacher VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Aktif' -- Aktif, Selesai, Batal
);

-- 4. Tabel Perkembangan Belajar & Presensi (Unified)
CREATE TABLE IF NOT EXISTS public.perkembangan_belajar (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nis CHARACTER VARYING(50) NULL,
    nama CHARACTER VARYING(255) NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    mata_pelajaran CHARACTER VARYING(255) NULL,
    materi_sub_bab TEXT NULL,
    kehadiran TEXT NULL,
    prosen_penguasaan NUMERIC(5, 2) NULL,
    prosen_penjelasan NUMERIC(5, 2) NULL,
    prosen_kondisi NUMERIC(5, 2) NULL,
    catatan_pengajar TEXT NULL,
    cabang CHARACTER VARYING(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    siswa_id UUID NULL,
    kode_unik CHARACTER VARYING NULL DEFAULT ''::CHARACTER VARYING,
    CONSTRAINT perkembangan_belajar_pkey PRIMARY KEY (id),
    CONSTRAINT perkembangan_belajar_kode_unik_key UNIQUE (kode_unik),
    CONSTRAINT unique_kode_unik UNIQUE (kode_unik),
    CONSTRAINT perkembangan_belajar_siswa_id_fkey FOREIGN KEY (siswa_id) REFERENCES public.data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 5. Tabel Nilai Evaluasi (nilai_evaluasi)
CREATE TABLE IF NOT EXISTS public.nilai_evaluasi (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nis CHARACTER VARYING(50) NULL,
    nama CHARACTER VARYING(255) NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    mata_pelajaran CHARACTER VARYING(255) NULL,
    sub_bab CHARACTER VARYING(255) NULL,
    nilai NUMERIC(5, 2) NULL,
    cabang CHARACTER VARYING(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    siswa_id UUID NULL,
    CONSTRAINT nilai_evaluasi_pkey PRIMARY KEY (id),
    CONSTRAINT nilai_evaluasi_siswa_id_fkey FOREIGN KEY (siswa_id) REFERENCES public.data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_nilai_evaluasi_nis ON public.nilai_evaluasi USING btree (nis);

-- 6. Tabel Nilai Standar / Rapor (nilai_standar)
CREATE TABLE IF NOT EXISTS public.nilai_standar (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nis CHARACTER VARYING(50) NULL,
    nama CHARACTER VARYING(255) NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jenis_tes CHARACTER VARYING(255) NULL,
    mata_pelajaran CHARACTER VARYING(255) NULL,
    nilai NUMERIC(5, 2) NULL,
    cabang CHARACTER VARYING(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    siswa_id UUID NULL,
    CONSTRAINT nilai_standar_pkey PRIMARY KEY (id),
    CONSTRAINT nilai_standar_siswa_id_fkey FOREIGN KEY (siswa_id) REFERENCES public.data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_nilai_standar_nis ON public.nilai_standar USING btree (nis);

-- 7. Tabel Nilai SNBT UTBK (nilai_snbt_utbk)
CREATE TABLE IF NOT EXISTS public.nilai_snbt_utbk (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    nis CHARACTER VARYING(50) NOT NULL,
    nama CHARACTER VARYING(255) NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    jenis_tes CHARACTER VARYING(100) NOT NULL,
    pu NUMERIC(5, 2) NULL,
    ppu NUMERIC(5, 2) NULL,
    pbm NUMERIC(5, 2) NULL,
    pk NUMERIC(5, 2) NULL,
    lib NUMERIC(5, 2) NULL,
    ling NUMERIC(5, 2) NULL,
    pm NUMERIC(5, 2) NULL,
    rerata NUMERIC(6, 2) NULL,
    total NUMERIC(8, 2) NULL,
    cabang CHARACTER VARYING(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    siswa_id UUID NULL,
    CONSTRAINT nilai_snbt_utbk_pkey PRIMARY KEY (id),
    CONSTRAINT nilai_snbt_utbk_siswa_id_fkey FOREIGN KEY (siswa_id) REFERENCES public.data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_nilai_snbt_utbk_nis ON public.nilai_snbt_utbk USING btree (nis);
CREATE INDEX IF NOT EXISTS idx_nilai_snbt_utbk_tanggal ON public.nilai_snbt_utbk USING btree (tanggal);
CREATE INDEX IF NOT EXISTS idx_nilai_snbt_utbk_jenis_tes ON public.nilai_snbt_utbk USING btree (jenis_tes);
CREATE INDEX IF NOT EXISTS idx_nilai_snbt_utbk_cabang ON public.nilai_snbt_utbk USING btree (cabang);

-- 8. Tabel Riwayat Pelayanan di Luar KBM (tambahan_pelayanan)
CREATE TABLE IF NOT EXISTS public.tambahan_pelayanan (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nis CHARACTER VARYING(50) NULL,
  nama CHARACTER VARYING(255) NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  mata_pelajaran CHARACTER VARYING(255) NULL,
  materi_sub_bab TEXT NULL,
  durasi CHARACTER VARYING(100) NULL,
  pengajar CHARACTER VARYING(255) NULL,
  cabang CHARACTER VARYING(100) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NULL,
  siswa_id UUID NULL,
  CONSTRAINT tambahan_pelayanan_pkey PRIMARY KEY (id),
  CONSTRAINT tambahan_pelayanan_siswa_id_fkey FOREIGN KEY (siswa_id) REFERENCES public.data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tambahan_pelayanan_nis ON public.tambahan_pelayanan USING btree (nis);
CREATE INDEX IF NOT EXISTS idx_tambahan_pelayanan_tanggal ON public.tambahan_pelayanan USING btree (tanggal);
CREATE INDEX IF NOT EXISTS idx_tambahan_pelayanan_cabang ON public.tambahan_pelayanan USING btree (cabang);

-- 9. Tabel Pengajar (pengajar)
CREATE TABLE IF NOT EXISTS public.pengajar (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  kode_pengajar TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  bidang_studi TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  no_whatsapp TEXT NOT NULL DEFAULT '',
  domisili TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL DEFAULT '' UNIQUE,
  password TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT pengajar_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_pengajar_created_at_asc_id ON public.pengajar USING btree (created_at, id);

-- 10. Tabel Permintaan Pelayanan / Booking (permintaan_pelayanan)
CREATE TABLE IF NOT EXISTS public.permintaan_pelayanan (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  nis TEXT NOT NULL,
  nama_siswa TEXT NOT NULL,
  cabang TEXT NULL,
  tanggal TEXT NOT NULL,
  mata_pelajaran TEXT NOT NULL,
  pengajar TEXT NOT NULL,
  keperluan TEXT NULL,
  status TEXT NULL DEFAULT 'Menunggu'::TEXT,
  tanggal_disetujui TEXT NULL,
  jam_disetujui TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT permintaan_pelayanan_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_permintaan_pelayanan_created_at ON public.permintaan_pelayanan USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_permintaan_pelayanan_created_at_desc_id_asc ON public.permintaan_pelayanan USING btree (created_at DESC, id);

-- INSERT DATA DEMO UNTUK TESTING
INSERT INTO public.data_siswa (id, nis, nama, tanggal_lahir, asal_sekolah, jenjang_studi, no_whatsapp_siswa, no_whatsapp_orang_tua, email, kelompok_kelas, cabang, mata_pelajaran)
VALUES
('f3b89063-ea08-4171-8ea8-3a25cf0c9a01', '60-444-001-6', 'Ahmad Rafli Fauzan', '2010-04-15', 'SMP Negeri 1 Jakarta', 'SMA', '081234567890', '081298765432', 'ahmad.rafli@example.com', 'X-IPA-1', 'Jakarta Selatan', 'Matematika Wajib, Fisika, Kimia, Biologi'),
('f3b89063-ea08-4171-8ea8-3a25cf0c9a02', '60-444-002-4', 'Siti Kamila Az-Zahra', '2009-08-20', 'SMP Negeri 2 Bandung', 'SMA', '085678901234', '085609876543', 'siti.kamila@example.com', 'XI-IPS-2', 'Bandung Dago', 'Sosiologi, Ekonomi, Geografi, Sejarah Indonesia')
ON CONFLICT (nis) DO NOTHING;

INSERT INTO students (id, name, class, parent_name, academic_year, semester) 
VALUES 
('60-444-001-6', 'Ahmad Rafli Fauzan', 'X-IPA-1', 'Budi Fauzan', '2025/2026', 'Ganjil'),
('60-444-002-4', 'Siti Kamila Az-Zahra', 'XI-IPS-2', 'Hendra Az-Zahra', '2025/2026', 'Ganjil')
ON CONFLICT (id) DO NOTHING;

-- Data KBM Reguler Ahmad
INSERT INTO regular_schedule (student_id, day, subject, time_start, time_end, teacher, classroom) VALUES
('60-444-001-6', 'Senin', 'Matematika Wajib', '07:30', '09:00', 'Budi Santoso, M.Pd', 'Ruang Kelas 10A'),
('60-444-001-6', 'Senin', 'Fisika', '09:15', '10:45', 'Dra. Endang Lestari', 'Lab Fisika'),
('60-444-001-6', 'Selasa', 'Bahasa Indonesia', '07:30', '09:00', 'Siti Rahma, S.Pd', 'Ruang Kelas 10A'),
('60-444-001-6', 'Selasa', 'Kimia', '09:15', '10:45', 'Rahmat Hidayat, M.Sc', 'Lab Kimia'),
('60-444-001-6', 'Rabu', 'Bahasa Inggris', '07:30', '09:00', 'John Doe, MA', 'Ruang Bahasa'),
('60-444-001-6', 'Rabu', 'Biologi', '09:15', '10:45', 'Dewi Lestari, S.Si', 'Lab Biologi'),
('60-444-001-6', 'Kamis', 'Pendidikan Agama', '07:30', '09:00', 'Ust. Ahmad Junaidi', 'Masjid Sekolah'),
('60-444-001-6', 'Kamis', 'Sejarah Indonesia', '09:15', '10:45', 'Yudiantara, M.Hum', 'Ruang Kelas 10A'),
('60-444-001-6', 'Jumat', 'Pendidikan Jasmani', '07:00', '08:30', 'Agus Prayogo, S.Or', 'Lapangan Olahraga')
ON CONFLICT DO NOTHING;

-- Data KBM Tambahan Ahmad
INSERT INTO additional_schedule (student_id, day, subject, time_start, time_end, teacher, status) VALUES
('60-444-001-6', 'Selasa', 'Bimbingan Kompetisi Kimia (Olimpiade)', '13:30', '15:00', 'Rahmat Hidayat, M.Sc', 'Aktif'),
('60-444-001-6', 'Kamis', 'Kelas Intensif Coding & Robotika', '14:00', '15:30', 'Zulkifli, S.T', 'Aktif')
ON CONFLICT DO NOTHING;

-- Data Perkembangan Belajar & Presensi Ahmad
INSERT INTO public.perkembangan_belajar (nis, nama, tanggal, mata_pelajaran, materi_sub_bab, kehadiran, prosen_penguasaan, prosen_penjelasan, prosen_kondisi, catatan_pengajar, cabang, kode_unik) VALUES
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-13', 'Matematika Wajib', 'Penguasaan Persamaan Kuadrat', 'Hadir', 90.00, 85.00, 95.00, 'Tepat waktu, aktif bertanya, dan merumuskan akar kuadrat dengan cepat.', 'Jakarta Selatan', 'init_pb_1'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-14', 'Fisika', 'Eksperimen Hukum Newton II', 'Hadir', 85.00, 80.00, 90.00, 'Mengikuti praktikum dengan sangat baik dan memahami hubungan gaya-massa.', 'Jakarta Selatan', 'init_pb_2'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-15', 'Bahasa Inggris', 'Percakapan Interaktif (Speaking)', 'Sakit', 60.00, 50.00, 40.00, 'Surat dokter terlampir (Demam).', 'Jakarta Selatan', 'init_pb_3'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-16', 'Pendidikan Agama', 'Etika & Akhlak Mulia', 'Hadir', 95.00, 90.00, 95.00, 'Membawa perlengkapan ibadah lengkap dan aktif berdiskusi.', 'Jakarta Selatan', 'init_pb_4'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-17', 'Pendidikan Jasmani', 'Kebugaran Kardio', 'Hadir', 88.00, 85.00, 90.00, 'Sangat bugar, lari 12 menit selesai dengan target prima.', 'Jakarta Selatan', 'init_pb_5')
ON CONFLICT (kode_unik) DO NOTHING;

-- Data Nilai Ahmad (nilai_evaluasi, nilai_standar, nilai_snbt_utbk)
INSERT INTO public.nilai_evaluasi (nis, nama, tanggal, mata_pelajaran, sub_bab, nilai, cabang) VALUES
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-13', 'Matematika Wajib', 'Persamaan Kuadrat', 90.00, 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-14', 'Matematika Wajib', 'Grafik Kuadrat', 85.00, 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-15', 'Fisika', 'Hukum Newton II', 95.00, 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-16', 'Fisika', 'Gerak Lurus', 88.00, 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-17', 'Bahasa Inggris', 'Writing Practice', 80.00, 'Jakarta Selatan');

INSERT INTO public.nilai_standar (nis, nama, tanggal, jenis_tes, mata_pelajaran, nilai, cabang) VALUES
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-10', 'PTS Ganjil', 'Matematika Wajib', 88.00, 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-10', 'PTS Ganjil', 'Fisika', 92.00, 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-10', 'PTS Ganjil', 'Bahasa Inggris', 85.00, 'Jakarta Selatan');

INSERT INTO public.nilai_snbt_utbk (nis, nama, tanggal, jenis_tes, pu, ppu, pbm, pk, lib, ling, pm, rerata, total, cabang) VALUES
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-18', 'Try Out UTBK #1', 650.00, 680.00, 710.00, 640.00, 720.00, 690.00, 660.00, 678.57, 4750.00, 'Jakarta Selatan');

-- Data Pelayanan Luar KBM Ahmad (tambahan_pelayanan)
INSERT INTO public.tambahan_pelayanan (nis, nama, tanggal, mata_pelajaran, materi_sub_bab, durasi, pengajar, cabang) VALUES
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-15', 'Matematika Wajib', 'Konsultasi tambahan Persamaan Kuadrat dan Tips Trik UTBK.', '60 Menit', 'Siti Aminah, S.Psi', 'Jakarta Selatan'),
('60-444-001-6', 'Ahmad Rafli Fauzan', '2026-07-17', 'Fisika', 'Latihan intensif Hukum Newton dan Dinamika Partikel.', '90 Menit', 'Drs. Hermawan', 'Jakarta Selatan');
`;
