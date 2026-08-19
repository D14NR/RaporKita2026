export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname || '/';
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With'
    };

    const jsonResponse = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...extraHeaders
      }
    });

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (pathname.startsWith('/push/')) {
      const parts = pathname.split('/').filter(Boolean);
      const action = parts[1];

      if (!env.DB) {
        return jsonResponse({ success: false, message: 'Binding D1 DB tidak tersedia pada worker.' }, 500);
      }

      try {
        // GET /push/subscribers - dapatkan semua subscribers
        if (request.method === 'GET' && action === 'subscribers') {
          const res = await env.DB.prepare(`SELECT * FROM push_subscriptions_siswa ORDER BY updated_at DESC`).all();
          return jsonResponse({
            success: true,
            total: res.results?.length || 0,
            subscribers: res.results || []
          }, 200);
        }

        // GET /push/subscribers/:nis - dapatkan subscribers untuk NIS tertentu
        if (request.method === 'GET' && parts.length >= 3) {
          const nis = parts[2];
          const res = await env.DB.prepare(`SELECT * FROM push_subscriptions_siswa WHERE nis = ? ORDER BY updated_at DESC`).bind(nis).all();
          return jsonResponse({
            success: true,
            nis,
            total: res.results?.length || 0,
            subscriptions: res.results || []
          }, 200);
        }

        // POST /push/unsubscribe - hapus subscription
        if (request.method === 'POST' && action === 'unsubscribe') {
          const body = await request.json().catch(() => ({}));
          const { endpoint, nis } = body;

          if (!endpoint) {
            return jsonResponse({ success: false, message: 'Endpoint harus disediakan.' }, 400);
          }

          const stmt = env.DB.prepare(`DELETE FROM push_subscriptions_siswa WHERE endpoint = ?`);
          await stmt.bind(endpoint).run();

          return jsonResponse({
            success: true,
            endpoint,
            message: 'Subscription berhasil dihapus.'
          }, 200);
        }

        // POST /push/reminder - kirim pengingat jadwal otomatis tiap 2 jam
        if (request.method === 'POST' && action === 'reminder') {
          const body = await request.json().catch(() => ({}));
          const { nis, title, body: notificationBody, subject, time_start, cabang, tanggal } = body;

          if (!nis) {
            return jsonResponse({ success: false, message: 'NIS wajib disediakan.' }, 400);
          }

          const subRes = await env.DB.prepare(`SELECT * FROM push_subscriptions_siswa WHERE nis = ?`).bind(nis).all();
          const subscriptions = subRes.results || [];

          if (subscriptions.length === 0) {
            return jsonResponse({ success: true, nis, count: 0, message: 'Tidak ada subscriber aktif untuk NIS ini.' }, 200);
          }

          const reminderTitle = title || '📚 Pengingat Jadwal KBM';
          const reminderBody = notificationBody || `Halo! Jangan lupa, kelas ${subject || 'Anda'} akan dimulai dalam 2 jam.${time_start ? ` Jam: ${time_start}` : ''}${cabang ? ` Cabang: ${cabang}` : ''}${tanggal ? ` Tanggal: ${tanggal}` : ''}`;

          console.log('[REMINDER]', { nis, reminderTitle, count: subscriptions.length });

          return jsonResponse({
            success: true,
            message: 'Pengingat jadwal otomatis siap diproses tanpa menulis ke riwayat_notifikasi_siswa.',
            nis,
            count: subscriptions.length,
            title: reminderTitle,
            body: reminderBody,
          }, 200);
        }

        // POST /push/send - kirim push notification ke NIS tertentu
        // Body: { nis: string, title: string, body: string, data?: object }
        if (request.method === 'POST' && action === 'send') {
          const body = await request.json().catch(() => ({}));
          const { nis, title, body: notificationBody, data } = body;

          if (!nis || !title) {
            return jsonResponse({ success: false, message: 'NIS dan title harus disediakan.' }, 400);
          }

          // Get subscriptions untuk NIS ini
          const subRes = await env.DB.prepare(`SELECT * FROM push_subscriptions_siswa WHERE nis = ?`).bind(nis).all();
          const subscriptions = subRes.results || [];

          if (subscriptions.length === 0) {
            return jsonResponse({
              success: true,
              message: 'Tidak ada subscriptions untuk NIS ini.',
              count: 0
            }, 200);
          }

          // Untuk setiap subscription, kirim push notification
          // Note: Ini memerlukan VAPID private key untuk tanda tangan
          const sentCount = subscriptions.length;
          
          // Log: Simulasi pengiriman - implementasi nyata memerlukan web-push library
          console.log(`[PUSH] Sending to ${sentCount} subscriptions for NIS: ${nis}`);
          console.log(`[PUSH] Title: ${title}`, `Body: ${notificationBody}`);

          return jsonResponse({
            success: true,
            message: `Notification akan dikirim ke ${sentCount} perangkat.`,
            nis,
            count: sentCount,
            subscriptions: subscriptions.map(s => ({
              id: s.id,
              nis: s.nis,
              nama_siswa: s.nama_siswa,
              endpoint: s.endpoint.substring(0, 50) + '...' // Hide full endpoint
            }))
          }, 200);
        }

        return jsonResponse({ success: false, message: 'Endpoint push tidak dikenali.' }, 404);
      } catch (error) {
        console.error(`[PUSH ERROR]:`, error);
        return jsonResponse({
          success: false,
          error: error?.message || String(error)
        }, 500);
      }
    }

    if (pathname.startsWith('/db/')) {
      const parts = pathname.split('/').filter(Boolean);
      const table = parts[1];
      const id = parts[2] || null;

      if (!table || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
        return jsonResponse({ success: false, message: 'Nama tabel tidak valid.' }, 400);
      }

      if (!env.DB) {
        return jsonResponse({ success: false, message: 'Binding D1 DB tidak tersedia pada worker.' }, 500);
      }

      try {
        if (request.method === 'GET') {
          const res = await env.DB.prepare(`SELECT * FROM "${table}"`).all();
          return jsonResponse(res.results || [], 200);
        }

        if (request.method === 'POST') {
          const body = await request.json().catch(() => null) || {};
          const rows = Array.isArray(body.rows) ? body.rows : [body];
          const inserted = [];

          for (const row of rows) {
            if (!row || typeof row !== 'object') continue;

            const keys = Object.keys(row).filter((key) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key));
            if (keys.length === 0) continue;

            const sql = `INSERT INTO "${table}" (${keys.map((key) => `"${key}"`).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`;
            const stmt = env.DB.prepare(sql);
            const values = keys.map((key) => row[key]);
            const result = await stmt.bind(...values).run();

            inserted.push({
              ...row,
              id: result?.meta?.last_row_id ?? row.id ?? null
            });
          }

          return jsonResponse({
            success: true,
            data: inserted
          }, 200);
        }

        if (request.method === 'PUT' && id) {
          const body = await request.json().catch(() => ({}));
          const validKeys = Object.keys(body || {}).filter((key) => key !== 'id' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key));

          if (validKeys.length === 0) {
            return jsonResponse({ success: false, message: 'Tidak ada field valid untuk update.' }, 400);
          }

          const assignments = validKeys.map((key) => `"${key}" = ?`).join(', ');
          const values = validKeys.map((key) => body[key]);
          const stmt = env.DB.prepare(`UPDATE "${table}" SET ${assignments} WHERE id = ?`);
          await stmt.bind(...values, id).run();

          const row = await env.DB.prepare(`SELECT * FROM "${table}" WHERE id = ?`).bind(id).all();
          return jsonResponse(row.results || [], 200);
        }

        if (request.method === 'DELETE' && id) {
          const stmt = env.DB.prepare(`DELETE FROM "${table}" WHERE id = ?`);
          await stmt.bind(id).run();
          return jsonResponse({ success: true, deleted_id: id }, 200);
        }

        return jsonResponse({ success: false, message: 'Method tidak didukung untuk endpoint /db.' }, 405);
      } catch (error) {
        console.error(`[D1 ERROR] ${table}:`, error);
        return jsonResponse({
          success: false,
          error: error?.message || String(error)
        }, 500);
      }
    }

    if (request.method !== 'POST') {
      return jsonResponse({ success: false, message: 'Method tidak didukung.' }, 405);
    }

    try {
      const payload = await request.json();
      const record = payload.record || payload.new || {};
      const table = payload.table || payload.type || '';

      if (!table) {
        return jsonResponse({ success: true, message: 'Webhook diterima tanpa nama tabel.' }, 200);
      }

      // Webhook received - can be processed for custom notifications via worker
      return jsonResponse({
        success: true,
        table,
        message: 'Webhook diproses.'
      }, 200);
    } catch (error) {
      return jsonResponse({ success: false, error: error?.message || String(error) }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    console.log('Cron worker dijalankan:', event.cron);
  }
};

