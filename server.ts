import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const preferredPort = Number(process.env.PORT || 3000);

  app.use(express.json());

  // Server-side response cache for D1 proxy GET requests to minimize D1 read usage
  const d1ServerCache = new Map<string, { data: string; contentType: string; status: number; timestamp: number }>();
  const SERVER_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes TTL

  function clearD1ServerCache(urlPath?: string) {
    if (!urlPath) {
      d1ServerCache.clear();
      return;
    }
    const match = urlPath.match(/\/db\/([^/?]+)/);
    if (match) {
      const tableName = match[1];
      for (const key of d1ServerCache.keys()) {
        if (key.includes(`/db/${tableName}`)) {
          d1ServerCache.delete(key);
        }
      }
    } else {
      d1ServerCache.clear();
    }
  }

  // API routes
  app.use("/api/d1", async (req, res) => {
    const urlPath = req.url;
    const d1Url = `https://raporkita-db.dianrizkisofiawan0431.workers.dev${urlPath}`;

    // On mutation (POST, PUT, DELETE, etc.), clear server cache and pass request to D1
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      clearD1ServerCache(urlPath);
      try {
        const fetchOpts: RequestInit = {
          method: req.method,
          headers: {
            'Accept': 'application/json',
            'Content-Type': (req.headers['content-type'] as string) || 'application/json'
          }
        };
        if (req.body && Object.keys(req.body).length > 0) {
          fetchOpts.body = JSON.stringify(req.body);
        }
        const response = await fetch(d1Url, fetchOpts);
        const data = await response.text();
        res.status(response.status).set('Content-Type', response.headers.get('content-type') || 'application/json').send(data);
      } catch (error: any) {
        console.error('D1 Proxy Error:', error);
        res.status(500).json({ success: false, message: error.message });
      }
      return;
    }

    // For GET requests, check cache
    const cacheKey = urlPath;
    const now = Date.now();
    const cached = d1ServerCache.get(cacheKey);

    if (cached && (now - cached.timestamp < SERVER_CACHE_TTL_MS)) {
      res.status(cached.status).set('Content-Type', cached.contentType).send(cached.data);
      return;
    }

    try {
      const response = await fetch(d1Url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      const contentType = response.headers.get('content-type') || 'application/json';
      const data = await response.text();

      if (response.ok) {
        d1ServerCache.set(cacheKey, { data, contentType, status: response.status, timestamp: now });
      }

      res.status(response.status).set('Content-Type', contentType).send(data);
    } catch (error: any) {
      console.error('D1 Proxy Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/analisa", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: "GEMINI_API_KEY belum dikonfigurasi. Harap tambahkan GEMINI_API_KEY di Environment Variables tempat aplikasi di-host." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const { attendanceRecords, learningProgress, nilaiEvaluasi, outsideServices } = req.body;
    
    const prompt = `Anda adalah Asisten Pakar Akademik dan Konselor Pendidikan LBB. Analisis data akademik siswa berikut dan berikan laporan analisis yang sangat komprehensif, terstruktur, dan mendalam.

DATA AKADEMIK SISWA:
- Presensi Kehadiran: ${JSON.stringify(attendanceRecords)}
- Perkembangan Belajar (Penguasaan, Penjelasan, Kondisi): ${JSON.stringify(learningProgress)}
- Nilai Evaluasi & Tryout: ${JSON.stringify(nilaiEvaluasi)}
- Layanan Luar KBM & Konsultasi Tambahan: ${JSON.stringify(outsideServices)}

Sajikan hasil analisis dalam format Markdown yang sangat rapi, profesional, dan mudah dibaca dengan struktur berikut:

# 🎓 Ringkasan Eksekutif & Motivasi
- Berikan apresiasi dan gambaran umum performa siswa secara keseluruhan.
- Soroti tren perkembangan akademik terkini.

# 📊 Analisa Detail per Mata Pelajaran
Sajikan analisa khusus untuk **SETIAP MATA PELAJARAN** yang ada dalam data (contoh: Matematika, Bahasa Indonesia, Fisika, Kimia, Biologi, Geografi, dll). Untuk tiap mata pelajaran, wajib cantumkan:

### 📌 [Nama Mata Pelajaran]
1. **Analisa Performa & Pemahaman**:
   - Evaluasi nilai evaluasi, tingkat kehadiran, dan tingkat penguasaan materi dari pengajar.
2. **💪 Kelebihan & Kekuatan**:
   - Poin-poin spesifik apa yang menjadi keunggulan siswa pada mata pelajaran ini.
3. **⚠️ Kekurangan & Area Perbaikan**:
   - Poin-poin kendala, materi yang masih kurang dikuasai, atau kebiasaan belajar yang perlu ditingkatkan.
4. **💡 Saran & Strategi Perbaikan Nyata**:
   - Langkah konkret yang disarankan (misalnya: topik spesifik yang perlu diulang, pengajuan jadwal konsultasi tambahan/layanan luar KBM, perbanyak latihan soal, dll).

# 🎯 Rencana Aksi Prioritas
- Berikan 3-5 langkah aksi prioritas teratas yang harus dilakukan siswa minggu ini untuk memaksimalkan hasil belajar.

Gunakan bahasa Indonesia yang santun, memotivasi, jelas, dan berbasis data real yang diberikan.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      res.json({ recommendation: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || "Failed to generate recommendation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const listenOnPort = (port: number) => new Promise<number>((resolve, reject) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port}`);
      resolve(port);
    });

    server.on("error", (error: any) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(-1);
        return;
      }
      reject(error);
    });
  });

  let port = preferredPort;
  let nextPort = port;
  while (nextPort >= port) {
    const result = await listenOnPort(nextPort);
    if (result === -1) {
      nextPort += 1;
      continue;
    }
    break;
  }
}

startServer();
