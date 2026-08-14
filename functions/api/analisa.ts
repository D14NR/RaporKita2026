interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "GEMINI_API_KEY belum dikonfigurasi. Harap tambahkan GEMINI_API_KEY di menu Settings > Environment Variables pada Cloudflare Pages Anda." 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await context.request.json() as any;
    const { attendanceRecords, learningProgress, nilaiEvaluasi, outsideServices } = body || {};

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Gagal memanggil Gemini API (${response.status}): ${errText}` }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json() as any;
    const recommendationText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada rekomendasi dari Gemini AI.";

    return new Response(
      JSON.stringify({ recommendation: recommendationText }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Terjadi kesalahan pada serverless Cloudflare Function" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
