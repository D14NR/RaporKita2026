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

      // Get locally deleted and read notification IDs
      let deletedIds: string[] = [];
      let readIds: string[] = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem(`deleted_notifs_${student.nis}`) || '[]');
        readIds = JSON.parse(localStorage.getItem(`read_notifs_${student.nis}`) || '[]');
      } catch (e) {
        deletedIds = [];
        readIds = [];
      }

      const activeRows = filtered
        .filter((row: any) => !deletedIds.includes(String(row.id)))
        .map((row: any) => ({
          ...row,
          status_baca: readIds.includes(String(row.id)) ? 1 : row.status_baca
        }));

      const sorted = [...activeRows].sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setNotifications(sorted);
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

  // Sync unread count to parent safely in an effect phase
  useEffect(() => {
    const unreadCount = notifications.filter(item => Number(item.status_baca) === 0).length;
    onUnreadCountChange?.(unreadCount);
  }, [notifications]);

  const handleToggleRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    let targetNewStatus = 1;
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) {
          targetNewStatus = Number(n.status_baca) === 0 ? 1 : 0;
          return { ...n, status_baca: targetNewStatus };
        }
        return n;
      })
    );

    // Save in localStorage
    if (student?.nis) {
      try {
        const key = `read_notifs_${student.nis}`;
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (targetNewStatus === 1) {
          if (!existing.includes(id)) existing.push(id);
        } else {
          const idx = existing.indexOf(id);
          if (idx !== -1) existing.splice(idx, 1);
        }
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (err) {
        console.warn('Gagal menyimpan read_notifs ke localStorage:', err);
      }
    }

    try {
      await fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status_baca: targetNewStatus })
      });
    } catch (error) {
      console.warn('Gagal memperbarui status baca notifikasi:', error);
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // Optimistic UI update
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, status_baca: 1 } : n)));

    // Save read ID in localStorage
    if (student?.nis) {
      try {
        const key = `read_notifs_${student.nis}`;
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(id)) {
          existing.push(id);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (e) {
        console.warn('Gagal menyimpan read_notifs ke localStorage:', e);
      }
    }

    try {
      await fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status_baca: 1 })
      });
    } catch (error) {
      console.warn('Gagal menandai notifikasi dibaca:', error);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    // 1. Instant optimistic state update
    setNotifications(prev => prev.filter(item => item.id !== id));

    // 2. Persist deleted ID in localStorage so it stays deleted
    if (student?.nis) {
      try {
        const key = `deleted_notifs_${student.nis}`;
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        if (!existing.includes(id)) {
          existing.push(id);
          localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (e) {
        console.warn('Gagal menyimpan deleted_notifs ke localStorage:', e);
      }
    }

    // 3. Background API request to delete from DB
    try {
      await fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
    } catch (error) {
      console.warn('Gagal menghapus notifikasi dari server:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter(item => Number(item.status_baca) === 0);
    if (unreadItems.length === 0) return;

    // Optimistic UI update
    setNotifications(prev => prev.map(item => ({ ...item, status_baca: 1 })));

    // Save all read IDs in localStorage
    if (student?.nis) {
      try {
        const key = `read_notifs_${student.nis}`;
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        const unreadIds = unreadItems.map(item => item.id);
        const updated = Array.from(new Set([...existing, ...unreadIds]));
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('Gagal menyimpan read_notifs ke localStorage:', e);
      }
    }

    try {
      await Promise.all(
        unreadItems.map(item =>
          fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${encodeURIComponent(item.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ status_baca: 1 })
          }).catch(err => console.warn('Mark as read error:', err))
        )
      );
    } catch (error) {
      console.warn('Gagal menandai semua notifikasi dibaca:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) return;

    const idsToDelete = notifications.map(n => n.id);

    // 1. Instant optimistic UI update
    setNotifications([]);

    // 2. Persist all IDs in localStorage
    if (student?.nis) {
      try {
        const key = `deleted_notifs_${student.nis}`;
        const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = Array.from(new Set([...existing, ...idsToDelete]));
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('Gagal menyimpan deleted_notifs ke localStorage:', e);
      }
    }

    // 3. Background API requests
    try {
      await Promise.all(
        idsToDelete.map(id =>
          fetch(`${baseApiUrl}/db/riwayat_notifikasi_siswa/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { Accept: 'application/json' }
          }).catch(err => console.warn('Delete error:', err))
        )
      );
    } catch (error) {
      console.warn('Gagal menghapus semua notifikasi dari server:', error);
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
              {notifications.map((notif) => {
                const isUnread = Number(notif.status_baca) === 0;
                return (
                  <div
                    key={notif.id}
                    onClick={(e) => handleToggleRead(notif.id, e)}
                    className={`px-6 py-4 transition cursor-pointer select-none ${
                      isUnread
                        ? 'bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-950/60'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{getTypeIcon(notif.tipe_notifikasi)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{notif.tipe_notifikasi || 'Notifikasi'}</span>
                              {isUnread ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-300">
                                  Baru
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                  Dibaca
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                              Dari: {notif.nama_siswa || 'Siswa'}
                            </p>
                          </div>
                          {isUnread && (
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 flex-shrink-0 animate-pulse" />
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleToggleRead(notif.id, e)}
                              className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded-lg text-slate-600 dark:text-slate-300 transition"
                              title={isUnread ? "Tandai Sudah Dibaca" : "Tandai Belum Dibaca"}
                            >
                              {isUnread ? <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                            <button
                              onClick={(e) => handleDelete(notif.id, e)}
                              className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400 transition"
                              title="Hapus Notifikasi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
