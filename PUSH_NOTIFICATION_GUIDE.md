# 📱 Web Push Notification System

Dokumentasi lengkap untuk implementasi Web Push Notifications di aplikasi Rapor Kita.

## 🚀 Persiapan

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Simpan key yang dihasilkan di file `.env`:

```env
VITE_VAPID_PUBLIC_KEY=<public_key_dari_output>
VAPID_PRIVATE_KEY=<private_key_dari_output>
VAPID_SUBJECT=mailto:your-email@example.com
```

### 2. Install Dependencies

```bash
npm install web-push
```

### 3. Create D1 Table

Table `push_subscriptions_siswa` sudah dibuat otomatis:

```sql
CREATE TABLE push_subscriptions_siswa (
    id TEXT PRIMARY KEY NOT NULL,
    nis TEXT NOT NULL,
    nama_siswa TEXT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

## 📋 Alur Kerja

### 1. Siswa Mengizinkan Notifikasi

Ketika siswa mengklik "Aktifkan Notifikasi Push" di NotificationModal:

```
User Click → requestNotificationPermission()
  ↓
Browser Meminta Permission
  ↓
User Accept
  ↓
subscribePushNotifications() → Save ke D1
```

### 2. Browser Saves Subscription

File: `src/lib/pushNotifications.ts`

```typescript
// Automatic subscription when permission granted
export async function subscribePushNotifications(nis: string): Promise<boolean>
```

Data yang disimpan:
- `endpoint` - Unique URL untuk push provider
- `p256dh` - Encryption key
- `auth` - Authentication token

### 3. Kirim Push Notification

#### Via Express API (Development)

```bash
POST /api/push/send
Content-Type: application/json

{
  "nis": "123456",
  "title": "Update Nilai",
  "body": "Nilai Matematika telah diperbarui",
  "data": {
    "table": "nilai_evaluasi",
    "record_id": "789"
  }
}
```

#### Via Cloudflare Worker (Production)

```bash
POST https://raporkita-db.workers.dev/push/send
Content-Type: application/json

{
  "nis": "123456",
  "title": "Update Nilai",
  "body": "Nilai Matematika telah diperbarui"
}
```

## 📁 File Structure

```
src/
├── lib/
│   ├── pushNotifications.ts      # Utility untuk subscribe & send
│   └── d1.ts                      # D1 client
├── components/
│   └── NotificationModal.tsx      # UI untuk enable notifikasi
└── main.tsx                       # Register service worker

public/
└── sw.js                          # Service Worker untuk handle push events

functions/
└── api/
    └── push.ts                    # Endpoint untuk send push via web-push
```

## 🔌 API Endpoints

### Cloudflare Worker Endpoints

#### GET /push/subscribers
Dapatkan semua push subscriptions

```bash
GET https://raporkita-db.workers.dev/push/subscribers
```

**Response:**
```json
{
  "success": true,
  "total": 5,
  "subscribers": [
    {
      "id": "nis-timestamp-random",
      "nis": "123456",
      "nama_siswa": "Budi Santoso",
      "endpoint": "https://...",
      "created_at": "2026-08-18T10:30:00Z"
    }
  ]
}
```

#### GET /push/subscribers/:nis
Dapatkan subscriptions untuk NIS tertentu

```bash
GET https://raporkita-db.workers.dev/push/subscribers/123456
```

#### POST /push/send
Kirim push notification (akan di-handle oleh Express API)

```bash
POST https://raporkita-db.workers.dev/push/send
Content-Type: application/json

{
  "nis": "123456",
  "title": "Update",
  "body": "Pesan notifikasi"
}
```

#### POST /push/unsubscribe
Hapus subscription

```bash
POST https://raporkita-db.workers.dev/push/unsubscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

### Express API Endpoints

#### POST /api/push/send
Kirim push notification dengan web-push library

```bash
POST http://localhost:3000/api/push/send
Content-Type: application/json

{
  "nis": "123456",
  "title": "📚 Update Nilai",
  "body": "Nilai Matematika Anda telah diperbarui menjadi 95",
  "data": {
    "table": "nilai_evaluasi",
    "record_id": "abc123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push notifications sent",
  "nis": "123456",
  "total": 2,
  "successCount": 2,
  "failureCount": 0
}
```

## 🎯 Use Cases

### 1. Siswa Mengizinkan Notifikasi

```typescript
// NotificationModal.tsx
const handleEnablePush = async () => {
  const { permission } = await requestNotificationPermission(student?.nis);
  if (permission === 'granted') {
    // Subscription otomatis disimpan
    await sendWebPushNotification('Notifikasi Aktif!', {
      body: 'Anda akan menerima update pembelajaran'
    });
  }
};
```

### 2. Admin Mengirim Notifikasi ke Siswa

```typescript
// Send via API
const response = await fetch('/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nis: '123456',
    title: '📋 Nilai Baru',
    body: 'Nilai Matematika telah diperbarui',
    data: { table: 'nilai_evaluasi', record_id: '123' }
  })
});

const result = await response.json();
console.log(`Sent to ${result.successCount} devices`);
```

### 3. Trigger dari Webhook (D1)

Jika ada perubahan data di D1, bisa trigger push notification:

```typescript
// Contoh webhook handler
if (payload.table === 'nilai_evaluasi') {
  const { nis, nilai } = payload.record;
  
  // Send push to specific NIS
  await fetch('http://localhost:3000/api/push/send', {
    method: 'POST',
    body: JSON.stringify({
      nis,
      title: '📊 Nilai Diperbarui',
      body: `Nilai evaluasi Anda: ${nilai}`,
      data: { table: 'nilai_evaluasi' }
    })
  });
}
```

## 🔐 Security

### VAPID Keys
- **Public Key**: Dapat di-share ke client (via Vite env)
- **Private Key**: HARUS rahasia, hanya di server (di .env)

### Subscription Validation
- Subscription di-encrypt dengan p256dh & auth
- Only server with private key dapat kirim push
- Browser auto-unsubscribe jika endpoint invalid (410 Gone)

### Rate Limiting
- Pertimbangkan rate limiting di `/api/push/send`
- Maksimal push per student per hari

## 🐛 Troubleshooting

### Push tidak diterima

1. **Check browser support**
   ```javascript
   console.log('Push Support:', 'serviceWorker' in navigator && 'PushManager' in window);
   ```

2. **Check subscription**
   ```bash
   GET /push/subscribers/:nis
   ```

3. **Check D1 table**
   ```bash
   npx wrangler d1 execute db-appku --remote --command "SELECT * FROM push_subscriptions_siswa"
   ```

### Service Worker error

```javascript
// Clear cache & re-register
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
  location.reload();
});
```

### VAPID key error

```
Error: VAPID keys not configured
```

✅ Solution: Set `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` di .env

## 📚 References

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push NPM](https://github.com/web-push-libs/web-push)

## ✅ Checklist

- [ ] Generate VAPID keys dengan `npx web-push generate-vapid-keys`
- [ ] Set VAPID keys di `.env`
- [ ] Run `npm install web-push`
- [ ] Create D1 table `push_subscriptions_siswa`
- [ ] Register service worker (`public/sw.js`)
- [ ] Test subscribe di browser DevTools
- [ ] Test send push via `/api/push/send`
- [ ] Configure webhook untuk auto-push
