/**
 * API Endpoint untuk mengirim Push Notifications ke subscriptions
 * File: functions/api/push.ts
 * 
 * Gunakan dengan:
 * POST /api/push/send
 * Body: {
 *   "nis": "123456",
 *   "title": "Update Nilai",
 *   "body": "Nilai Matematika Anda telah diperbarui",
 *   "data": { "table": "nilai_evaluasi", "record_id": "123" }
 * }
 */

import webpush from 'web-push';

function getVapidConfig(env: any) {
  const runtimeEnv = typeof process !== 'undefined' ? process.env : {};

  return {
    subject: env?.VAPID_SUBJECT || runtimeEnv.VAPID_SUBJECT || 'mailto:admin@example.com',
    publicKey: env?.VAPID_PUBLIC_KEY || env?.VITE_VAPID_PUBLIC_KEY || runtimeEnv.VAPID_PUBLIC_KEY || runtimeEnv.VITE_VAPID_PUBLIC_KEY || '',
    privateKey: env?.VAPID_PRIVATE_KEY || runtimeEnv.VAPID_PRIVATE_KEY || ''
  };
}

export async function onRequest(context: any) {
  const { request, env } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const vapid = getVapidConfig(env);
  if (!vapid.publicKey || !vapid.privateKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'VAPID keys belum dikonfigurasi di environment Cloudflare Pages. Tambahkan VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  try {
    const body = await request.json();
    const { nis, title, body: notificationBody, data } = body;

    if (!nis || !title) {
      return new Response(
        JSON.stringify({ success: false, error: 'NIS dan title harus disediakan' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch subscriptions dari D1
    const db = env.DB;
    if (!db) {
      throw new Error('D1 binding tidak tersedia');
    }

    const subscriptionsResult = await db
      .prepare('SELECT * FROM push_subscriptions_siswa WHERE nis = ?')
      .bind(nis)
      .all();

    const subscriptions = subscriptionsResult.results || [];

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Tidak ada subscriptions untuk NIS ini',
          count: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Kirim push notification ke setiap subscription
    const notificationPayload = JSON.stringify({
      title,
      body: notificationBody || 'Ada pembaruan terbaru',
      icon: '/logo.png',
      badge: '/logo.png',
      data: data || {}
    });

    const mapNotificationType = (text: string) => {
      const value = (text || '').toLowerCase();
      if (/(jadwal|kelas|kbm|pengingat)/i.test(value)) return 'Jadwal';
      if (/(permintaan|layanan|reservasi|booking)/i.test(value)) return 'Permintaan Pelayanan';
      if (/(perkembangan|progress|belajar)/i.test(value)) return 'Perkembangan';
      if (/(nilai|evaluasi|score|ujian|tryout)/i.test(value)) return 'Nilai';
      return 'Informasi Sistem';
    };

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`Failed for ${subscription.nis}: ${error.message}`);

        // Jika status 410 Gone, hapus subscription
        if (error.statusCode === 410) {
          try {
            await db
              .prepare('DELETE FROM push_subscriptions_siswa WHERE endpoint = ?')
              .bind(subscription.endpoint)
              .run();
          } catch (deleteErr) {
            console.error('Failed to delete expired subscription:', deleteErr);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Push notifications sent`,
        nis,
        total: subscriptions.length,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
