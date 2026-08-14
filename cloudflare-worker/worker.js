export default {
  // 1. Webhook dari Supabase (Ketika Data Berubah)
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const payload = await request.json();
      console.log("Webhook payload received from Supabase:", JSON.stringify(payload));

      const record = payload.record || payload.new || {};
      const table = payload.table || payload.type || "";
      const targetNis = String(record.nis || record.nisn || "").trim();

      const appId = env.ONESIGNAL_APP_ID;
      const restApiKey = env.ONESIGNAL_REST_API_KEY;
      const appUrl = env.APP_URL || "https://lps-siswa.pages.dev";

      if (!appId || !restApiKey) {
        return new Response(JSON.stringify({ error: "ONESIGNAL_APP_ID atau ONESIGNAL_REST_API_KEY belum diisi di Cloudflare Environment Variables" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Tentukan Judul & Pesan
      let title = "📢 Notifikasi Rapor Kita";
      let body = "Ada pembaruan data terbaru di portal.";
      let sendNotification = true;

      if (table === "perkembangan_belajar") {
        if (record.kehadiran) {
          title = `📋 Update Presensi (${record.kehadiran || 'Hadir'})`;
          body = `Presensi: ${record.kehadiran || 'Hadir'}. Cek perkembangan belajar anak Anda di portal Rapor Kita.`;
        } else {
          title = "📈 Update Perkembangan Belajar";
          body = "Perkembangan belajar anak telah diperbarui oleh pengajar.";
        }
      } else if (table === "nilai_evaluasi" || table === "nilai_standar" || table === "nilai_snbt_utbk") {
        title = "📝 Nilai Baru Tersedia";
        body = "Nilai evaluasi / ujian terbaru siswa telah diinput ke portal.";
      } else if (table === "permintaan_pelayanan") {
        const st = String(record.status || "").toLowerCase();
        // Hanya kirim jika status berubah menjadi disetujui
        if (st === "disetujui" || st === "approved") {
          title = "✅ Reservasi Layanan Disetujui";
          body = `Reservasi Anda untuk ${record.mata_pelajaran || 'layanan'} pada ${record.tanggal_disetujui || record.tanggal} telah disetujui.`;
        } else if (st === "ditolak" || st === "rejected") {
          title = "❌ Reservasi Layanan Ditolak";
          body = `Mohon maaf, permintaan reservasi Anda untuk ${record.mata_pelajaran || 'layanan'} tidak dapat disetujui.`;
        } else {
          sendNotification = false; 
        }
      } else {
         sendNotification = false;
      }

      if (!sendNotification) {
        return new Response(JSON.stringify({ success: true, message: "No notification needed for this event." }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const osResult = await sendOneSignalPush(appId, restApiKey, appUrl, title, body, [targetNis], env, table, String(record.id || ""));

      return new Response(JSON.stringify({
        success: true,
        targetNis: targetNis || "Semua",
        result: osResult
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  // 2. Scheduled Event dari Cloudflare Cron Trigger (Misal di-set setiap 15-30 menit)
  // Untuk mengirim notifikasi 2 Jam sebelum KBM (Reguler, Tambahan/Khusus, dan Reservasi)
  async scheduled(event, env, ctx) {
    console.log("Cron trigger invoked:", event.cron);
    const appId = env.ONESIGNAL_APP_ID;
    const restApiKey = env.ONESIGNAL_REST_API_KEY;
    const appUrl = env.APP_URL || "https://lps-siswa.pages.dev";
    
    // DB KBM
    const supabaseUrlKbm = env.SUPABASE_URL_KBM || "https://oqpblpjvqimozlfdvykw.supabase.co"; 
    const supabaseKeyKbm = env.SUPABASE_ANON_KEY_KBM || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xcGJscGp2cWltb3psZmR2eWt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NDYyMzcsImV4cCI6MjA4OTMyMjIzN30.xZWJVi3HhofJe6083I_6qmogKQdQIO_kHx9o5Ofc3mc";

    // DB LPS
    const lpsUrl = env.SUPABASE_URL_LPS || "https://lcypcfnixgjeabhbyvef.supabase.co";
    const lpsKey = env.SUPABASE_ANON_KEY_LPS || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBjZm5peGdqZWFiaGJ5dmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzM0MTAsImV4cCI6MjA5NTM0OTQxMH0.gN80tAK3p_OgAtT00jj-elO6EkUZ1rab7aKNYvL-37M";

    if (!appId || !restApiKey) {
      console.error("Missing environment variables for Scheduled CRON (OneSignal)");
      return;
    }

    try {
      // Dapatkan Tanggal Hari Ini & Jam Sekarang di zona waktu Asia/Jakarta
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      const parts = formatter.formatToParts(new Date());
      const p = {};
      parts.forEach(({ type, value }) => { p[type] = value; });
      const dateStr = `${p.year}-${p.month}-${p.day}`; // Format YYYY-MM-DD
      const currentHour = parseInt(p.hour, 10);
      const currentMinute = parseInt(p.minute, 10);
      const currentTimeMins = currentHour * 60 + currentMinute;

      const kbmHeaders = {
        "apikey": supabaseKeyKbm,
        "Authorization": `Bearer ${supabaseKeyKbm}`
      };
      
      const lpsHeaders = {
        "apikey": lpsKey,
        "Authorization": `Bearer ${lpsKey}`
      };

      // 1. Fetch Permintaan Pelayanan (Reservasi)
      const resPelayanan = await fetch(`${supabaseUrlKbm}/rest/v1/permintaan_pelayanan?tanggal=eq.${dateStr}&status=eq.Disetujui&select=*`, { headers: kbmHeaders });
      if (resPelayanan.ok) {
        const jadwalPelayanan = await resPelayanan.json();
        for (const item of jadwalPelayanan) {
          if (!item.jam_disetujui || !item.nis) continue;
          
          const jamParts = item.jam_disetujui.split(":");
          if (jamParts.length < 2) continue;
          const scheduleTimeMins = parseInt(jamParts[0], 10) * 60 + parseInt(jamParts[1], 10);
          const diffMins = scheduleTimeMins - currentTimeMins;
          
          if (diffMins > 90 && diffMins <= 120) {
             const title = "📚 Pengingat Reservasi Pelayanan";
             const body = `Halo! Jangan lupa, reservasi ${item.mata_pelajaran || 'tambahan'} akan dimulai dalam 2 jam (Jam ${item.jam_disetujui}). Hadir tepat waktu ya!`;
             await sendOneSignalPush(appId, restApiKey, appUrl, title, body, [item.nis], env, "permintaan_pelayanan", item.id);
          }
        }
      }

      // Helper function to check if schedule is starting soon
      const isStartingSoon = (waktuStr) => {
        if (!waktuStr) return false;
        const startTimeStr = waktuStr.split('-')[0]?.trim();
        if (!startTimeStr) return false;
        const jamParts = startTimeStr.split(":");
        if (jamParts.length < 2) return false;
        const scheduleTimeMins = parseInt(jamParts[0], 10) * 60 + parseInt(jamParts[1], 10);
        const diffMins = scheduleTimeMins - currentTimeMins;
        return (diffMins > 90 && diffMins <= 120);
      };

      // Fetch Data Siswa caching map based on cabang + jenjang
      const siswaCache = {}; 
      const getSiswaList = async (cabang, jenjang, sekolah) => {
        if (!cabang) return [];
        let cacheKey = `${cabang}_${jenjang}_${sekolah}`;
        if (siswaCache[cacheKey]) return siswaCache[cacheKey];

        let queryUrl = `${lpsUrl}/rest/v1/data_siswa?select=nis,kelompok_kelas&cabang=eq.${encodeURIComponent(cabang)}`;
        if (jenjang) queryUrl += `&jenjang_studi=eq.${encodeURIComponent(jenjang)}`;
        if (sekolah) queryUrl += `&asal_sekolah=eq.${encodeURIComponent(sekolah)}`;

        const res = await fetch(queryUrl, { headers: lpsHeaders });
        if (res.ok) {
          siswaCache[cacheKey] = await res.json();
          return siswaCache[cacheKey];
        }
        return [];
      };

      // 2. Fetch Jadwal Reguler
      const resReguler = await fetch(`${supabaseUrlKbm}/rest/v1/jadwal_reguler?tanggal=eq.${dateStr}&select=*`, { headers: kbmHeaders });
      if (resReguler.ok) {
        const jadwalReguler = await resReguler.json();
        for (const item of jadwalReguler) {
          if (!isStartingSoon(item.waktu)) continue;
          
          const students = await getSiswaList(item.cabang, item.jenjang_studi, "");
          const targetNisList = students.filter(s => {
            // Loose matching untuk kelas agar tidak salah sasaran jika ada kelas yang spesifik
            if (!item.kelas || !s.kelompok_kelas) return true;
            return s.kelompok_kelas.includes(item.kelas) || item.kelas.includes(s.kelompok_kelas);
          }).map(s => s.nis).filter(Boolean);

          if (targetNisList.length > 0) {
             const title = "📚 Pengingat Jadwal KBM Reguler";
             const startTime = item.waktu.split('-')[0]?.trim();
             const body = `Halo! Jangan lupa, KBM Reguler ${item.mapel || 'hari ini'} akan dimulai jam ${startTime}. Hadir tepat waktu ya!`;
             // Kirim dalam batch max 2000 user per request OneSignal
             await sendOneSignalPush(appId, restApiKey, appUrl, title, body, targetNisList, env, "jadwal_reguler", item.id);
          }
        }
      }

      // 3. Fetch Jadwal Khusus / Tambahan
      const resKhusus = await fetch(`${supabaseUrlKbm}/rest/v1/jadwal_khusus?tanggal=eq.${dateStr}&select=*`, { headers: kbmHeaders });
      if (resKhusus.ok) {
        const jadwalKhusus = await resKhusus.json();
        for (const item of jadwalKhusus) {
          if (!isStartingSoon(item.waktu)) continue;
          
          const students = await getSiswaList(item.cabang, item.jenjang_studi, item.sekolah);
          const targetNisList = students.filter(s => {
            if (!item.kelas || !s.kelompok_kelas) return true;
            return s.kelompok_kelas.includes(item.kelas) || item.kelas.includes(s.kelompok_kelas);
          }).map(s => s.nis).filter(Boolean);

          if (targetNisList.length > 0) {
             const title = "📚 Pengingat Jadwal Tambahan/Khusus";
             const startTime = item.waktu.split('-')[0]?.trim();
             const body = `Halo! Kelas Tambahan ${item.mapel || 'hari ini'} akan dimulai jam ${startTime}. Hadir tepat waktu ya!`;
             await sendOneSignalPush(appId, restApiKey, appUrl, title, body, targetNisList, env, "jadwal_khusus", item.id);
          }
        }
      }

    } catch (err) {
      console.error("Scheduled worker error:", err);
    }
  }
};

async function sendOneSignalPush(appId, restApiKey, appUrl, title, body, targetNisList, env, table = "", recordId = "") {
  if (!targetNisList || targetNisList.length === 0) return null;

  const oneSignalPayload = {
    app_id: appId,
    headings: { en: title, id: title },
    contents: { en: body, id: body },
    url: appUrl,
    data: {
       table: table,
       record_id: recordId
    }
  };

  const lpsUrl = env.SUPABASE_URL_LPS || "https://lcypcfnixgjeabhbyvef.supabase.co";
  const lpsKey = env.SUPABASE_ANON_KEY_LPS || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjeXBjZm5peGdqZWFiaGJ5dmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzM0MTAsImV4cCI6MjA5NTM0OTQxMH0.gN80tAK3p_OgAtT00jj-elO6EkUZ1rab7aKNYvL-37M";
  
  try {
    // Ambil Subscription ID dari LPS DB berdasarkan NIS List
    // Filter out NIS if there are too many (Supabase URL limits exist, but let's assume we batch appropriately or query is short enough)
    // For large lists, we fallback to external_user_ids directly.
    const subRes = await fetch(`${lpsUrl}/rest/v1/onesignal_subscriptions?nis=in.(${targetNisList.join(',')})&select=subscription_id`, {
      headers: {
        "apikey": lpsKey,
        "Authorization": `Bearer ${lpsKey}`
      }
    });
    
    if (subRes.ok) {
      const subs = await subRes.json();
      const subIds = subs.map(s => s.subscription_id).filter(Boolean);
      if (subIds.length > 0) {
        oneSignalPayload.include_player_ids = subIds;
      } else {
        oneSignalPayload.include_external_user_ids = targetNisList;
        oneSignalPayload.channel_for_external_user_ids = "push";
      }
    } else {
      oneSignalPayload.include_external_user_ids = targetNisList;
      oneSignalPayload.channel_for_external_user_ids = "push";
    }
  } catch (e) {
    oneSignalPayload.include_external_user_ids = targetNisList;
    oneSignalPayload.channel_for_external_user_ids = "push";
  }

  const osResponse = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Basic ${restApiKey}`
    },
    body: JSON.stringify(oneSignalPayload)
  });

  return await osResponse.json();
}

