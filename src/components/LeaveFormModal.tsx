import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Send, CheckCircle, FileText } from 'lucide-react';
import { DataSiswa } from '../types';
import { d1 } from '../lib/d1';
import { formatTanggalIndo } from '../lib/dateUtils';

interface LeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleData: {
    subject: string;
    date?: string;
    time?: string;
    teacher?: string;
    kelas?: string;
  } | null;
  student: DataSiswa | null;
  onSubmitSuccess?: (submission: { type: 'Izin' | 'Sakit'; subject: string; date: string; reason: string }) => void;
}

export const LeaveFormModal: React.FC<LeaveFormModalProps> = ({
  isOpen,
  onClose,
  scheduleData,
  student,
  onSubmitSuccess
}) => {
  const [leaveType, setLeaveType] = useState<'Izin' | 'Sakit'>('Izin');
  const [date, setDate] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (scheduleData?.date) {
      setDate(scheduleData.date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [scheduleData, student]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const targetDate = date || scheduleData?.date || new Date().toISOString().split('T')[0];
    const targetSubject = scheduleData?.subject || 'Umum';
    const safeStudentId = (student?.id || '').trim();

    if (!student || !safeStudentId || !student.nis) {
      alert('Data siswa tidak lengkap. Silakan login ulang atau pilih siswa yang valid terlebih dahulu.');
      setIsSubmitting(false);
      return;
    }

    let didSave = false;

    try {
      const nowIso = new Date().toISOString();
      const payload = {
        id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        siswa_id: safeStudentId,
        nis: student.nis,
        nama_siswa: student.nama || student.nama_lengkap || null,
        tanggal: targetDate,
        mata_pelajaran: targetSubject,
        materi_sub_bab: reason ? `Permohonan ${leaveType}: ${reason}` : `Permohonan ${leaveType}`,
        kehadiran: leaveType,
        prosen_penguasaan: 0,
        prosen_penjelasan: 0,
        prosen_kondisi: 0,
        catatan_pengajar: reason ? `Alasan ${leaveType}: ${reason}` : `Permohonan ${leaveType}`,
        cabang: student.cabang || null,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const { data, error } = await d1
        .from('perkembangan_belajar')
        .insert([payload])
        .select();

      if (error) {
        console.error('Gagal menyimpan permohonan ke perkembangan_belajar:', { payload, error });
        alert(`Gagal menyimpan data ketidakhadiran: ${error?.message || 'Error tidak diketahui'}`);
      } else if (!Array.isArray(data) || data.length === 0) {
        console.error('Insert perkembangan_belajar berhasil dipanggil tapi tidak menghasilkan row:', { payload, data });
        alert('Permohonan tidak tersimpan. Pastikan endpoint worker D1 sudah benar dan database aktif.');
      } else {
        didSave = true;
        console.log('Permohonan berhasil disimpan ke perkembangan_belajar:', data);
      }
    } catch (err: any) {
      console.error('Error saat menyimpan permohonan:', err);
      alert(`Error saat menyimpan data ketidakhadiran: ${err?.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSubmitting(false);

      if (didSave) {
        setIsSuccess(true);

        if (onSubmitSuccess) {
          onSubmitSuccess({
            type: leaveType,
            subject: targetSubject,
            date: targetDate,
            reason
          });
        }
      }

      setTimeout(() => {
        if (didSave) {
          setIsSuccess(false);
        }
        setReason('');
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-white/15 rounded-xl backdrop-blur-md">
              <FileText className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Form Ketidakhadiran</span>
          </div>
          <h3 className="text-xl font-black">Pengajuan Izin / Sakit</h3>
          <p className="text-xs text-sky-100/90 mt-1">
            Sampaikan permohonan izin atau sakit untuk jadwal KBM siswa
          </p>
        </div>

        {isSuccess ? (
          <div className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <h4 className="text-xl font-black text-slate-800">Permohonan Berhasil Dikirim!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Permohonan {leaveType.toLowerCase()} untuk {scheduleData?.subject || 'jadwal'} telah tercatat dan akan diproses oleh tim akademik.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Context info banner */}
            {scheduleData && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>Informasi Jadwal Selected</span>
                  <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {scheduleData.kelas || student?.kelompok_kelas || 'Kelas'}
                  </span>
                </div>
                <div className="font-black text-slate-800 text-sm">{scheduleData.subject}</div>
                <div className="flex items-center gap-4 text-slate-600 font-medium pt-1">
                  {scheduleData.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-sky-600" />
                      {formatTanggalIndo(scheduleData.date, { withDayName: true })}
                    </span>
                  )}
                  {scheduleData.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-sky-600" />
                      {scheduleData.time}
                    </span>
                  )}
                </div>
                {scheduleData.teacher && (
                  <div className="text-[11px] text-slate-500 italic">Pengajar: {scheduleData.teacher}</div>
                )}
              </div>
            )}

            {/* Leave Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jenis Permohonan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLeaveType('Izin')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    leaveType === 'Izin'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 ${leaveType === 'Izin' ? 'bg-white border-amber-500' : 'border-slate-300'}`}></span>
                  Izin (Keperluan/Acara)
                </button>

                <button
                  type="button"
                  onClick={() => setLeaveType('Sakit')}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                    leaveType === 'Sakit'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border-2 ${leaveType === 'Sakit' ? 'bg-white border-rose-500' : 'border-slate-300'}`}></span>
                  Sakit
                </button>
              </div>
            </div>



            {/* Alasan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alasan Ketidakhadiran <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder={leaveType === 'Sakit' ? 'Sebutkan kondisi sakit atau instruksi dokter...' : 'Sebutkan alasan atau keperluan izin...'}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              ></textarea>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
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
                className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-sky-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Kirim Permohonan
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

