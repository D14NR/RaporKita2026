import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, BookOpen, Send, CheckCircle, CalendarDays, ChevronDown, Search, MessageSquare } from 'lucide-react';
import { DataSiswa, Pengajar, PermintaanPelayanan } from '../types';
import { supabase, supabaseKbm } from '../lib/supabase';

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

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer hover:border-slate-300"
      >
        <span className={selectedOption ? 'text-slate-800 uppercase' : 'text-slate-400 font-normal'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Hidden input for HTML form validation */}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
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

interface BookingServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: DataSiswa | null;
  onSubmitSuccess?: (booking: PermintaanPelayanan) => void;
}

const DEFAULT_PENGAJAR_FALLBACK: Pengajar[] = [
  { id: '1', nama: 'Budi Santoso, M.Pd', bidang_studi: 'Matematika' },
  { id: '2', nama: 'Dra. Endang Lestari', bidang_studi: 'Fisika' },
  { id: '3', nama: 'Rahmat Hidayat, M.Sc', bidang_studi: 'Kimia' },
  { id: '4', nama: 'Siti Rahma, S.Pd', bidang_studi: 'Bahasa Indonesia' },
  { id: '5', nama: 'John Doe, MA', bidang_studi: 'Bahasa Inggris' },
  { id: '6', nama: 'Dewi Lestari, S.Si', bidang_studi: 'Biologi' },
  { id: '7', nama: 'Siti Aminah, S.Psi', bidang_studi: 'Konsultasi BK' },
];

export const BookingServiceFormModal: React.FC<BookingServiceFormModalProps> = ({
  isOpen,
  onClose,
  student,
  onSubmitSuccess,
}) => {
  const [date, setDate] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [teacher, setTeacher] = useState<string>('');
  const [keperluan, setKeperluan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Dynamic dropdown state from public.pengajar
  const [pengajarList, setPengajarList] = useState<Pengajar[]>([]);
  const [bidangStudiOptions, setBidangStudiOptions] = useState<string[]>([]);
  const [isLoadingPengajar, setIsLoadingPengajar] = useState<boolean>(false);

  useEffect(() => {
    // Tomorrow date by default for booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0];
    setDate(tomorrowFormatted);

    if (isOpen) {
      fetchPengajarData();
    }
  }, [isOpen]);

  const fetchPengajarData = async () => {
    setIsLoadingPengajar(true);
    try {
      let fetchedData: Pengajar[] | null = null;

      const resMain = await supabase
        .from('pengajar')
        .select('*')
        .order('nama', { ascending: true });

      if (!resMain.error && resMain.data && resMain.data.length > 0) {
        fetchedData = resMain.data;
      } else {
        const resKbm = await supabaseKbm
          .from('pengajar')
          .select('*')
          .order('nama', { ascending: true });

        if (!resKbm.error && resKbm.data && resKbm.data.length > 0) {
          fetchedData = resKbm.data;
        }
      }

      if (fetchedData && fetchedData.length > 0) {
        setPengajarList(fetchedData);

        const uniqueBidangSet = new Set<string>();
        fetchedData.forEach((p) => {
          if (p.bidang_studi) {
            const items = p.bidang_studi.split(/[,;\n]+/);
            items.forEach((item) => {
              const clean = item.trim();
              if (clean) {
                uniqueBidangSet.add(clean);
              }
            });
          }
        });
        const uniqueBidang = Array.from(uniqueBidangSet).sort((a, b) => a.localeCompare(b));

        if (uniqueBidang.length > 0) {
          setBidangStudiOptions(uniqueBidang);
          setSubject((prev) => (uniqueBidang.includes(prev) ? prev : uniqueBidang[0]));
        }

        setTeacher((prev) => prev || (fetchedData && fetchedData[0]?.nama) || '');
      } else {
        setPengajarList(DEFAULT_PENGAJAR_FALLBACK);
        const uniqueBidang = Array.from(
          new Set(DEFAULT_PENGAJAR_FALLBACK.map((p) => p.bidang_studi))
        ).sort();
        setBidangStudiOptions(uniqueBidang);
        setTeacher((prev) => prev || DEFAULT_PENGAJAR_FALLBACK[0].nama);
      }
    } catch (err) {
      console.warn('Fallback fetching pengajar for booking:', err);
      setPengajarList(DEFAULT_PENGAJAR_FALLBACK);
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

    const studentName = student?.nama || 'Siswa';
    const basePayload = {
      nis: student?.nis || 'S-DEFAULT',
      cabang: student?.cabang || 'Pusat',
      tanggal: date,
      mata_pelajaran: subject,
      pengajar: teacher,
      keperluan: keperluan || 'Permintaan Reservasi Jadwal Layanan',
      status: 'Menunggu',
    };

    const payloadNamaSiswa = { ...basePayload, nama_siswa: studentName };
    const payloadBoth = { ...basePayload, nama_siswa: studentName, nama: studentName };
    const payloadNama = { ...basePayload, nama: studentName };

    try {
      let dbData: any = null;
      let dbError: any = null;
      let usedKbmDb = false;

      // 1. Primary insert into KBM database ('supabaseKbm' client) using exact schema (nama_siswa)
      const tryInsert = async (client: typeof supabaseKbm, p: any) => {
        const { data, error } = await client.from('permintaan_pelayanan').insert([p]).select();
        if (!error && data && data.length > 0) return { data: data[0], error: null };
        const { error: plainErr } = await client.from('permintaan_pelayanan').insert([p]);
        if (!plainErr) return { data: p, error: null };
        return { data: null, error: error || plainErr };
      };

      try {
        let res = await tryInsert(supabaseKbm, payloadNamaSiswa);
        if (res.error) res = await tryInsert(supabaseKbm, payloadBoth);
        if (res.error) res = await tryInsert(supabaseKbm, payloadNama);

        if (!res.error) {
          dbData = res.data;
          usedKbmDb = true;
          console.log('Successfully saved to KBM database (supabaseKbm):', dbData);
        } else {
          dbError = res.error;
        }
      } catch (kbmErr: any) {
        dbError = kbmErr;
        console.warn('Exception during KBM database insert:', kbmErr);
      }

      // 2. Fallback to main database ('supabase' client) if KBM database insert failed
      if (!usedKbmDb) {
        console.log('Trying fallback insert to main database (supabase)...');
        try {
          let resMain = await tryInsert(supabase, payloadNamaSiswa);
          if (resMain.error) resMain = await tryInsert(supabase, payloadBoth);
          if (resMain.error) resMain = await tryInsert(supabase, payloadNama);

          if (!resMain.error) {
            dbData = resMain.data;
            dbError = null;
          } else {
            dbError = resMain.error;
          }
        } catch (mainErr: any) {
          dbError = mainErr;
        }

        if (dbError) {
          console.error('All insert attempts failed:', dbError);
          alert(`Gagal mengirim pengajuan reservasi ke database: ${dbError.message || 'Error tidak diketahui'}`);
          setIsSubmitting(false);
          return;
        }
      }

      const createdBooking: PermintaanPelayanan = dbData || {
        id: `pp-${Date.now()}`,
        ...payloadNamaSiswa,
        created_at: new Date().toISOString(),
      };

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        if (onSubmitSuccess) {
          onSubmitSuccess(createdBooking);
        }
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit booking:', err);
      alert(`Terjadi kesalahan sistem saat mengajukan reservasi: ${err?.message || err}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full my-8 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-sky-600 p-4 sm:p-5 text-white relative rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Tutup"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <div className="flex items-center gap-2.5 pr-8">
            <span className="p-1.5 sm:p-2 bg-white/15 rounded-xl backdrop-blur-md shrink-0">
              <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black leading-tight">Booking / Reservasi Jadwal Layanan</h3>
              <p className="text-[11px] sm:text-xs text-indigo-100/90 mt-0.5 line-clamp-1 sm:line-clamp-none">
                Pengajuan jadwal konsultasi, bimbingan, atau klinik belajar tambahan
              </p>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-3 sm:space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <h4 className="text-base sm:text-lg font-black text-slate-900">Reservasi Berhasil Dikirim!</h4>
            <p className="text-xs text-slate-500">
              Pengajuan jadwal layanan Anda sedang dalam peninjauan dan berstatus <strong className="text-amber-600">Menunggu Approval</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
            {/* Informasi Siswa */}
            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Siswa Pemohon</p>
                <h4 className="text-xs font-black text-slate-800 mt-0.5 line-clamp-1">{student?.nama || 'Siswa'}</h4>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NIS / Cabang</p>
                <p className="text-xs font-bold text-indigo-600">{student?.nis} ({student?.cabang || 'Pusat'})</p>
              </div>
            </div>

            {/* Tanggal Rencana Booking */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tanggal Rencana Layanan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Mata Pelajaran / Layanan */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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

            {/* Keperluan / Topik Konsultasi */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Keperluan / Topik Konsultasi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Konsultasi persiapan UTBK Matematika sub-bab Integrasi..."
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                ></textarea>
              </div>
            </div>

            {/* Pengajar / Tentor Pendamping */}
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Mengirim...' : 'Kirim Reservasi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
