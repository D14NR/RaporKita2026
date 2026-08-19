import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Sparkles, X } from 'lucide-react';
import { baseApiUrl } from '../lib/d1';
import { DataSiswa } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: DataSiswa | null;
  onUnreadCountChange?: (count: number) => void;
}

interface StudentNotification {
  id: string;
  siswa_id?: string | null;
  nis: string;
  nama_siswa: string;
  tipe_notifikasi: string;
  pesan: string;
  status_baca: number;
  created_at: string;
  jumlah_pengiriman: number;
  pengiriman_terakhir_at?: string | null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  student,
  onUnreadCountChange,
}) => {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!student?.nis) {
      setNotifications([]);
      onUnreadCountChange?.(0);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      const data = await response.json().catch(() => []);
      const rows = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const filtered = rows.filter((row: any) => String(row.nis) === String(student.nis));
      const sorted = [...filtered].sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setNotifications(sorted);
      onUnreadCountChange?.(sorted.filter((n: any) => Number(n.status_baca) === 0).length);
    } catch (error) {
      console.error('Gagal memuat notifikasi dari riwayat_notifikasi_siswa:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, student?.nis]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status_baca: 1 })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, status_baca: 1 } : n)));
        onUnreadCountChange?.(
          notifications.filter((item) => Number(item.status_baca) === 0 && item.id !== id).length
        );
      }
    } catch (error) {
      console.error('Gagal menandai notifikasi dibaca:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus notifikasi ini?')) return;

    try {
      const response = await fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(item => item.id !== id));
        onUnreadCountChange?.(
          notifications.filter((item) => Number(item.status_baca) === 0 && item.id !== id).length
        );
      }
    } catch (error) {
      console.error('Gagal menghapus notifikasi:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(item => Number(item.status_baca) === 0)
          .map(item =>
            fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ status_baca: 1 })
            })
          )
      );

      setNotifications(prev => prev.map(item => ({ ...item, status_baca: 1 })));
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('Gagal menandai semua notifikasi dibaca:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Hapus semua notifikasi ini?')) return;

    try {
      await Promise.all(
        notifications.map(item =>
          fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${item.id}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' }
          })
        )
      );

      setNotifications([]);
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('Gagal menghapus semua notifikasi:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('jadwal')) return '📚';
    if (t.includes('pelayanan')) return '🎯';
    if (t.includes('nilai')) return '🏆';
    if (t.includes('perkembangan')) return '📈';
    return 'ℹ️';
  };

  const unreadCount = notifications.filter(item => Number(item.status_baca) === 0).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl mx-4 max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Pusat Notifikasi
              {unreadCount > 0 && (
                <span className="ml-2 text-sm font-semibold text-rose-600 dark:text-rose-400">
                  ({unreadCount} baru)
                </span>
              )}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai Semua Dibaca
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Semua
          </button>
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 rounded-lg transition ml-auto"
          >
            <Sparkles className="h-4 w-4" />
            Segarkan
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-600 dark:text-slate-400">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600 dark:text-slate-400">
              <Bell className="h-12 w-12 mb-3 opacity-30" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                    Number(notif.status_baca) === 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getTypeIcon(notif.tipe_notifikasi)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {notif.tipe_notifikasi || 'Notifikasi'}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Dari: {notif.nama_siswa || 'Siswa'}
                          </p>
                        </div>
                        {Number(notif.status_baca) === 0 && (
                          <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 mt-2 text-sm break-words">
                        {notif.pesan}
                      </p>

                      <div className="flex items-center justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          {new Date(notif.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex gap-2">
                          {Number(notif.status_baca) === 0 && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notif.id)}
                            className="text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
