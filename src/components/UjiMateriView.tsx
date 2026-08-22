import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  BarChart2, 
  RotateCcw, 
  Sparkles, 
  Brain, 
  Check, 
  ChevronRight, 
  Play, 
  AlertCircle,
  HelpCircle,
  Filter,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Database,
  RefreshCw,
  Image as ImageIcon,
  CheckSquare,
  ListChecks,
  AlignLeft,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { DataSiswa } from '../types';
import { d1 } from '../lib/d1';
import { supabaseUji } from '../lib/supabaseUji';
import { formatTanggalIndo } from '../lib/dateUtils';

export interface Question {
  id: string | number;
  question: string;
  tipe_soal?: string;
  options: string[];
  rawPilihan?: Record<string, string | null>;
  correctAnswer: number; // 0-based index
  correctAnswerText?: string;
  jawaban_benar_kompleks?: string[];
  parsedAnswerMap?: Record<string, string>;
  customOptionLabels?: string[];
  explanation: string;
  image_url?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  file_url?: string | null;
  bobot?: number | null;
}

const parseStatementAnswerMap = (jwRaw: any, jwStr: string): Record<string, string> => {
  const map: Record<string, string> = {};

  if (jwRaw && typeof jwRaw === 'object') {
    if (!Array.isArray(jwRaw)) {
      Object.entries(jwRaw).forEach(([k, v]) => {
        const upperK = k.replace(/pilihan_|pernyataan_|opsi_/gi, '').toUpperCase().trim();
        if (['A', 'B', 'C', 'D', 'E'].includes(upperK)) {
          map[upperK] = String(v ?? '').trim();
        } else if (v && typeof v === 'object') {
          const subVal = String((v as any).teks ?? (v as any).text ?? (v as any).value ?? (v as any).status ?? (v as any).jawaban ?? '').trim();
          if (subVal) map[upperK.charAt(0)] = subVal;
        }
      });
      if (Object.keys(map).length > 0) return map;
    } else {
      jwRaw.forEach((item: any, idx: number) => {
        const letter = String.fromCharCode(65 + idx);
        if (item && typeof item === 'object') {
          const key = String(item.kode || item.key || item.pilihan || item.label || letter).toUpperCase().trim();
          const val = String(item.teks ?? item.text ?? item.value ?? item.status ?? item.jawaban ?? item.benar ?? '').trim();
          if (val) map[key.charAt(0)] = val === 'true' ? 'Benar' : (val === 'false' ? 'Salah' : val);
        } else if (item != null) {
          map[letter] = String(item).trim();
        }
      });
      if (Object.keys(map).length > 0) return map;
    }
  }

  const kvRegex = /([A-E])\s*[:=]\s*([^,;]+)/gi;
  let match;
  let foundKv = false;
  while ((match = kvRegex.exec(jwStr)) !== null) {
    foundKv = true;
    map[match[1].toUpperCase()] = match[2].trim();
  }
  if (foundKv && Object.keys(map).length > 0) return map;

  let list: string[] = [];
  if (jwStr && jwStr.includes(',')) {
    list = jwStr.split(',').map(s => s.trim()).filter(Boolean);
  } else if (jwStr && jwStr.length <= 5 && /^[BS]+$/i.test(jwStr)) {
    list = jwStr.split('');
  }

  if (list.length > 0) {
    list.forEach((val, idx) => {
      const letter = String.fromCharCode(65 + idx);
      map[letter] = val;
    });
  }

  return map;
};

const isMatchAnswer = (userVal: string | undefined, targetVal: string | undefined): boolean => {
  if (!userVal || !targetVal) return false;
  const u = userVal.trim().toLowerCase();
  const t = targetVal.trim().toLowerCase();

  if (u === t) return true;

  const isU_B = u === 'b' || u === 'benar' || u === 'benar (b)' || u === 'true' || u === '1';
  const isT_B = t === 'b' || t === 'benar' || t === 'benar (b)' || t === 'true' || t === '1';
  if (isU_B && isT_B) return true;

  const isU_S = u === 's' || u === 'salah' || u === 'salah (s)' || u === 'false' || u === '0';
  const isT_S = t === 's' || t === 'salah' || t === 'salah (s)' || t === 'false' || t === '0';
  if (isU_S && isT_S) return true;

  const isU_St = u === 'st' || u === 'setuju' || u === 'agree';
  const isT_St = t === 'st' || t === 'setuju' || t === 'agree';
  if (isU_St && isT_St) return true;

  const isU_Ts = u === 'ts' || u === 'tidak setuju' || u === 'disagree';
  const isT_Ts = t === 'ts' || t === 'tidak setuju' || t === 'disagree';
  if (isU_Ts && isT_Ts) return true;

  const isU_Ses = u === 'sesuai' || u === 'cocok';
  const isT_Ses = t === 'sesuai' || t === 'cocok';
  if (isU_Ses && isT_Ses) return true;

  const isU_Tses = u === 'tidak sesuai' || u === 'tidak cocok';
  const isT_Tses = t === 'tidak sesuai' || t === 'tidak cocok';
  if (isU_Tses && isT_Tses) return true;

  return false;
};

export interface QuizPackage {
  id: string;
  subject: string;
  title: string;
  subBab: string;
  jenjang: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit';
  questions: Question[];
  kodePengajar?: string | null;
  namaPengajar?: string | null;
  isFromSupabase?: boolean;
}

export interface QuizAttempt {
  id: string;
  packageId: string;
  subject: string;
  title: string;
  subBab: string;
  date: string; // YYYY-MM-DD HH:mm
  score: number;
  correctCount: number;
  answeredCount?: number;
  totalQuestions: number;
  durationSeconds: number;
  userAnswers: any[];
  percobaan?: number;
}

type NilaiEvaluasiInsert = {
  id: string;
  siswa_id: string | null;
  nis: string | null;
  nama_siswa: string | null;
  jenjang_studi: string | null;
  tanggal: string;
  kode_pengajar: string | null;
  nama_pengajar: string | null;
  mata_pelajaran: string | null;
  sub_bab_kode_soal: string | null;
  nilai: number;
  cabang: string;
};

interface UjiMateriViewProps {
  currentStudent: DataSiswa | null;
}

const cleanHtmlString = (html: string): string => {
  if (!html) return '';
  let cleaned = String(html)
    // Remove editor resize handles or editor UI artifacts
    .replace(/<span[^>]*class="[^"]*resize-handle[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span[^>]*class='[^']*resize-handle[^']*'[^>]*>[\s\S]*?<\/span>/gi, '')
    // Clean inline outline or move cursor style noise
    .replace(/outline:[^;"]*;?/gi, '')
    .replace(/cursor:\s*(move|nwse-resize);?/gi, '')
    .replace(/user-select:\s*none;?/gi, '');
  return cleaned;
};

const isHtmlString = (str: string): boolean => {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str.trim());
};

export const RichTextDisplay = ({ content, className = '' }: { content: string; className?: string }) => {
  if (!content) return null;
  const cleaned = cleanHtmlString(content);

  if (isHtmlString(cleaned)) {
    return (
      <div
        className={`rich-text-content ${className}`}
        dangerouslySetInnerHTML={{ __html: cleaned }}
      />
    );
  }

  return <span className={className}>{content}</span>;
};

export const UjiMateriView: React.FC<UjiMateriViewProps> = ({ currentStudent }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('Semua');
  const [activeTabSub, setActiveTabSub] = useState<'paket' | 'riwayat' | 'analisis'>('paket');
  
  // Supabase state
  const [dbPackages, setDbPackages] = useState<QuizPackage[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Active quiz session state
  const [activeQuizPackage, setActiveQuizPackage] = useState<QuizPackage | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>([]);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);
  const [reviewingAttempt, setReviewingAttempt] = useState<QuizAttempt | null>(null);
  const [maxWarning, setMaxWarning] = useState<string | null>(null);

  // History state saved in LocalStorage per student NIS
  const [attemptsHistory, setAttemptsHistory] = useState<QuizAttempt[]>([]);
  const [sentSubBabs, setSentSubBabs] = useState<string[]>([]);

  const nisKey = currentStudent?.nis || 'default';

  const resolveStudentBranch = async () => {
    const currentBranch = String(currentStudent?.cabang || '').trim();
    if (currentBranch) return currentBranch;

    const nis = currentStudent?.nis || localStorage.getItem('active_nis');
    if (!nis) {
      throw new Error('NIS siswa tidak ditemukan untuk menentukan cabang.');
    }

    const { data, error } = await d1
      .from('data_siswa')
      .select('cabang')
      .eq('nis', nis)
      .maybeSingle();

    if (error) throw error;

    const branch = String(data?.cabang || '').trim();
    if (!branch) {
      throw new Error('Cabang siswa belum terisi di data_siswa. Nilai tidak disimpan sebelum cabang tersedia.');
    }

    return branch;
  };

  const buildNilaiEvaluasiRecord = async ({
    packageData,
    score,
    id,
  }: {
    packageData: QuizPackage;
    score: number;
    id: string;
  }): Promise<NilaiEvaluasiInsert> => {
    const nis = currentStudent?.nis || localStorage.getItem('active_nis');
    const cabang = await resolveStudentBranch();

    return {
      id,
      siswa_id: currentStudent?.id || null,
      nis: nis || null,
      nama_siswa: currentStudent?.nama || null,
      jenjang_studi: currentStudent?.jenjang_studi || packageData.jenjang || null,
      tanggal: new Date().toISOString().split('T')[0],
      kode_pengajar: packageData.kodePengajar || null,
      nama_pengajar: packageData.namaPengajar || null,
      mata_pelajaran: packageData.subject || null,
      sub_bab_kode_soal: packageData.subBab || packageData.title || null,
      nilai: Math.max(0, Math.min(100, Number(score) || 0)),
      cabang,
    };
  };

  // Helper to parse question type
  const normalizeTipeSoal = (tipe?: any): 'pilihan_ganda' | 'pilihan_kompleks' | 'pilihan_benar_salah' | 'pilihan_setuju_tidak' | 'esai' => {
    if (!tipe) return 'pilihan_ganda';
    const t = String(tipe).toLowerCase().trim();
    if (t === 'pk' || t.includes('kompleks') || t.includes('majemuk') || t.includes('multiple choice')) return 'pilihan_kompleks';
    if (t === 'bs' || t.includes('benar') || t.includes('salah') || t.includes('true') || t.includes('false')) return 'pilihan_benar_salah';
    if (t === 'st' || t.includes('setuju') || t.includes('tidak')) return 'pilihan_setuju_tidak';
    if (t === 'esai' || t.includes('essay') || t.includes('uraian') || t.includes('isian')) return 'esai';
    return 'pilihan_ganda';
  };

  const calculateQuestionScore = (q: Question, userAns: any): { earned: number; max: number } => {
    const tipe = normalizeTipeSoal(q.tipe_soal);
    const qWeight = q.bobot && q.bobot > 0 ? q.bobot : 1;

    if (tipe === 'pilihan_ganda') {
      const max = qWeight;
      const earned = (userAns === q.correctAnswer) ? qWeight : 0;
      return { earned, max };
    } else if (tipe === 'pilihan_kompleks') {
      const max = qWeight;
      if (Array.isArray(userAns) && userAns.length > 0) {
        const targetKeys = q.jawaban_benar_kompleks || [];
        if (targetKeys.length > 0) {
          let matched = 0;
          targetKeys.forEach(k => {
            if (userAns.includes(k)) matched++;
          });
          const ratio = matched / targetKeys.length;
          const earned = ratio * qWeight;
          return { earned: Number(earned.toFixed(2)), max };
        }
      }
      return { earned: 0, max };
    } else if (tipe === 'pilihan_benar_salah' || tipe === 'pilihan_setuju_tidak') {
      let activeStatements = 0;
      let questionPointsEarned = 0;
      let questionPointsTotal = 0;

      ['A', 'B', 'C', 'D', 'E'].forEach((key) => {
        const statementText = q.rawPilihan?.[key] || q.options[['A', 'B', 'C', 'D', 'E'].indexOf(key)];
        if (statementText && statementText.trim().length > 0) {
          activeStatements++;
          const stmtPoint = Number(q.bobot && q.bobot > 0 ? (q.bobot / 5) : 1);
          questionPointsTotal += stmtPoint;

          const targetVal = q.parsedAnswerMap?.[key] || '';
          const userVal = userAns?.[key];
          if (isMatchAnswer(userVal, targetVal)) {
            questionPointsEarned += stmtPoint;
          }
        }
      });

      const finalQWeight = q.bobot && q.bobot > 0 ? q.bobot : (activeStatements > 0 ? activeStatements : 1);
      if (activeStatements > 0 && questionPointsTotal > 0) {
        const scaledEarned = (questionPointsEarned / questionPointsTotal) * finalQWeight;
        return { earned: Number(scaledEarned.toFixed(2)), max: finalQWeight };
      }
      return { earned: 0, max: finalQWeight };
    } else if (tipe === 'esai') {
      const max = qWeight;
      const earned = (typeof userAns === 'string' && userAns.trim().length > 0) ? qWeight : 0;
      return { earned, max };
    } else {
      const max = qWeight;
      const earned = (userAns === q.correctAnswer) ? qWeight : 0;
      return { earned, max };
    }
  };

  // Load quiz packages from Supabase bank_soal and butir_soal.
  const fetchUjiMateriFromSupabase = async () => {
    setIsLoadingDb(true);
    setDbError(null);

    if (!supabaseUji) {
      setDbError('Konfigurasi Supabase Uji Materi belum tersedia. Periksa VITE_SUPABASE_UJI dan VITE_SUPABASE_ANON_KEY_UJI, lalu build & deploy ulang aplikasi.');
      setIsLoadingDb(false);
      return;
    }

    try {
      // 1. Fetch quiz packages.
      const { data: bankData, error: bankErr } = await supabaseUji
        .from('bank_soal')
        .select('*')
        .order('created_at', { ascending: false });

      if (bankErr) throw bankErr;
      let mapelData = bankData || [];

      // Filter active items and match student's jenjang_studi
      mapelData = mapelData.filter((m: any) => {
        if (m.is_active === false) return false;

        const studentJenjang = (currentStudent?.jenjang_studi || '').trim().toLowerCase();
        const pkgJenjang = (m.jenjang_studi || '').trim().toLowerCase();

        if (!studentJenjang) return true;
        if (!pkgJenjang || pkgJenjang === 'semua' || pkgJenjang === 'semua jenjang') return true;

        return pkgJenjang === studentJenjang || 
               pkgJenjang.includes(studentJenjang) || 
               studentJenjang.includes(pkgJenjang);
      });

      if (!mapelData || mapelData.length === 0) {
        setDbPackages([]);
        setIsLoadingDb(false);
        return;
      }

      // 2. Fetch butir_soal
      const { data: soalData, error: soalErr } = await supabaseUji
        .from('butir_soal')
        .select('*')
        .order('nomor_urut', { ascending: true });

      if (soalErr) {
        console.warn('Error loading butir_soal:', soalErr);
      }

      // 3. Transform mapelData & soalData into QuizPackage[]
      const packages: QuizPackage[] = mapelData.map((m: any) => {
        const rawQuestions = (soalData || []).filter((s: any) => 
          s.bank_soal_id === m.id
        );

        const mappedQuestions: Question[] = rawQuestions.map((s: any, idx: number) => {
          let options: string[] = [];
          const rawPilihan: Record<string, string | null> = {
            A: s.pilihan_a || null,
            B: s.pilihan_b || null,
            C: s.pilihan_c || null,
            D: s.pilihan_d || null,
            E: s.pilihan_e || null,
          };

          // 1. Parse data_opsi if present (jsonb)
          let dataOpsi = s.data_opsi;
          if (typeof dataOpsi === 'string' && (dataOpsi.startsWith('[') || dataOpsi.startsWith('{'))) {
            try {
              dataOpsi = JSON.parse(dataOpsi);
            } catch {
              // Ignore string parse error
            }
          }

          let autoCorrectKey: string | null = null;
          let autoKompleksKeys: string[] = [];
          let customOptionLabels: string[] | undefined = undefined;

          if (dataOpsi) {
            if (Array.isArray(dataOpsi) && dataOpsi.length <= 3 && dataOpsi.every(x => typeof x === 'string' && x.length <= 20)) {
              const lowerItems = dataOpsi.map(x => x.toString().toLowerCase().trim());
              if (lowerItems.some(i => i.includes('sesuai') || i.includes('setuju') || i.includes('benar') || i.includes('salah'))) {
                customOptionLabels = dataOpsi.map(x => String(x).trim());
              }
            }

            if (!customOptionLabels) {
              let optionList: any[] | null = null;
              if (Array.isArray(dataOpsi)) {
                optionList = dataOpsi;
              } else if (typeof dataOpsi === 'object' && dataOpsi !== null) {
                if (Array.isArray(dataOpsi.opsi) || Array.isArray(dataOpsi.options)) {
                  const opts = dataOpsi.opsi || dataOpsi.options;
                  if (opts.every((x: any) => typeof x === 'string')) {
                    customOptionLabels = opts;
                  }
                }
                if (Array.isArray(dataOpsi.pilihan)) optionList = dataOpsi.pilihan;
                else if (Array.isArray(dataOpsi.items)) optionList = dataOpsi.items;
                else if (Array.isArray(dataOpsi.pernyataan)) optionList = dataOpsi.pernyataan;
                else if (Array.isArray(dataOpsi.statements)) optionList = dataOpsi.statements;
                else if (Array.isArray(dataOpsi.data_opsi)) optionList = dataOpsi.data_opsi;
                else if (dataOpsi.pernyataan && typeof dataOpsi.pernyataan === 'object') {
                  Object.entries(dataOpsi.pernyataan).forEach(([k, v]) => {
                    const upperKey = k.toUpperCase();
                    const textVal = String(v ?? '');
                    if (textVal) {
                      rawPilihan[upperKey] = textVal;
                      options.push(textVal);
                    }
                  });
                }
              }

              if (optionList) {
                optionList.forEach((opt: any, optIdx: number) => {
                  const labelKey = String(opt?.kode || opt?.key || opt?.label || String.fromCharCode(65 + optIdx)).toUpperCase();
                  let textVal = '';
                  if (typeof opt === 'string' || typeof opt === 'number') {
                    textVal = String(opt);
                  } else if (opt && typeof opt === 'object') {
                    textVal = String(opt.teks ?? opt.text ?? opt.value ?? opt.label ?? opt.opsi ?? opt.pernyataan ?? '');
                    if (opt.benar === true || Number(opt.point) > 0 || opt.is_correct === true) {
                      autoCorrectKey = labelKey;
                      autoKompleksKeys.push(labelKey);
                    }
                  }
                  if (textVal) {
                    options.push(textVal);
                    rawPilihan[labelKey] = textVal;
                  }
                });
              } else if (typeof dataOpsi === 'object' && dataOpsi !== null) {
                Object.entries(dataOpsi).forEach(([key, val]) => {
                  if (['opsi', 'options', 'pilihan'].includes(key)) return;
                  const upperKey = key.toUpperCase();
                  let strVal = '';
                  if (typeof val === 'string' || typeof val === 'number') {
                    strVal = String(val);
                  } else if (val && typeof val === 'object') {
                    strVal = String((val as any).teks ?? (val as any).text ?? (val as any).value ?? (val as any).label ?? (val as any).opsi ?? '');
                    if ((val as any).benar === true || Number((val as any).point) > 0 || (val as any).is_correct === true) {
                      autoCorrectKey = upperKey;
                      autoKompleksKeys.push(upperKey);
                    }
                  }
                  if (strVal) {
                    rawPilihan[upperKey] = strVal;
                    options.push(strVal);
                  }
                });
              }
            }
          }

          if (options.length === 0) {
            // Fallback to s.pilihan_a ... s.pilihan_e
            if (s.pilihan_a) options.push(s.pilihan_a);
            if (s.pilihan_b) options.push(s.pilihan_b);
            if (s.pilihan_c) options.push(s.pilihan_c);
            if (s.pilihan_d) options.push(s.pilihan_d);
            if (s.pilihan_e) options.push(s.pilihan_e);
          }

          const tipeNorm = normalizeTipeSoal(s.tipe_soal);

          // Standard options fallback for pilihan ganda or kompleks if empty
          if (options.length === 0 && tipeNorm !== 'esai') {
            options.push('Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D');
          }

          // 2. Parse jawaban_benar (jsonb)
          let jwRaw = s.jawaban_benar;
          if (typeof jwRaw === 'string' && (jwRaw.startsWith('[') || jwRaw.startsWith('{'))) {
            try {
              jwRaw = JSON.parse(jwRaw);
            } catch {
              // Keep raw
            }
          }

          let jwStr = '';
          let kompleksAnswers: string[] = [];

          if (Array.isArray(jwRaw)) {
            kompleksAnswers = jwRaw.map((k: any) => {
              if (typeof k === 'object' && k !== null) {
                return String(k.kode || k.key || k.value || k.label || '').trim().toUpperCase();
              }
              return String(k ?? '').trim().toUpperCase();
            }).filter(Boolean);
            jwStr = kompleksAnswers.join(', ');
          } else if (jwRaw && typeof jwRaw === 'object') {
            if (jwRaw.kode || jwRaw.key || jwRaw.text || jwRaw.teks) {
              jwStr = String(jwRaw.kode || jwRaw.key || jwRaw.text || jwRaw.teks).trim();
            } else {
              kompleksAnswers = Object.values(jwRaw).map((k: any) => String(k ?? '').trim().toUpperCase()).filter(Boolean);
              jwStr = kompleksAnswers.join(', ');
            }
          } else if (jwRaw != null) {
            jwStr = String(jwRaw).trim();
          }

          if (!jwStr && autoCorrectKey) {
            jwStr = autoCorrectKey;
          }
          if (kompleksAnswers.length === 0 && autoKompleksKeys.length > 0) {
            kompleksAnswers = autoKompleksKeys;
          }

          // Check s.jawaban_benar_kompleks if provided separately
          if (s.jawaban_benar_kompleks) {
            let jwK = s.jawaban_benar_kompleks;
            if (typeof jwK === 'string' && (jwK.startsWith('[') || jwK.startsWith('{'))) {
              try { jwK = JSON.parse(jwK); } catch {}
            }
            if (Array.isArray(jwK)) {
              kompleksAnswers = jwK.map((k: any) => String(k ?? '').trim().toUpperCase());
            } else if (typeof jwK === 'string') {
              kompleksAnswers = jwK.split(',').map((k: string) => String(k ?? '').trim().toUpperCase());
            }
          } else if (kompleksAnswers.length === 0 && jwStr.includes(',')) {
            kompleksAnswers = jwStr.split(',').map((k: string) => String(k ?? '').trim().toUpperCase());
          }

          const parsedAnswerMap = parseStatementAnswerMap(jwRaw, jwStr);

          if (!customOptionLabels && Object.keys(parsedAnswerMap).length > 0) {
            const vals = Array.from(new Set(Object.values(parsedAnswerMap).map(v => v.trim())));
            if (vals.some(v => /sesuai/i.test(v))) {
              customOptionLabels = ['Sesuai', 'Tidak Sesuai'];
            } else if (vals.some(v => /setuju/i.test(v))) {
              customOptionLabels = ['Setuju', 'Tidak Setuju'];
            } else if (vals.some(v => /benar|salah|^[BS]$/i.test(v))) {
              customOptionLabels = ['BENAR (B)', 'SALAH (S)'];
            }
          }

          let correctAnswerIndex = 0;
          const jwUpper = jwStr.toUpperCase().trim();
          if (jwUpper === 'A' || jwUpper === '1') correctAnswerIndex = 0;
          else if (jwUpper === 'B' || jwUpper === '2') correctAnswerIndex = 1;
          else if (jwUpper === 'C' || jwUpper === '3') correctAnswerIndex = 2;
          else if (jwUpper === 'D' || jwUpper === '4') correctAnswerIndex = 3;
          else if (jwUpper === 'E' || jwUpper === '5') correctAnswerIndex = 4;
          else {
            const foundIdx = options.findIndex((opt, oIdx) => {
              const label = String.fromCharCode(65 + oIdx);
              return label === jwUpper || opt.toUpperCase().trim() === jwUpper;
            });
            if (foundIdx !== -1) correctAnswerIndex = foundIdx;
          }

          const totalBobot = Number(s.total_bobot ?? s.bobot ?? 10);

          return {
            id: s.id || `soal-${idx + 1}`,
            question: s.pertanyaan || `Soal Pertanyaan #${s.nomor_urut || idx + 1}`,
            tipe_soal: s.tipe_soal || 'pilihan_ganda',
            options,
            rawPilihan,
            correctAnswer: correctAnswerIndex,
            correctAnswerText: jwStr,
            jawaban_benar_kompleks: kompleksAnswers,
            parsedAnswerMap,
            customOptionLabels,
            image_url: s.image_url,
            video_url: s.video_url,
            audio_url: s.audio_url,
            file_url: s.file_url,
            bobot: totalBobot,
            explanation: jwStr ? `Kunci Jawaban (${(s.tipe_soal || 'PILIHAN').toUpperCase()}): ${jwStr}` : 'Pembahasan materi uji.'
          };
        });

        return {
          id: m.id,
          subject: m.mata_pelajaran || 'Mata Pelajaran',
          title: `${m.mata_pelajaran} (${m.jenis_tes || 'Evaluasi'})`,
          subBab: m.kode_soal_atau_sub_bab || 'Sub Bab',
          jenjang: m.jenjang_studi || 'Semua Jenjang',
          totalQuestions: mappedQuestions.length,
          timeLimitMinutes: m.durasi && m.durasi > 0 ? m.durasi : 15,
          difficulty: 'Sedang',
          questions: mappedQuestions,
          kodePengajar: m.kode_pengajar || null,
          namaPengajar: m.nama_pengajar,
          isFromSupabase: true
        };
      });

      setDbPackages(packages);
    } catch (err: any) {
      console.error('Error fetching Uji Materi Supabase:', err);
      setDbError(err.message || 'Gagal terhubung ke database Supabase Uji Materi.');
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchUjiMateriFromSupabase();

    if (!supabaseUji) return;

    // Supabase realtime listeners
    const channelBankSoal = supabaseUji
      .channel('public:bank_soal_uji')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bank_soal' }, () => {
        fetchUjiMateriFromSupabase();
      })
      .subscribe();

    const channelSoal = supabaseUji
      .channel('public:butir_soal_uji')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'butir_soal' }, () => {
        fetchUjiMateriFromSupabase();
      })
      .subscribe();

    return () => {
      if (supabaseUji) {
        supabaseUji.removeChannel(channelBankSoal);
        supabaseUji.removeChannel(channelSoal);
      }
    };
  }, []);

  const fetchStudentEvaluationRows = async () => {
    const nis = currentStudent?.nis || localStorage.getItem('active_nis');
    const studentId = currentStudent?.id;
    const columns = 'id,siswa_id,nis,nama_siswa,jenjang_studi,tanggal,kode_pengajar,nama_pengajar,mata_pelajaran,sub_bab_kode_soal,nilai,cabang,created_at,updated_at';

    if (!nis && !studentId) return [];

    const { data: nisRows, error: nisError } = nis
      ? await d1
        .from('nilai_evaluasi')
        .select(columns)
        .eq('nis', nis)
        .order('tanggal', { ascending: false })
      : { data: [], error: null };

    if (nisError) throw nisError;

    const rowsById = new Map<string, any>();
    for (const row of nisRows || []) {
      rowsById.set(String(row.id), row);
    }

    if (studentId) {
      const { data: studentRows, error: studentError } = await d1
        .from('nilai_evaluasi')
        .select(columns)
        .eq('siswa_id', studentId)
        .order('tanggal', { ascending: false });

      if (studentError) throw studentError;
      for (const row of studentRows || []) {
        rowsById.set(String(row.id), row);
      }
    }

    return Array.from(rowsById.values()).sort((left, right) =>
      String(right.tanggal || right.created_at || '').localeCompare(
        String(left.tanggal || left.created_at || '')
      )
    );
  };

  const fetchAttemptsFromD1 = async () => {
    try {
      const data = await fetchStudentEvaluationRows();
      if (data.length > 0) {
        const mapped: QuizAttempt[] = data.map((row: any) => {
          const matchingPackage = dbPackages.find((pkg) => {
            const rowSubBab = String(row.sub_bab_kode_soal || '').trim().toLowerCase();
            const rowSubject = String(row.mata_pelajaran || '').trim().toLowerCase();
            return rowSubBab === String(pkg.subBab).trim().toLowerCase()
              && (!rowSubject || rowSubject === String(pkg.subject).trim().toLowerCase());
          });
          const totalQuestions = matchingPackage?.questions.length || 0;

          return {
            id: row.id,
            packageId: matchingPackage?.id || row.sub_bab_kode_soal || row.id,
            subject: row.mata_pelajaran || 'Umum',
            title: row.sub_bab_kode_soal || 'Uji Materi',
            subBab: row.sub_bab_kode_soal || '-',
            date: row.tanggal || row.created_at,
            score: Number(row.nilai) || 0,
            correctCount: Number(row.nilai) >= 70 ? 1 : 0,
            answeredCount: totalQuestions > 0 ? totalQuestions : 1,
            totalQuestions: totalQuestions || 1,
            durationSeconds: 0,
            userAnswers: [],
            percobaan: undefined
          };
        });
        setAttemptsHistory(mapped);
      } else setAttemptsHistory([]);
    } catch (err) {
      console.error('Error fetching riwayat nilai dari D1:', err);
      setAttemptsHistory([]);
    }
  };

  const fetchSentEvaluations = async () => {
    try {
      const data = await fetchStudentEvaluationRows();
      const subBabs = data
        .map((row: any) => row.sub_bab_kode_soal)
        .filter(Boolean);
      setSentSubBabs(subBabs);
    } catch (err) {
      console.error('Error fetching sent evaluations:', err);
      setSentSubBabs([]);
    }
  };

  useEffect(() => {
    fetchAttemptsFromD1();
    fetchSentEvaluations();
  }, [nisKey, dbPackages]);

  const saveAttemptToHistory = (newAttempt: QuizAttempt) => {
    fetchAttemptsFromD1();
  };

  // Timer effect
  useEffect(() => {
    if (!activeQuizPackage || isQuizCompleted || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuizPackage, isQuizCompleted, timeRemainingSeconds]);

  useEffect(() => {
    setMaxWarning(null);
  }, [currentQuestionIdx]);

  const startQuiz = async (pkg: QuizPackage) => {
    const nis = currentStudent?.nis || localStorage.getItem('active_nis');
    const studentId = currentStudent?.id;

    if (!nis) {
      alert('Identitas siswa tidak ditemukan. Silakan masuk kembali.');
      return;
    }

    try {
      const { data: nisRows, error: nisError } = await d1
        .from('nilai_evaluasi')
        .select('nis, siswa_id, sub_bab_kode_soal')
        .eq('nis', nis);

      if (nisError) throw nisError;

      let evaluationRows = nisRows || [];
      if (evaluationRows.length === 0 && studentId) {
        const { data: studentRows, error: studentError } = await d1
          .from('nilai_evaluasi')
          .select('nis, siswa_id, sub_bab_kode_soal')
          .eq('siswa_id', studentId);

        if (studentError) throw studentError;
        evaluationRows = studentRows || [];
      }

      const packageSubBab = normalizeAnalysisText(pkg.subBab);
      const packageTitle = normalizeAnalysisText(pkg.title);
      const hasSavedEvaluation = evaluationRows.some((row: any) => {
        const submittedSubBab = normalizeAnalysisText(row.sub_bab_kode_soal);
        return submittedSubBab.length > 0 && (
          submittedSubBab === packageSubBab || submittedSubBab === packageTitle
        );
      });

      if (hasSavedEvaluation || isPackageCompleted(pkg)) {
        alert('Anda sudah mengerjakan sub-bab ini dan tidak diperbolehkan mengerjakannya kembali.');
        return;
      }
    } catch (error: any) {
      console.error('Gagal memeriksa riwayat pengerjaan:', error);
      alert(`Riwayat pengerjaan belum dapat diverifikasi: ${error?.message || String(error)}`);
      return;
    }

    if (isPackageCompleted(pkg)) {
      alert('Anda sudah mengirimkan nilai untuk Uji Materi ini dan tidak diperbolehkan mengerjakannya kembali.');
      return;
    }

    if (!pkg.questions || pkg.questions.length === 0) {
      alert('Paket Uji Materi ini belum memiliki butir soal di database.');
      return;
    }
    setActiveQuizPackage(pkg);
    setCurrentQuestionIdx(0);
    setUserAnswers(new Array(pkg.questions.length).fill(null));
    setFlaggedQuestions(new Array(pkg.questions.length).fill(false));
    setTimeRemainingSeconds(pkg.timeLimitMinutes * 60);
    setIsQuizCompleted(false);
    setCompletedAttempt(null);
    setReviewingAttempt(null);
    setMaxWarning(null);
  };

  const toggleFlag = () => {
    const next = [...flaggedQuestions];
    next[currentQuestionIdx] = !next[currentQuestionIdx];
    setFlaggedQuestions(next);
  };

  const finishQuiz = async () => {
    if (!activeQuizPackage) return;

    let totalPossiblePoints = 0;
    let totalEarnedPoints = 0;
    let fullyCorrectCount = 0;

    activeQuizPackage.questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const { earned, max } = calculateQuestionScore(q, userAns);
      totalPossiblePoints += max;
      totalEarnedPoints += earned;

      if (earned === max && max > 0) {
        fullyCorrectCount += 1;
      }
    });

    const totalQ = activeQuizPackage.questions.length || 1;
    let answeredCount = 0;
    activeQuizPackage.questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      const tipe = normalizeTipeSoal(q.tipe_soal);
      if (userAns !== null && userAns !== undefined) {
        if (tipe === 'pilihan_ganda' || tipe === 'esai') {
          if (userAns !== '' && userAns !== null && userAns !== undefined) answeredCount++;
        } else if (tipe === 'pilihan_kompleks') {
          if (Array.isArray(userAns) && userAns.length > 0) answeredCount++;
        } else if (tipe === 'pilihan_benar_salah' || tipe === 'pilihan_setuju_tidak') {
          if (typeof userAns === 'object' && Object.keys(userAns).length > 0) answeredCount++;
        } else {
          answeredCount++;
        }
      }
    });

    const score = totalPossiblePoints > 0 
      ? Math.round((totalEarnedPoints / totalPossiblePoints) * 100) 
      : 0;
    const durationUsed = (activeQuizPackage.timeLimitMinutes * 60) - timeRemainingSeconds;

    const saveEvaluationToD1 = async () => {
      const payload = await buildNilaiEvaluasiRecord({
        packageData: activeQuizPackage,
        score,
        id: `uji-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });

      const { error } = await d1.from('nilai_evaluasi').insert([payload]);
      if (error) {
        throw new Error(`Gagal menyimpan nilai ke database D1: ${error.message}`);
      }
    };

    try {
      await saveEvaluationToD1();
    } catch (error: any) {
      console.error('Error menyimpan hasil Uji Materi:', error);
      alert(error?.message || 'Hasil Uji Materi gagal disimpan.');
      return;
    }

    const now = new Date();
    const dateStr = formatTanggalIndo(now, { withDayName: true, withTime: true });

    const newAttempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      packageId: activeQuizPackage.id,
      subject: activeQuizPackage.subject,
      title: activeQuizPackage.title,
      subBab: activeQuizPackage.subBab,
      date: dateStr,
      score,
      correctCount: fullyCorrectCount,
      answeredCount,
      totalQuestions: totalQ,
      durationSeconds: Math.max(durationUsed, 1),
      userAnswers: [...userAnswers],
      percobaan: 1
    };

    setIsQuizCompleted(true);
    setCompletedAttempt(newAttempt);
    saveAttemptToHistory(newAttempt);
  };

  // Database packages from Supabase
  const allPackages = dbPackages;

  // Dynamically extract unique subjects for filtering
  const dynamicSubjects = Array.from(new Set(allPackages.map(p => p.subject))).filter(Boolean);
  const availableSubjects = ['Semua', ...dynamicSubjects];

  const filteredPackages = allPackages.filter(pkg => {
    if (selectedSubject === 'Semua') return true;
    return pkg.subject.toLowerCase() === selectedSubject.toLowerCase();
  });

  // Calculate statistics
  const totalAttempts = attemptsHistory.length;
  const avgScore = totalAttempts > 0 
    ? Math.round(attemptsHistory.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts) 
    : 0;
  const passedCount = attemptsHistory.filter(a => a.score >= 70).length;

  const normalizeAnalysisText = (value: unknown) => String(value || '').trim().toLowerCase();

  const getPackageAttempts = (pkg: QuizPackage) => attemptsHistory.filter((attempt) => {
    if (attempt.packageId === pkg.id) return true;

    return normalizeAnalysisText(attempt.subBab) === normalizeAnalysisText(pkg.subBab)
      && normalizeAnalysisText(attempt.subject) === normalizeAnalysisText(pkg.subject);
  });

  const isPackageCompleted = (pkg: QuizPackage) => {
    const packageSubBab = normalizeAnalysisText(pkg.subBab);
    const packageTitle = normalizeAnalysisText(pkg.title);

    return getPackageAttempts(pkg).length > 0 || sentSubBabs.some((value) => {
      const submittedSubBab = normalizeAnalysisText(value);
      return submittedSubBab.length > 0 && (
        submittedSubBab === packageSubBab || submittedSubBab === packageTitle
      );
    });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div id="view-uji-materi" className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* HEADER SECTION - COMPACT */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-3 sm:p-4 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-amber-400 shrink-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-base font-extrabold text-white truncate">Uji Materi & Quiz Interaktif</h2>
                <button 
                  onClick={fetchUjiMateriFromSupabase}
                  title="Sinkronisasi Data Supabase Uji"
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDb ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300 flex items-center gap-1.5 sm:gap-2 mt-0.5 truncate">
                <span className="hidden sm:inline text-slate-400">Evaluasi mandiri 5 tipe soal</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shrink-0 self-start sm:self-auto">
            <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
            <div className="text-[11px] sm:text-xs font-bold text-white">
              <span>{avgScore >= 80 ? 'Sangat Menguasai' : avgScore >= 65 ? 'Cukup Baik' : 'Perlu Latihan'}</span>
              <span className="text-amber-300 font-extrabold ml-1">({avgScore} PTS)</span>
            </div>
          </div>
        </div>

        {/* COMPACT METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/80 text-[11px] sm:text-xs">
          <div className="bg-slate-800/40 border border-slate-700/40 px-2 sm:px-2.5 py-1.2 sm:py-1.5 rounded-xl flex items-center justify-between min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">Selesai:</span>
            <span className="font-extrabold text-white text-[11px] sm:text-xs shrink-0 ml-1">{totalAttempts} Paket</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 px-2 sm:px-2.5 py-1.2 sm:py-1.5 rounded-xl flex items-center justify-between min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">Rata-rata:</span>
            <span className="font-extrabold text-emerald-400 text-[11px] sm:text-xs shrink-0 ml-1">{avgScore} <span className="text-[9px] text-slate-400 font-normal">/100</span></span>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 px-2 sm:px-2.5 py-1.2 sm:py-1.5 rounded-xl flex items-center justify-between min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">Lulus (≥70):</span>
            <span className="font-extrabold text-sky-400 text-[11px] sm:text-xs shrink-0 ml-1">{passedCount} Paket</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 px-2 sm:px-2.5 py-1.2 sm:py-1.5 rounded-xl flex items-center justify-between min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate">Total Paket:</span>
            <span className="font-extrabold text-indigo-300 text-[11px] sm:text-xs shrink-0 ml-1">{allPackages.length} Paket</span>
          </div>
        </div>
      </div>

      {/* ACTIVE QUIZ MODAL OR INTERACTIVE BOARD */}
      {activeQuizPackage && !isQuizCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Quiz Modal Header */}
            <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shrink-0">
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] sm:text-xs font-bold text-indigo-400 flex items-center gap-1.5 truncate">
                    <span className="truncate">{activeQuizPackage.subject}</span>
                    <span>•</span>
                    <span className="truncate">{activeQuizPackage.subBab}</span>
                  </div>
                  <h3 className="text-xs sm:text-base font-black text-white truncate max-w-[220px] sm:max-w-md">
                    {activeQuizPackage.title}
                  </h3>
                </div>
              </div>

              {/* Timer Pill */}
              <div className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-mono text-[11px] sm:text-xs font-black flex items-center gap-1.5 border shadow-xs shrink-0 ${
                timeRemainingSeconds < 120 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' 
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}>
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{formatSeconds(timeRemainingSeconds)}</span>
              </div>
            </div>

            {/* Question Progress Tracker */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 sm:p-3 px-3 sm:px-4 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
              <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200 shrink-0">
                Soal {currentQuestionIdx + 1} <span className="text-slate-400 font-normal">dari {activeQuizPackage.questions.length}</span>
              </div>

              {/* Question Number Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {activeQuizPackage.questions.map((_, idx) => {
                  const isAnswered = userAnswers[idx] !== null && userAnswers[idx] !== undefined;
                  const isCurrent = currentQuestionIdx === idx;
                  const isFlagged = flaggedQuestions[idx];

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center shrink-0 relative ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Body */}
            {(() => {
              const currentQ = activeQuizPackage.questions[currentQuestionIdx];
              const tipe = normalizeTipeSoal(currentQ.tipe_soal);

              return (
                <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
                  {/* Question Box Header */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        Pertanyaan #{currentQuestionIdx + 1}
                      </div>

                      <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        tipe === 'pilihan_kompleks'
                          ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300'
                          : tipe === 'pilihan_benar_salah'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : tipe === 'pilihan_setuju_tidak'
                          ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                          : tipe === 'esai'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {tipe === 'pilihan_kompleks' && <CheckSquare className="h-3 w-3" />}
                        {tipe === 'pilihan_benar_salah' && <ListChecks className="h-3 w-3" />}
                        {tipe === 'pilihan_setuju_tidak' && <ThumbsUp className="h-3 w-3" />}
                        {tipe === 'esai' && <AlignLeft className="h-3 w-3" />}
                        {tipe === 'pilihan_ganda' && <CheckCircle2 className="h-3 w-3" />}

                        <span>
                          {tipe === 'pilihan_kompleks' ? 'Pilihan Kompleks (Pilih >1)' :
                           tipe === 'pilihan_benar_salah' ? 'Pilihan Benar / Salah' :
                           tipe === 'pilihan_setuju_tidak' ? 'Pilihan Setuju / Tidak' :
                           tipe === 'esai' ? 'Soal Esai / Uraian' :
                           'Pilihan Ganda'}
                        </span>
                      </span>
                    </div>

                    <div className="text-xs sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                      <RichTextDisplay content={currentQ.question} />
                    </div>

                    {/* Optional Image */}
                    {currentQ.image_url && (
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <img 
                          src={currentQ.image_url!} 
                          alt="Gambar Soal" 
                          className="max-h-52 sm:max-h-60 rounded-lg object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dynamic Options Input based on Question Type via switch statement */}
                  <div className="space-y-3">
                    {(() => {
                      switch (tipe) {
                        case 'pilihan_ganda':
                          return (
                            <div className="space-y-2.5">
                              {currentQ.options.map((optText, optIdx) => {
                                const isSelected = userAnswers[currentQuestionIdx] === optIdx;
                                const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D, E

                                return (
                                  <button
                                    type="button"
                                    key={optIdx}
                                    onClick={() => {
                                      setUserAnswers(prev => {
                                        const next = [...prev];
                                        next[currentQuestionIdx] = optIdx;
                                        return next;
                                      });
                                    }}
                                    className={`w-full p-3 sm:p-4 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-start gap-2.5 sm:gap-3 ${
                                      isSelected
                                        ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 border transition-colors mt-0.5 ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-slate-100 dark:bg-slate-700 border-slate-300 text-slate-600 dark:text-slate-300'
                                    }`}>
                                      {optionLabel}
                                    </div>
                                    <div className="text-xs sm:text-sm leading-relaxed flex-1 min-w-0 pt-0.5 text-left">
                                      <RichTextDisplay content={optText} />
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );

                        case 'pilihan_kompleks': {
                          const currentSelectedArr: string[] = Array.isArray(userAnswers[currentQuestionIdx]) ? userAnswers[currentQuestionIdx] : [];
                          
                          let maxAllowed = 0;
                          if (Array.isArray(currentQ.jawaban_benar_kompleks) && currentQ.jawaban_benar_kompleks.length > 0) {
                            maxAllowed = currentQ.jawaban_benar_kompleks.length;
                          } else if (currentQ.correctAnswerText) {
                            const parts = currentQ.correctAnswerText.split(',').map(s => s.trim()).filter(Boolean);
                            if (parts.length > 0) {
                              maxAllowed = parts.length;
                            }
                          }

                          return (
                            <div className="space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 p-3 rounded-xl border border-sky-200 dark:border-sky-800">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">ℹ️</span>
                                  <span>
                                    {maxAllowed > 0 
                                      ? <>Pilih maksimal <strong className="text-sky-950 dark:text-sky-100 font-black underline decoration-sky-400">{maxAllowed}</strong> opsi jawaban yang menurut Anda benar.</>
                                      : 'Pilih opsi jawaban yang menurut Anda benar dengan mencentang kotak.'}
                                  </span>
                                </div>
                                {maxAllowed > 0 && (
                                  <span className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] shrink-0 self-start sm:self-auto ${
                                    currentSelectedArr.length === maxAllowed
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-sky-200/80 dark:bg-sky-900/80 text-sky-900 dark:text-sky-200'
                                  }`}>
                                    {currentSelectedArr.length} / {maxAllowed} Terpilih
                                  </span>
                                )}
                              </div>

                              {maxWarning && (
                                <div className="text-[11px] sm:text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 flex items-center justify-between gap-2">
                                  <span>⚠️ {maxWarning}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setMaxWarning(null)} 
                                    className="text-amber-700 dark:text-amber-400 hover:underline text-[10px] font-bold cursor-pointer"
                                  >
                                    Tutup
                                  </button>
                                </div>
                              )}

                              {currentQ.options.map((optText, optIdx) => {
                                const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D, E
                                const isChecked = currentSelectedArr.includes(optionLabel);

                                const toggleCheck = () => {
                                  setUserAnswers(prev => {
                                    const currArr: string[] = Array.isArray(prev[currentQuestionIdx]) ? prev[currentQuestionIdx] : [];
                                    if (currArr.includes(optionLabel)) {
                                      setMaxWarning(null);
                                      const updated = currArr.filter(item => item !== optionLabel);
                                      const next = [...prev];
                                      next[currentQuestionIdx] = updated;
                                      return next;
                                    } else {
                                      if (maxAllowed > 0 && currArr.length >= maxAllowed) {
                                        setMaxWarning(`Batas pilihan (${maxAllowed} jawaban) sudah tercapai. Hapus salah satu pilihan jika ingin mengganti.`);
                                        return prev;
                                      }
                                      setMaxWarning(null);
                                      const updated = [...currArr, optionLabel];
                                      const next = [...prev];
                                      next[currentQuestionIdx] = updated;
                                      return next;
                                    }
                                  });
                                };

                                return (
                                  <button
                                    type="button"
                                    key={optIdx}
                                    onClick={toggleCheck}
                                    className={`w-full p-3 sm:p-4 rounded-2xl border text-left transition duration-150 cursor-pointer flex items-start gap-2.5 sm:gap-3 ${
                                      isChecked
                                        ? 'bg-sky-50/90 dark:bg-sky-950/60 border-sky-500 text-sky-950 dark:text-sky-200 font-bold shadow-xs'
                                        : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-sky-300 text-slate-700 dark:text-slate-200'
                                    }`}
                                  >
                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border mt-0.5 ${
                                      isChecked
                                        ? 'bg-sky-600 text-white border-sky-600'
                                        : 'bg-white dark:bg-slate-700 border-slate-300 text-slate-600 dark:text-slate-300'
                                    }`}>
                                      {isChecked ? <Check className="h-4 w-4 stroke-[3]" /> : optionLabel}
                                    </div>
                                    <div className="text-xs sm:text-sm leading-relaxed flex-1 min-w-0 pt-0.5 text-left">
                                      <RichTextDisplay content={optText} />
                                    </div>
                                    {isChecked && <CheckSquare className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-1" />}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        }

                        case 'pilihan_benar_salah':
                        case 'pilihan_setuju_tidak': {
                          const customOpts = currentQ.customOptionLabels;
                          let opt1 = 'BENAR (B)';
                          let opt2 = 'SALAH (S)';

                          if (customOpts && customOpts.length >= 2) {
                            opt1 = customOpts[0];
                            opt2 = customOpts[1];
                          } else if (currentQ.tipe_soal?.toLowerCase().includes('setuju') || currentQ.question.toLowerCase().includes('setuju')) {
                            opt1 = 'SETUJU';
                            opt2 = 'TIDAK SETUJU';
                          } else if (currentQ.question.toLowerCase().includes('sesuai')) {
                            opt1 = 'SESUAI';
                            opt2 = 'TIDAK SESUAI';
                          }

                          let opt1Header = opt1;
                          let opt2Header = opt2;
                          if (/^benar/i.test(opt1)) opt1Header = 'Benar';
                          if (/^salah/i.test(opt2)) opt2Header = 'Salah';
                          if (/^setuju/i.test(opt1)) opt1Header = 'Setuju';
                          if (/^tidak setuju/i.test(opt2)) opt2Header = 'Tidak Setuju';
                          if (/^sesuai/i.test(opt1)) opt1Header = 'Sesuai';
                          if (/^tidak sesuai/i.test(opt2)) opt2Header = 'Tidak Sesuai';

                          const currentAnsObj = (userAnswers[currentQuestionIdx] && typeof userAnswers[currentQuestionIdx] === 'object') ? userAnswers[currentQuestionIdx] : {};

                          const setStatementAnswer = (letter: string, val: string) => {
                            const updatedObj = { ...currentAnsObj };
                            if (updatedObj[letter] === val) {
                              delete updatedObj[letter];
                            } else {
                              updatedObj[letter] = val;
                            }
                            setUserAnswers(prev => {
                              const next = [...prev];
                              next[currentQuestionIdx] = updatedObj;
                              return next;
                            });
                          };

                          const resetAllStatements = () => {
                            setUserAnswers(prev => {
                              const next = [...prev];
                              next[currentQuestionIdx] = {};
                              return next;
                            });
                          };

                          return (
                            <div className="space-y-3">
                              <div className="text-[11px] sm:text-xs font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 p-2.5 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">ℹ️</span>
                                  <span>
                                    Tentukan status <strong>{opt1Header}</strong> atau <strong>{opt2Header}</strong> untuk setiap pernyataan di bawah ini. (Klik sekali lagi untuk membatalkan pilihan).
                                  </span>
                                </div>
                                {Object.keys(currentAnsObj).length > 0 && (
                                  <button
                                    type="button"
                                    onClick={resetAllStatements}
                                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-lg font-bold text-[10px] sm:text-[11px] transition cursor-pointer shrink-0"
                                  >
                                    Reset Pilihan
                                  </button>
                                )}
                              </div>

                              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-xs">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                                        <th className="py-3.5 px-4 sm:px-6 w-auto">Pernyataan</th>
                                        <th className="py-3.5 px-3 sm:px-4 text-center w-28 sm:w-36 whitespace-nowrap">{opt1Header}</th>
                                        <th className="py-3.5 px-3 sm:px-4 text-center w-28 sm:w-36 whitespace-nowrap">{opt2Header}</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700/80 text-xs sm:text-sm">
                                      {['A', 'B', 'C', 'D', 'E'].map((letter, optIdx) => {
                                        const optionText = currentQ.rawPilihan?.[letter] || (currentQ.options[optIdx] !== undefined ? currentQ.options[optIdx] : null);
                                        if (!optionText) return null;

                                        const selectedVal = currentAnsObj[letter];
                                        const isOpt1Selected = isMatchAnswer(selectedVal, opt1);
                                        const isOpt2Selected = isMatchAnswer(selectedVal, opt2);

                                        return (
                                          <tr 
                                            key={letter} 
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                                          >
                                            <td className="py-3.5 px-4 sm:px-6 align-middle">
                                              <div className="flex items-start gap-2.5 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                                <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                                  {optIdx + 1}.
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                  <RichTextDisplay content={optionText} />
                                                </div>
                                              </div>
                                            </td>

                                            <td 
                                              onClick={() => setStatementAnswer(letter, opt1)}
                                              className="py-3.5 px-3 text-center align-middle cursor-pointer group select-none"
                                            >
                                              <div className="flex justify-center items-center">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStatementAnswer(letter, opt1);
                                                  }}
                                                  className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                                    isOpt1Selected 
                                                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-xs ring-2 ring-indigo-500/20' 
                                                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                                  }`}
                                                >
                                                  <div className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full transition-all ${
                                                    isOpt1Selected 
                                                      ? 'bg-indigo-600 dark:bg-indigo-500 scale-100' 
                                                      : 'bg-transparent scale-0'
                                                  }`} />
                                                </button>
                                              </div>
                                            </td>

                                            <td 
                                              onClick={() => setStatementAnswer(letter, opt2)}
                                              className="py-3.5 px-3 text-center align-middle cursor-pointer group select-none"
                                            >
                                              <div className="flex justify-center items-center">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setStatementAnswer(letter, opt2);
                                                  }}
                                                  className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                                    isOpt2Selected 
                                                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-xs ring-2 ring-indigo-500/20' 
                                                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400 dark:group-hover:border-indigo-500'
                                                  }`}
                                                >
                                                  <div className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full transition-all ${
                                                    isOpt2Selected 
                                                      ? 'bg-indigo-600 dark:bg-indigo-500 scale-100' 
                                                      : 'bg-transparent scale-0'
                                                  }`} />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        case 'esai':
                          return (
                            <div className="space-y-3">
                              <div className="text-[11px] sm:text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                                ✏️ Ketikkan jawaban esai atau uraian Anda secara rinci pada kolom teks di bawah ini.
                              </div>

                              <textarea
                                rows={5}
                                placeholder="Ketikkan jawaban Anda di sini..."
                                value={typeof userAnswers[currentQuestionIdx] === 'string' ? userAnswers[currentQuestionIdx] : ''}
                                onChange={(e) => {
                                  const next = [...userAnswers];
                                  next[currentQuestionIdx] = e.target.value;
                                  setUserAnswers(next);
                                }}
                                className="w-full p-3.5 sm:p-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                              />
                            </div>
                          );

                        default:
                          return null;
                      }
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Quiz Footer Actions */}
            <div className="bg-slate-50 dark:bg-slate-800/90 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 sm:gap-3 shrink-0">
              {/* Button Sebelum */}
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIdx === 0}
                className={`flex-1 sm:flex-initial px-3.5 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 border ${
                  currentQuestionIdx === 0
                    ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-200/50 dark:border-slate-800 cursor-not-allowed'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Sebelum</span>
              </button>

              {/* Button Ragu-ragu */}
              <button
                type="button"
                onClick={toggleFlag}
                className={`flex-1 sm:flex-initial px-3.5 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5 border ${
                  flaggedQuestions[currentQuestionIdx]
                    ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border-amber-400 dark:border-amber-600 shadow-xs ring-2 ring-amber-400/50'
                    : 'bg-amber-50/90 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 shadow-2xs'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${flaggedQuestions[currentQuestionIdx] ? 'fill-amber-700 text-amber-800 dark:fill-amber-300' : 'text-amber-700 dark:text-amber-400'}`} />
                <span>Ragu-ragu</span>
              </button>

              {/* Button Lanjut / Selesaikan */}
              {currentQuestionIdx < activeQuizPackage.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="flex-1 sm:flex-initial px-3.5 sm:px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold cursor-pointer transition shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5"
                >
                  <span>Lanjut</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishQuiz}
                  className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black cursor-pointer transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  <span>Selesaikan</span>
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* COMPLETED QUIZ RESULT / REVIEW MODAL */}
      {(completedAttempt || reviewingAttempt) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          {(() => {
            const attempt = completedAttempt || reviewingAttempt!;
            const pkg = allPackages.find(p => p.id === attempt.packageId) || activeQuizPackage;
            const isPassed = attempt.score >= 70;

            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
                
                {/* Result Header */}
                <div className={`p-4 sm:p-6 text-center text-white relative overflow-hidden shrink-0 ${
                  isPassed ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-amber-600 to-orange-700'
                }`}>
                  <div className="relative z-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isPassed ? 'Evaluasi Berhasil / Lulus' : 'Evaluasi Membutuhkan Remedial'}</span>
                    </div>

                    <div className="text-3xl sm:text-5xl font-black tracking-tight mt-1 sm:mt-2">
                      {attempt.score} <span className="text-base sm:text-lg font-bold opacity-80">/ 100</span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold opacity-90 truncate max-w-md mx-auto">
                      {attempt.title} ({attempt.subBab})
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-extrabold pt-1 sm:pt-2">
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">
                        Terjawab: {attempt.answeredCount ?? attempt.totalQuestions} / {attempt.totalQuestions} Soal
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">
                        Benar: {attempt.correctCount} / {attempt.totalQuestions} Soal
                      </span>
                      <span className="bg-white/10 px-2.5 py-1 rounded-xl">
                        Waktu: {Math.floor(attempt.durationSeconds / 60)}m {attempt.durationSeconds % 60}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanations List */}
                <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
                  <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Detail Skor Evaluasi per Soal
                  </h4>

                  {pkg?.questions.map((q, idx) => {
                    const userAns = attempt.userAnswers[idx];
                    const tipe = normalizeTipeSoal(q.tipe_soal);

                    return (
                      <div 
                        key={idx} 
                        className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">
                            <span>Soal #{idx + 1} ({tipe.toUpperCase()})</span>
                          </div>
                          {(() => {
                            const { earned, max } = calculateQuestionScore(q, userAns);
                            return (
                              <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                                earned === max ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                earned > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              }`}>
                                Skor: {earned} / {max}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
                  {pkg && (() => {
                    const isReviewOnly = !completedAttempt && reviewingAttempt;
                    const currentAttemptNumber = attempt.percobaan || 1;

                    const handleKirimNilaiAction = async () => {
                      if (!pkg || !attempt) return;
                      try {
                        const payload = await buildNilaiEvaluasiRecord({
                          packageData: pkg,
                          score: attempt.score,
                          id: `uji-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        });

                        const { error: insertErr } = await d1
                          .from('nilai_evaluasi')
                          .insert([payload]);

                        if (insertErr) {
                          alert('Gagal mengirim nilai ke database LPS: ' + insertErr.message);
                        } else {
                          alert('Nilai berhasil disimpan di database LPS!');
                          fetchSentEvaluations();
                          fetchAttemptsFromD1();
                          setCompletedAttempt(null);
                          setReviewingAttempt(null);
                          setActiveQuizPackage(null);
                        }
                      } catch (err: any) {
                        alert('Terjadi kesalahan saat mengirim nilai: ' + (err?.message || err));
                      }
                    };

                    if (isReviewOnly || currentAttemptNumber >= 1) {
                      return (
                        <div className="w-full flex justify-end">
                          <button
                            onClick={() => {
                              setCompletedAttempt(null);
                              setReviewingAttempt(null);
                              setActiveQuizPackage(null);
                            }}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer text-center"
                          >
                            Tutup & Kembali
                          </button>
                        </div>
                      );
                    }

                    if (currentAttemptNumber >= 2) {
                      return (
                        <div className="w-full flex justify-end">
                          <button
                            onClick={handleKirimNilaiAction}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Kirim Nilai & Kembali</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              setCompletedAttempt(null);
                              setReviewingAttempt(null);
                              startQuiz(pkg);
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Mulai Uji Materi</span>
                          </button>
                          <button
                            onClick={handleKirimNilaiAction}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Kirim Nilai</span>
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setCompletedAttempt(null);
                            setReviewingAttempt(null);
                            setActiveQuizPackage(null);
                          }}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer text-center"
                        >
                          Tutup & Kembali
                        </button>
                      </>
                    );
                  })()}
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB NAVIGATION BAR - COMPACT & CLEAN */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTabSub('paket')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTabSub === 'paket'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5 shrink-0" />
          <span>Paket Uji ({filteredPackages.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSub('riwayat')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTabSub === 'riwayat'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Riwayat ({attemptsHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSub('analisis')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeTabSub === 'analisis'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5 shrink-0" />
          <span>Pemetaan Sub-Bab</span>
        </button>
      </div>

      {/* MAIN CONTENT BASED ON SUB-TAB */}
      {activeTabSub === 'paket' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Filter Subject Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 mr-0.5">
              <Filter className="h-3.5 w-3.5 text-sky-600" />
              Mapel:
            </span>
            {availableSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                  selectedSubject === sub
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Quiz Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredPackages.map((pkg) => {
              const packageAttemptsCount = getPackageAttempts(pkg).length;
              const isAlreadySent = isPackageCompleted(pkg);

              return (
                <div 
                  key={pkg.id} 
                  className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs p-4 sm:p-5 hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3 sm:space-y-4 relative overflow-hidden"
                >


                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1 sm:pt-0">
                      <span className="bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] sm:text-xs font-black uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-sky-100 dark:border-sky-800 truncate max-w-[150px] sm:max-w-none">
                        {pkg.subject}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md border ${
                        pkg.difficulty === 'Mudah'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : pkg.difficulty === 'Sedang'
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                      }`}>
                        {pkg.jenjang}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                        {pkg.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 font-medium break-words">
                        Sub-bab: {pkg.subBab}
                      </p>
                      {pkg.namaPengajar && (
                        <p className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                          Pengajar: {pkg.namaPengajar}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-0.5">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        <span>{pkg.questions.length} Soal</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span>{pkg.timeLimitMinutes} Menit</span>
                      </div>
                    </div>


                  </div>

                  {isAlreadySent ? (
                    <div className="w-full py-2 sm:py-2.5 px-3.5 sm:px-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold text-center border border-emerald-200/50 dark:border-emerald-800/60 mt-2 select-none flex items-center justify-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>Nilai Sudah Terkirim</span>
                    </div>
                  ) : packageAttemptsCount >= 1 || isAlreadySent ? (
                    <div className="w-full py-2 sm:py-2.5 px-3.5 sm:px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold text-center border border-slate-200/50 dark:border-slate-700 mt-2 select-none">
                      Sudah Dikerjakan
                    </div>
                  ) : (
                    <button
                      onClick={() => startQuiz(pkg)}
                      className="w-full py-2 sm:py-2.5 px-3.5 sm:px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-2 group mt-2"
                    >
                      <Play className="h-3.5 w-3.5 fill-current group-hover:scale-110 transition-transform" />
                      <span>Mulai Uji Materi</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RIWAYAT EVALUASI */}
      {activeTabSub === 'riwayat' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 sm:pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Riwayat Pengerjaan Uji Materi</h3>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">Total {attemptsHistory.length} Sesi</span>
          </div>

          {attemptsHistory.length === 0 ? (
            <div className="py-10 sm:py-12 text-center text-slate-500 dark:text-slate-400 italic space-y-2">
              <FileText className="h-9 w-9 sm:h-10 sm:w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs sm:text-sm">Belum ada riwayat pengerjaan uji materi.</p>
              <button
                onClick={() => setActiveTabSub('paket')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline mt-2 inline-block"
              >
                Pilih Paket Uji Materi & Mulai Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {attemptsHistory.map((att) => (
                <div 
                  key={att.id} 
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/70 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                        {att.subject}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-400 font-medium">{formatTanggalIndo(att.date, { withDayName: true, withTime: true })}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 break-words">{att.title}</h4>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Sub-bab: {att.subBab}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700/80">
                    <div className="text-left sm:text-right">
                      <div className={`text-base sm:text-lg font-black ${
                        att.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : att.score >= 60 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {att.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        Selesai {att.correctCount} dari {att.totalQuestions}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PEMETAAN PENGUASAAN SUB-BAB */}
      {activeTabSub === 'analisis' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-3.5 sm:p-5 space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Pemetaan Penguasaan Sub-Bab Akademik</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">Statistik tingkat pemahaman berdasarkan evaluasi hasil tes uji materi per mata pelajaran</p>
          </div>

          <div className="space-y-2.5 sm:space-y-4">
            {allPackages.map((pkg) => {
              const attempts = getPackageAttempts(pkg);
              const pkgAvg = attempts.length > 0 
                ? Math.round(attempts.reduce((a, b) => a + b.score, 0) / attempts.length) 
                : 0;

              return (
                <div key={pkg.id} className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 break-words">{pkg.subject}: {pkg.subBab}</span>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Uji materi diambil: {attempts.length} kali</div>
                    </div>
                    <span className={`text-xs font-black shrink-0 ${
                      attempts.length === 0 ? 'text-slate-400' : pkgAvg >= 80 ? 'text-emerald-600 dark:text-emerald-400' : pkgAvg >= 60 ? 'text-sky-600 dark:text-sky-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {attempts.length === 0 ? 'Belum Diuji' : `${pkgAvg}% (Penguasaan)`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-2.5 overflow-hidden">
                    <div 
                      className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
                        pkgAvg >= 80 ? 'bg-emerald-500' : pkgAvg >= 60 ? 'bg-sky-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${attempts.length === 0 ? 0 : pkgAvg}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
