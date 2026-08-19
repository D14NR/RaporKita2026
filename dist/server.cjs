var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const preferredPort = Number(process.env.PORT || 3e3);
  app.use(import_express.default.json());
  app.post("/api/analisa", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "GEMINI_API_KEY belum dikonfigurasi. Harap tambahkan GEMINI_API_KEY di Environment Variables tempat aplikasi di-host."
      });
    }
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
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

# \u{1F393} Ringkasan Eksekutif & Motivasi
- Berikan apresiasi dan gambaran umum performa siswa secara keseluruhan.
- Soroti tren perkembangan akademik terkini.

# \u{1F4CA} Analisa Detail per Mata Pelajaran
Sajikan analisa khusus untuk **SETIAP MATA PELAJARAN** yang ada dalam data (contoh: Matematika, Bahasa Indonesia, Fisika, Kimia, Biologi, Geografi, dll). Untuk tiap mata pelajaran, wajib cantumkan:

### \u{1F4CC} [Nama Mata Pelajaran]
1. **Analisa Performa & Pemahaman**:
   - Evaluasi nilai evaluasi, tingkat kehadiran, dan tingkat penguasaan materi dari pengajar.
2. **\u{1F4AA} Kelebihan & Kekuatan**:
   - Poin-poin spesifik apa yang menjadi keunggulan siswa pada mata pelajaran ini.
3. **\u26A0\uFE0F Kekurangan & Area Perbaikan**:
   - Poin-poin kendala, materi yang masih kurang dikuasai, atau kebiasaan belajar yang perlu ditingkatkan.
4. **\u{1F4A1} Saran & Strategi Perbaikan Nyata**:
   - Langkah konkret yang disarankan (misalnya: topik spesifik yang perlu diulang, pengajuan jadwal konsultasi tambahan/layanan luar KBM, perbanyak latihan soal, dll).

# \u{1F3AF} Rencana Aksi Prioritas
- Berikan 3-5 langkah aksi prioritas teratas yang harus dilakukan siswa minggu ini untuk memaksimalkan hasil belajar.

Gunakan bahasa Indonesia yang santun, memotivasi, jelas, dan berbasis data real yang diberikan.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });
      res.json({ recommendation: response.text });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate recommendation" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const listenOnPort = (port2) => new Promise((resolve, reject) => {
    const server = app.listen(port2, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${port2}`);
      resolve(port2);
    });
    server.on("error", (error) => {
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
//# sourceMappingURL=server.cjs.map
