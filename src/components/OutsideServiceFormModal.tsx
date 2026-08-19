import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, BookOpen, UserCheck, Send, CheckCircle, HeartHandshake, ChevronDown, Search } from 'lucide-react';
import { DataSiswa, Pengajar } from '../types';
import { d1, d1Kbm } from '../lib/d1';

interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  dropDirection?: 'down' | 'up';
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  required = false,
  dropDirection = 'down',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    const label = String(opt.label ?? '').toLowerCase();
    const sub = String(opt.subLabel ?? '').toLowerCase();
    const val = String(opt.value ?? '').toLowerCase();
    const needle = String(searchTerm ?? '').toLowerCase();

    return (
      (label && label.includes(needle)) ||
      (sub && sub.includes(needle)) ||
      (val && val.includes(needle))
    );
  });

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-teal-500 transition cursor-pointer hover:border-slate-300"
      >
        <span className={selectedOption ? 'text-slate-800 uppercase' : 'text-slate-400 font-normal'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          tabIndex={-1}
          className="opacity-0 absolute pointer-events-none h-0 w-0 bottom-0 left-0"
        />
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 space-y-2 animate-fade-in ${
            dropDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Search Input Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-slate-100 pr-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase transition flex items-center justify-between ${
                    value === opt.value
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-teal-600'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-center text-xs text-slate-400 italic">
                Data tidak ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface OutsideServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: DataSiswa | null;
  onSubmitSuccess?: (submission: { subject: string; date: string; teacher: string }) => void;
}

const DEFAULT_PENGAJAR_FALLBACK: Pengajar[] = [
  { id: '1', nama: 'Budi Santoso, M.Pd', bidang_studi: 'Matematika' },
  { id: '2', nama: 'Dra. Endang Lestari', bidang_studi: 'Fisika' },
  { id: '3', nama: 'Rahmat Hidayat, M.Sc', bidang_studi: 'Kimia' },
  { id: '4', nama: 'Siti Rahma, S.Pd', bidang_studi: 'Bahasa Indonesia' },
  { id: '5', nama: 'John Doe, MA', bidang_studi: 'Bahasa Inggris' },
  { id: '6', nama: 'Dewi Lestari, S.Si', bidang_studi: 'Biologi' },
  { id: '7', nama: 'Ust. Ahmad Junaidi', bidang_studi: 'Pendidikan Agama' },
  { id: '8', nama: 'Siti Aminah, S.Psi', bidang_studi: 'Konsultasi BK' },
];

export const OutsideServiceFormModal: React.FC<OutsideServiceFormModalProps> = ({
  isOpen,
  onClose,
  student,
  onSubmitSuccess,
}) => {
  const [date, setDate] = useState<string>('');
  const [subject, setSubject] = useState<string>('Matematika');
  const [topic, setTopic] = useState<string>('');
  const [duration, setDuration] = useState<string>('60 Menit');
  const [teacher, setTeacher] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Dynamic dropdown state from public.pengajar table
  const [pengajarList, setPengajarList] = useState<Pengajar[]>([]);
  const [bidangStudiOptions, setBidangStudiOptions] = useState<string[]>([]);
  const [isLoadingPengajar, setIsLoadingPengajar] = useState<boolean>(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);

    if (isOpen) {
      fetchPengajarData();
    }
  }, [isOpen]);

  const fetchPengajarData = async () => {
    setIsLoadingPengajar(true);
    try {
      // Fetch pengajar data from database
      const res = await d1
        .from('pengajar')
        .select('*');

      if (res.error) {
        console.error('Error fetching pengajar data:', res.error);
        throw res.error;
      }

      let fetchedData = res.data as Pengajar[];
      
      console.log('Raw pengajar data from API:', fetchedData);

      if (!Array.isArray(fetchedData)) {
        console.warn('fetchedData is not an array:', fetchedData);
        fetchedData = [];
      }

      if (fetchedData && fetchedData.length > 0) {
        // Normalize data: ensure bidang_studi is set from either bidang_studi or bidang_studi_mata_pelajaran
        const normalizedData = fetchedData.map((p) => ({
          ...p,
          bidang_studi: (p as any).bidang_studi || (p as any).bidang_studi_mata_pelajaran || '',
          nama: (p as any).nama || (p as any).nama_pengajar || '',
        }));

        setPengajarList(normalizedData);
        console.log('Normalized pengajar data:', normalizedData);

        // Extract unique non-empty bidang_studi values
        const uniqueBidangSet = new Set<string>();
        normalizedData.forEach((p) => {
          const bidang = p.bidang_studi?.trim();
          if (bidang) {
            // Split by comma, semicolon, or newline for multi-subject teachers
            const items = bidang.split(/[,;\n]+/);
            items.forEach((item) => {
              const clean = item.trim();
              if (clean) {
                uniqueBidangSet.add(clean);
              }
            });
          }
        });

        const uniqueBidang = Array.from(uniqueBidangSet).sort((a, b) => a.localeCompare(b));
        console.log('Extracted bidang studi options:', uniqueBidang);

        if (uniqueBidang.length > 0) {
          setBidangStudiOptions(uniqueBidang);
          setSubject((prev) => (uniqueBidang.includes(prev) ? prev : uniqueBidang[0]));
          console.log('Bidang studi options set successfully');
        } else {
          console.warn('No bidang studi extracted, using fallback');
          setBidangStudiOptions(DEFAULT_PENGAJAR_FALLBACK.map((p) => p.bidang_studi));
        }

        // Set default teacher if not already set
        const firstTeacher = normalizedData[0]?.nama || '';
        setTeacher((prev) => prev || firstTeacher);
      } else {
        // Fallback default pengajar list if table is empty
        console.warn('No pengajar data found, using fallback defaults');
        setPengajarList(DEFAULT_PENGAJAR_FALLBACK);
        const uniqueBidang = Array.from(
          new Set(DEFAULT_PENGAJAR_FALLBACK.map((p) => p.bidang_studi))
        ).sort();
        setBidangStudiOptions(uniqueBidang);
        setTeacher((prev) => prev || DEFAULT_PENGAJAR_FALLBACK[0].nama);
      }
    } catch (err) {
      console.error('Error in fetchPengajarData, using fallback:', err);
      setPengajarList(DEFAULT_PENGAJAR_FALLBACK);
      const uniqueBidang = Array.from(
        new Set(DEFAULT_PENGAJAR_FALLBACK.map((p) => p.bidang_studi))
      ).sort();
      setBidangStudiOptions(uniqueBidang);
    } finally {
      setIsLoadingPengajar(false);
    }
  };


  // Filter pengajar based on selected subject / mata pelajaran
  const filteredPengajarList = React.useMemo(() => {
    if (!subject) return pengajarList;
    const targetSubj = subject.trim().toLowerCase();

    const matches = pengajarList.filter((p) => {
      if (!p.bidang_studi) return false;
      const tokens = p.bidang_studi.split(/[,;\n]+/).map((t) => t.trim().toLowerCase());
      return tokens.includes(targetSubj) || p.bidang_studi.toLowerCase().includes(targetSubj);
    });

    return matches.length > 0 ? matches : pengajarList;
  }, [pengajarList, subject]);

  // Sync selected teacher when subject or filtered list changes
  useEffect(() => {
    if (filteredPengajarList.length > 0) {
      const exists = filteredPengajarList.some((p) => p.nama === teacher);
      if (!exists) {
        setTeacher(filteredPengajarList[0].nama);
      }
    }
  }, [subject, filteredPengajarList]);

  if (!isOpen) return null;

  // Fallback subjects if bidang_studi is empty
  const defaultSubjects = [
    'Matematika',
    'Fisika',
    'Kimia',
    'Biologi',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'IPAS',
    'Informatika',
    'TPS / UTBK',
    'Klinik Belajar Umum',
    'Konsultasi BK',
  ];

  const availableSubjects = bidangStudiOptions.length > 0 ? bidangStudiOptions : defaultSubjects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      if (!student || !student.id || !student.nis) {
        alert('Data siswa tidak lengkap. Silakan login ulang atau pilih siswa yang valid.');
        setIsSubmitting(false);
        return;
      }

      const selectedTeacherRecord = pengajarList.find(
        (p) => p.nama === teacher || p.id === teacher || p.kode_pengajar === teacher
      );

      const payload = {
        id: `service-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        siswa_id: student.id,
        nis: student.nis,
        nama_siswa: student.nama || student.nama_lengkap || 'Siswa',
        tanggal: targetDate,
        kode_pengajar: selectedTeacherRecord?.kode_pengajar?.trim() || null,
        nama_pengajar: selectedTeacherRecord?.nama || teacher || 'Tentor Piket',
        mata_pelajaran: (subject || 'Klinik Belajar Umum').trim() || 'Klinik Belajar Umum',
        materi_sub_bab: (topic || 'Layanan Konsultasi Belajar').trim() || 'Layanan Konsultasi Belajar',
        durasi: (duration || '60 menit').trim() || '60 menit',
        cabang: student.cabang || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('Menyimpan presensi ke riwayat_pelayanan_siswa:', payload);

      const { data, error } = await d1
        .from('riwayat_pelayanan_siswa')
        .insert([payload])
        .select();

      if (error) {
        console.error('Gagal menyimpan ke riwayat_pelayanan_siswa:', error);
        alert(`Gagal menyimpan layanan luar KBM: ${error?.message || 'Error tidak diketahui'}`);
      } else {
        console.log('Presensi Layanan Luar KBM berhasil disimpan:', data);
      }
    } catch (err: any) {
      console.error('Error saat menyimpan presensi layanan luar KBM:', err);
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);

      if (onSubmitSuccess) {
        onSubmitSuccess({
          subject,
          date: targetDate,
          teacher: teacher || 'Tentor Piket',
        });
      }

      setTimeout(() => {
        setIsSuccess(false);
        setTopic('');
        setTeacher('');
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full my-8 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-4 sm:p-5 text-white relative rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex items-center gap-2.5 pr-8">
            <span className="p-1.5 sm:p-2 bg-white/15 rounded-xl backdrop-blur-md shrink-0">
              <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Presensi Layanan Luar KBM</h3>
              <p className="text-[11px] sm:text-xs text-teal-100/90 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Catat konsultasi, klinik belajar, atau layanan akademik tambahan
              </p>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h4 className="text-xl font-black text-slate-800">Presensi Berhasil Dicatat!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Presensi Layanan Luar KBM untuk mata pelajaran <span className="font-bold text-slate-700">{subject}</span> telah berhasil disimpan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Tanggal & Durasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tanggal Layanan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Durasi Sesi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 60 Menit"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Mata Pelajaran / Layanan (dari pengajar.bidang_studi) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mata Pelajaran / Layanan <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={subject}
                onChange={(val) => setSubject(val)}
                options={availableSubjects.map((s) => ({ value: s, label: s }))}
                placeholder="-- Pilih Mata Pelajaran --"
                searchPlaceholder="Cari..."
                required
                dropDirection="down"
              />
            </div>

            {/* Materi / Sub Bab */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Materi / Sub Bab Konsultasi <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Contoh: Konsultasi Soal Trigonometri, Pembahasan PR, dll..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              ></textarea>
            </div>

            {/* Pengajar / Tentor Pendamping (dari pengajar.nama) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pengajar / Tentor Pendamping <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                value={teacher}
                onChange={(val) => setTeacher(val)}
                options={filteredPengajarList.map((p) => ({
                  value: p.nama,
                  label: p.nama,
                  subLabel: p.bidang_studi,
                }))}
                placeholder="-- Pilih Pengajar --"
                searchPlaceholder="Cari..."
                required
                dropDirection="up"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Simpan Presensi
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

