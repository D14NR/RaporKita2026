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

  // API routes
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
