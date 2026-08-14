import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY") ?? "AIzaSy..."; // Atau ganti dengan FCM Legacy / V1 authorization key

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Database Webhook received:", payload);

    // Payload dari Supabase Webhook berisi: { type: 'INSERT', table: 'perkembangan_belajar', record: { ... } }
    const record = payload.record;
    const table = payload.table || "perkembangan_belajar";

    if (!record) {
      return new Response(JSON.stringify({ message: "No record in payload" }), { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Ambil token FCM dari tabel fcm_tokens (sesuai NIS jika ada)
    let query = supabase.from("fcm_tokens").select("token");
    if (record.nis) {
      query = query.eq("nis", record.nis);
    }

    const { data: tokens, error: tokenError } = await query;

    if (tokenError || !tokens || tokens.length === 0) {
      console.log("Tidak ada token FCM ditemukan untuk NIS:", record.nis);
      return new Response(JSON.stringify({ message: "No FCM tokens found for target user" }), { status: 200 });
    }

    const fcmTokens = tokens.map((t: any) => t.token).filter(Boolean);

// 2. Susun Judul dan Pesan Notifikasi berdasarkan tabel / tipe aksi
    let title = "📢 Notifikasi Baru";
    let body = "Ada pembaruan data di sistem portal Rapor.";

    const type = payload.type || table;

    if (type === "jadwal_reminder" || table === "jadwal_kbm") {
      const mapel = record.mata_pelajaran || record.subject || "Mata Pelajaran";
      const jamMulai = record.jam_mulai || record.time_start || "14:00";
      const jamSelesai = record.jam_selesai || record.time_end || "15:30";
      const cabang = record.nama_cabang || record.cabang || "Cabang Utama";

      title = "📚 Pengingat Jadwal KBM";
      body = `Halo! Jangan lupa, kelas ${mapel} akan dimulai dalam 2 jam.\n\n🕒 Jam: ${jamMulai} - ${jamSelesai}\n📖 Mata Pelajaran: ${mapel}\n🏢 Cabang: ${cabang}\n\nPastikan Anda telah mempersiapkan diri dan hadir tepat waktu.`;
    } else if (table === "perkembangan_belajar" || type === "perkembangan") {
      title = "📈 Update Perkembangan";
      body = "Perkembangan belajar Anda telah diperbarui. Buka aplikasi untuk melihat informasi terbaru.";
    } else if (table === "presensi" || type === "presensi") {
      title = "📋 Update Presensi";
      body = "Data presensi Anda telah diperbarui. Silakan cek detail presensi terbaru di aplikasi.";
    } else if (table === "nilai_evaluasi" || type === "nilai") {
      title = "📝 Nilai Baru Tersedia";
      body = "Nilai Anda telah diperbarui. Silakan buka aplikasi untuk melihat detail Nilai Evaluasi Belajar, Nilai Standar, atau Nilai UTBK terbaru.";
    } else if (table === "reservasi_layanan" || type === "reservasi") {
      const status = (record.status || "").toLowerCase();
      if (status === "disetujui" || status === "approved") {
        title = "✅ Reservasi Disetujui";
        body = "Permintaan Reservasi Jadwal Layanan Anda telah disetujui. Silakan buka aplikasi untuk melihat detail jadwal.";
      } else if (status === "ditolak" || status === "rejected") {
        title = "❌ Reservasi Ditolak";
        body = "Maaf, permintaan Reservasi Jadwal Layanan Anda ditolak. Silakan buka aplikasi untuk informasi lebih lanjut atau ajukan reservasi kembali.";
      } else {
        title = "📅 Update Reservasi Layanan";
        body = "Status reservasi jadwal layanan Anda telah diperbarui di portal.";
      }
    }

    // 3. Kirimkan Notifikasi ke Firebase Cloud Messaging (FCM)
    const results = [];
    for (const token of fcmTokens) {
      const fcmPayload = {
        to: token,
        notification: {
          title: title,
          body: body,
          icon: "/icon-192.png",
          click_action: "/"
        },
        data: {
          table: table,
          record_id: record.id || "",
          nis: record.nis || ""
        }
      };

      const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `key=${FCM_SERVER_KEY}`
        },
        body: JSON.stringify(fcmPayload)
      });

      const resData = await fcmResponse.json();
      results.push({ token, status: fcmResponse.status, response: resData });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: fcmTokens.length,
        results
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("Error in send-fcm Edge Function:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
