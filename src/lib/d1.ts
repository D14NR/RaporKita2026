const DEFAULT_D1_API_URL = 'https://raporkita-db.dianrizkisofiawan0431.workers.dev';

const metaEnv = (import.meta as any).env || {};
export const baseApiUrl = (() => {
  const raw = metaEnv.VITE_API_URL || metaEnv.VITE_D1_API_URL || DEFAULT_D1_API_URL;
  if (!raw) return DEFAULT_D1_API_URL;
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
})();

const TABLE_ALIASES: Record<string, string> = {
  jadwal_reguler: 'jadwal_kbm',
  jadwal_khusus: 'jadwal_kbm',
  jadwal_kbm: 'jadwal_kbm',
  data_siswa: 'data_siswa',
  perkembangan_belajar: 'perkembangan_belajar',
  nilai_evaluasi: 'nilai_evaluasi',
  nilai_standar: 'nilai_standar',
  nilai_snbt: 'nilai_snbt',
  nilai_snbt_utbk: 'nilai_snbt',
  permintaan_pelayanan: 'permintaan_pelayanan',
  tambahan_pelayanan: 'tambahan_pelayanan',
  riwayat_pelayanan_siswa: 'riwayat_pelayanan_siswa',
  push_subscriptions_siswa: 'push_subscriptions_siswa',
  riwayat_notifikasi_siswa: 'riwayat_notifikasi_siswa',
  riwayat_pengerjaan: 'riwayat_pengerjaan',
  bank_soal: 'bank_soal',
  mata_pelajaran: 'mata_pelajaran',
  butir_soal: 'butir_soal',
  pengajar: 'pengajar'
};

function normalizeTableName(tableName: string): string {
  const normalized = (tableName || '').trim();
  if (!normalized) return normalized;
  return TABLE_ALIASES[normalized] || normalized;
}

function normalizeRecordShape(tableName: string, record: any): any {
  if (!record || typeof record !== 'object') return record;

  const normalized = { ...record };
  const key = normalizeTableName(tableName);

  if (key === 'data_siswa') {
    if (!normalized.nama && normalized.nama_lengkap) {
      normalized.nama = normalized.nama_lengkap;
    }
    if (!normalized.nama_lengkap && normalized.nama) {
      normalized.nama_lengkap = normalized.nama;
    }
  }

  if (key === 'pengajar') {
    // Map schema field names to interface field names for backward compatibility
    if (!normalized.nama && normalized.nama_pengajar) {
      normalized.nama = normalized.nama_pengajar;
    }
    if (!normalized.nama_pengajar && normalized.nama) {
      normalized.nama_pengajar = normalized.nama;
    }
    if (!normalized.bidang_studi && normalized.bidang_studi_mata_pelajaran) {
      normalized.bidang_studi = normalized.bidang_studi_mata_pelajaran;
    }
    if (!normalized.bidang_studi_mata_pelajaran && normalized.bidang_studi) {
      normalized.bidang_studi_mata_pelajaran = normalized.bidang_studi;
    }
  }

  if (key === 'riwayat_pelayanan_siswa') {
    // Map schema field names to OutsideService compatible fields
    if (!normalized.pengajar && normalized.nama_pengajar) {
      normalized.pengajar = normalized.nama_pengajar;
    }
    if (!normalized.nama && normalized.nama_siswa) {
      normalized.nama = normalized.nama_siswa;
    }
  }

  if (key === 'nilai_evaluasi') {
    if (!normalized.nama && normalized.nama_siswa) {
      normalized.nama = normalized.nama_siswa;
    }
    if (!normalized.sub_bab && normalized.sub_bab_kode_soal) {
      normalized.sub_bab = normalized.sub_bab_kode_soal;
    }
  }

  if (key === 'nilai_standar') {
    if (!normalized.nama && normalized.nama_siswa) {
      normalized.nama = normalized.nama_siswa;
    }
  }

  if (key === 'nilai_snbt') {
    if (!normalized.nama && normalized.nama_siswa) {
      normalized.nama = normalized.nama_siswa;
    }
    if (normalized.scor != null && normalized.nilai == null) {
      normalized.nilai = normalized.scor;
    }
    if (normalized.scor != null && normalized.rerata == null) {
      normalized.rerata = normalized.scor;
    }
    if (normalized.scor != null && normalized.total == null) {
      normalized.total = normalized.scor;
    }
  }

  return normalized;
}

function toJson(data: any, tableName?: string): any {
  let result: any[] = [];

  if (Array.isArray(data)) {
    result = data;
  } else if (data && Array.isArray(data.data)) {
    result = data.data;
  } else if (data && Array.isArray(data.result)) {
    result = data.result;
  } else if (data && Array.isArray(data.records)) {
    result = data.records;
  } else if (data && Array.isArray(data.items)) {
    result = data.items;
  } else if (data && typeof data === 'object') {
    result = data.data ?? data.result ?? data.records ?? data.items ?? [];
  }

  if (!Array.isArray(result)) {
    return [];
  }

  return tableName ? result.map((item) => normalizeRecordShape(tableName, item)) : result;
}

function matchesFilter(row: any, filter: { column: string; op: 'eq' | 'in' | 'ilike'; value: any }) {
  const raw = row?.[filter.column];

  if (filter.op === 'eq') {
    return String(raw ?? '') === String(filter.value ?? '');
  }

  if (filter.op === 'in') {
    const values = Array.isArray(filter.value) ? filter.value : [filter.value];
    return values.some((value) => String(raw ?? '') === String(value));
  }

  if (filter.op === 'ilike') {
    const left = String(raw ?? '').trim().toLowerCase();
    const right = String(filter.value ?? '').trim().toLowerCase().replace(/%/g, '');
    return !right || left.includes(right);
  }

  return true;
}

export function findMatchingRowForUpdate(
  rows: any[],
  filters: Array<{ column: string; op: 'eq' | 'in' | 'ilike'; value: any }>,
  explicitId?: string | null
) {
  if (explicitId) {
    const byId = rows.find((row) => String(row?.id ?? '') === String(explicitId));
    if (byId) return byId;
  }

  return rows.find((row) => filters.every((filter) => matchesFilter(row, filter))) ?? null;
}

async function readJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { raw: text } as T;
  }
}

class D1Query {
  private selectColumns = '*';
  private filters: Array<{ column: string; op: 'eq' | 'in' | 'ilike'; value: any }> = [];
  private orders: Array<{ column: string; ascending: boolean }> = [];
  private limitValue?: number;
  private singleResult = false;
  private op: 'read' | 'insert' | 'update' | 'delete' | 'upsert' = 'read';
  private insertRows: any[] = [];
  private updatePayload: Record<string, any> = {};
  private upsertRows: any[] = [];
  private upsertOptions?: { onConflict?: string };

  constructor(private readonly apiUrl: string, private readonly table: string) {}

  select(columns = '*') {
    this.selectColumns = columns || '*';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: 'eq', value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: 'in', value: Array.isArray(values) ? values : [values] });
    return this;
  }

  ilike(column: string, value: string) {
    this.filters.push({ column, op: 'ilike', value: value ?? '' });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  maybeSingle() {
    this.singleResult = true;
    return this;
  }

  insert(rows: any[]) {
    this.op = 'insert';
    this.insertRows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(payload: Record<string, any>) {
    this.op = 'update';
    this.updatePayload = payload || {};
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  upsert(rows: any[], options?: { onConflict?: string }) {
    this.op = 'upsert';
    this.upsertRows = Array.isArray(rows) ? rows : [rows];
    this.upsertOptions = options || {};
    return this;
  }

  private async executeRead() {
    const tableName = normalizeTableName(this.table);

    const matchesLike = (value: any, pattern: any) => {
      const text = String(value ?? '').trim().toLowerCase();
      const rawPattern = String(pattern ?? '').trim().toLowerCase();
      const cleanPattern = rawPattern.split('%').filter(Boolean).join('');

      if (!cleanPattern) return true;
      return text.includes(cleanPattern);
    };

    const applyClientSideFilters = (rows: any[]) => {
      let nextRows = [...rows];

      for (const filter of this.filters) {
        nextRows = nextRows.filter((row) => {
          const raw = row?.[filter.column];

          if (filter.op === 'eq') {
            return String(raw ?? '') === String(filter.value ?? '');
          }

          if (filter.op === 'in') {
            const values = Array.isArray(filter.value) ? filter.value : [filter.value];
            return values.some((value) => String(raw ?? '') === String(value));
          }

          if (filter.op === 'ilike') {
            return matchesLike(raw, filter.value);
          }

          return true;
        });
      }

      for (const order of this.orders) {
        nextRows = [...nextRows].sort((a, b) => {
          const av = a?.[order.column];
          const bv = b?.[order.column];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          const result = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
          return order.ascending ? result : -result;
        });
      }

      if (this.limitValue && Number.isFinite(this.limitValue)) {
        nextRows = nextRows.slice(0, this.limitValue);
      }

      return nextRows;
    };

    try {
      const params = new URLSearchParams();
      for (const filter of this.filters) {
        if (filter.op === 'eq') {
          params.set(`eq_${filter.column}`, String(filter.value ?? ''));
        } else if (filter.op === 'ilike') {
          params.set(`ilike_${filter.column}`, String(filter.value ?? '').replace(/%/g, ''));
        } else if (filter.op === 'in') {
          const values = Array.isArray(filter.value) ? filter.value : [filter.value];
          params.set(`in_${filter.column}`, values.map((value) => String(value ?? '')).join(','));
        }
      }
      if (this.orders.length > 0) {
        params.set('order', this.orders[0].column);
        params.set('ascending', String(this.orders[0].ascending));
      }
      if (this.limitValue && Number.isFinite(this.limitValue)) {
        params.set('limit', String(this.limitValue));
      }

      const queryString = params.toString();
      const url = `${this.apiUrl}/db/${tableName}${queryString ? `?${queryString}` : ''}`;
      const payload = await readJson(url, { method: 'GET', headers: { Accept: 'application/json' } });
      const responsePayload = payload && typeof payload === 'object' && 'success' in payload && payload.success
        ? (Array.isArray((payload as any).data) ? (payload as any).data : [])
        : (Array.isArray(payload) ? payload : toJson(payload, this.table));

      const safeData = Array.isArray(responsePayload) ? applyClientSideFilters(responsePayload) : [];
      return { data: this.singleResult && Array.isArray(safeData) ? safeData[0] ?? null : safeData, error: null };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private async executeWrite() {
    const tableName = normalizeTableName(this.table);

    try {
      if (this.op === 'insert') {
        const isBulk = this.insertRows.length > 1;
        const endpoint = `${this.apiUrl}/db/${tableName}`;
        const body = isBulk ? { rows: this.insertRows } : this.insertRows[0] ?? {};
        const payload = await readJson(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(body)
        });

        if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
          throw new Error((payload as any).message || 'Insert gagal');
        }

        return { data: toJson(payload, this.table), error: null };
      }

      if (this.op === 'update') {
        const updateRecord = this.updatePayload || {};
        const targetId = typeof updateRecord.id === 'string' ? updateRecord.id : null;
        const lookupParams = new URLSearchParams();
        if (targetId) {
          lookupParams.set('eq_id', targetId);
        } else {
          for (const filter of this.filters) {
            if (filter.op === 'eq') {
              lookupParams.set(`eq_${filter.column}`, String(filter.value ?? ''));
            } else if (filter.op === 'ilike') {
              lookupParams.set(`ilike_${filter.column}`, String(filter.value ?? '').replace(/%/g, ''));
            } else if (filter.op === 'in') {
              const values = Array.isArray(filter.value) ? filter.value : [filter.value];
              lookupParams.set(`in_${filter.column}`, values.map((value) => String(value ?? '')).join(','));
            }
          }
        }
        lookupParams.set('limit', '1');
        const sourceRows = await readJson(`${this.apiUrl}/db/${tableName}?${lookupParams.toString()}`, { method: 'GET', headers: { Accept: 'application/json' } });
        const rows = Array.isArray(sourceRows) ? sourceRows : sourceRows && Array.isArray(sourceRows.data) ? sourceRows.data : [];
        const candidate = findMatchingRowForUpdate(rows, this.filters, targetId);

        if (!candidate || !candidate.id) {
          const fallbackMatches = Object.entries(updateRecord)
            .filter(([key, value]) => key !== 'id' && value !== undefined && value !== null && value !== '')
            .map(([key, value]) => ({ column: key, op: 'eq' as const, value }));

          const fallbackCandidate = fallbackMatches.length > 0 ? findMatchingRowForUpdate(rows, fallbackMatches, null) : null;
          if (!fallbackCandidate || !fallbackCandidate.id) {
            return { data: [], error: new Error('Data target untuk update tidak ditemukan.') };
          }

          const fallbackPayload = await readJson(`${this.apiUrl}/db/${tableName}/${fallbackCandidate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ ...updateRecord, id: fallbackCandidate.id })
          });

          if (fallbackPayload && typeof fallbackPayload === 'object' && 'success' in fallbackPayload && fallbackPayload.success === false) {
            throw new Error((fallbackPayload as any).message || (fallbackPayload as any).error || 'Update gagal');
          }

          return { data: toJson(fallbackPayload, this.table), error: null };
        }

        const payload = await readJson(`${this.apiUrl}/db/${tableName}/${candidate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ ...updateRecord, id: candidate.id })
        });

        if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
          throw new Error((payload as any).message || (payload as any).error || 'Update gagal');
        }

        return { data: toJson(payload, this.table), error: null };
      }

      if (this.op === 'upsert') {
        // Upsert: try insert first, if conflict then update
        const isBulk = this.upsertRows.length > 1;
        const endpoint = `${this.apiUrl}/db/${tableName}`;
        
        for (const row of this.upsertRows) {
          try {
            // Try insert
            const payload = await readJson(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify(row)
            });

            if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
              // Jika insert fail (mungkin conflict), coba update
              const conflictColumn = this.upsertOptions?.onConflict || 'id';
              const conflictValue = row[conflictColumn];
              
              if (conflictValue) {
                // Try update dengan filter pada conflict column
                const updatePayload = await readJson(`${this.apiUrl}/db/${tableName}`, {
                  method: 'GET',
                  headers: { Accept: 'application/json' }
                });
                
                const rows = Array.isArray(updatePayload) ? updatePayload : (updatePayload?.data || []);
                const target = rows.find((r: any) => String(r[conflictColumn]) === String(conflictValue));
                
                if (target?.id) {
                  await readJson(`${this.apiUrl}/db/${tableName}/${target.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(row)
                  });
                }
              }
            }
          } catch (err) {
            console.warn('[D1 Upsert] Error during upsert:', err);
          }
        }

        return { data: this.upsertRows, error: null };
      }

      if (this.op === 'delete') {
        const targetId = this.filters.find((filter) => filter.column === 'id' && filter.op === 'eq')?.value;
        if (!targetId) {
          return { data: [], error: new Error('ID target untuk delete tidak ditemukan.') };
        }

        const payload = await readJson(`${this.apiUrl}/db/${tableName}/${targetId}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' }
        });

        if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
          throw new Error((payload as any).message || 'Delete gagal');
        }

        return { data: toJson(payload, this.table), error: null };
      }

      return { data: [], error: new Error('Operasi write tidak didukung untuk worker D1 ini.') };
    } catch (error) {
      return {
        data: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async execute() {
    if (this.op === 'read') {
      return this.executeRead();
    }
    return this.executeWrite();
  }

  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null) {
    return this.execute().catch(onrejected);
  }
}

const createD1Client = (apiUrl: string) => ({
  from(tableName: string) {
    return new D1Query(apiUrl, tableName);
  },
  channel() {
    return {
      on() { return this; },
      subscribe() { return this; }
    };
  },
  removeChannel() {
    return undefined;
  }
});

export const d1 = createD1Client(baseApiUrl);
export const d1Kbm = createD1Client(baseApiUrl);
export const d1Uji = createD1Client(baseApiUrl);

export const DB_SETUP_SQL = `-- Skema Cloudflare D1 untuk aplikasi RaporKita

CREATE TABLE IF NOT EXISTS data_siswa (
    id TEXT PRIMARY KEY NOT NULL,
    nis TEXT NOT NULL UNIQUE,
    nama_lengkap TEXT NOT NULL,
    tanggal_lahir TEXT,
    asal_sekolah TEXT,
    jenjang_studi TEXT,
    no_whatsapp_siswa TEXT,
    no_whatsapp_orang_tua TEXT,
    email TEXT,
    kelompok_kelas TEXT,
    mata_pelajaran TEXT,
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS riwayat_notifikasi_siswa (
    id TEXT PRIMARY KEY NOT NULL,
    siswa_id TEXT,
    nis TEXT NOT NULL,
    nama_siswa TEXT NOT NULL,
    tipe_notifikasi TEXT NOT NULL CHECK (
        tipe_notifikasi IN (
            'Jadwal',
            'Permintaan Pelayanan',
            'Perkembangan',
            'Nilai',
            'Informasi Sistem'
        )
    ),
    pesan TEXT NOT NULL,
    status_baca INTEGER NOT NULL DEFAULT 0 CHECK (status_baca IN (0, 1)),
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    jumlah_pengiriman INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_pengiriman >= 0),
    pengiriman_terakhir_at TEXT,
    FOREIGN KEY (siswa_id) REFERENCES data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jadwal_kbm (
    id TEXT PRIMARY KEY NOT NULL,
    cabang TEXT NOT NULL,
    kelas TEXT NOT NULL,
    sekolah TEXT NOT NULL DEFAULT '',
    jenjang_studi TEXT,
    tanggal TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    kode_pengajar TEXT NOT NULL,
    nama_pengajar TEXT NOT NULL,
    waktu TEXT NOT NULL,
    bulan TEXT NOT NULL,
    class_order INTEGER,
    gabung TEXT DEFAULT '',
    jenis_kbm TEXT NOT NULL CHECK (jenis_kbm IN ('Reguler', 'Khusus')),
    is_gabung INTEGER NOT NULL DEFAULT 0 CHECK (is_gabung IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS perkembangan_belajar (
    id TEXT PRIMARY KEY NOT NULL,
    siswa_id TEXT,
    nis TEXT,
    nama_siswa TEXT,
    tanggal TEXT NOT NULL,
    mata_pelajaran TEXT,
    materi_sub_bab TEXT,
    kehadiran TEXT,
    prosen_penguasaan REAL
        CHECK (
            prosen_penguasaan IS NULL
            OR (
                prosen_penguasaan >= 0
                AND prosen_penguasaan <= 100
            )
        ),
    prosen_penjelasan REAL
        CHECK (
            prosen_penjelasan IS NULL
            OR (
                prosen_penjelasan >= 0
                AND prosen_penjelasan <= 100
            )
        ),
    prosen_kondisi REAL
        CHECK (
            prosen_kondisi IS NULL
            OR (
                prosen_kondisi >= 0
                AND prosen_kondisi <= 100
            )
        ),
    catatan_pengajar TEXT,
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (siswa_id) REFERENCES data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pengajar (
    id TEXT PRIMARY KEY NOT NULL,
    kode_pengajar TEXT UNIQUE,
    nama TEXT NOT NULL,
    bidang_studi TEXT,
    email TEXT,
    no_whatsapp TEXT,
    domisili TEXT,
    username TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS permintaan_pelayanan (
    id TEXT PRIMARY KEY NOT NULL,
    nis TEXT NOT NULL,
    nama_siswa TEXT NOT NULL,
    cabang TEXT,
    tanggal_pengajuan TEXT NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    kode_pengajar TEXT,
    nama_pengajar TEXT NOT NULL,
    keperluan TEXT,
    status TEXT DEFAULT 'Menunggu'
        CHECK (
            status IN (
                'Menunggu',
                'Disetujui',
                'Ditolak'
            )
        ),
    tanggal_disetujui TEXT,
    waktu_disetujui TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (kode_pengajar) REFERENCES pengajar (kode_pengajar)
);

CREATE TABLE IF NOT EXISTS tambahan_pelayanan (
    id TEXT PRIMARY KEY NOT NULL,
    nis TEXT NOT NULL,
    nama TEXT,
    tanggal TEXT NOT NULL,
    mata_pelajaran TEXT,
    materi_sub_bab TEXT,
    durasi TEXT,
    pengajar TEXT,
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS riwayat_pelayanan_siswa (
    id TEXT PRIMARY KEY NOT NULL,
    siswa_id TEXT,
    nis TEXT,
    nama_siswa TEXT,
    tanggal TEXT NOT NULL,
    kode_pengajar TEXT,
    nama_pengajar TEXT,
    mata_pelajaran TEXT,
    materi_sub_bab TEXT,
    durasi TEXT,
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (siswa_id) REFERENCES data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (kode_pengajar) REFERENCES pengajar (kode_pengajar)
);

CREATE TABLE IF NOT EXISTS nilai_evaluasi (
    id TEXT PRIMARY KEY NOT NULL,
    siswa_id TEXT,
    nis TEXT,
    nama_siswa TEXT,
    jenjang_studi TEXT,
    tanggal TEXT NOT NULL,
    kode_pengajar TEXT,
    nama_pengajar TEXT,
    mata_pelajaran TEXT,
    sub_bab_kode_soal TEXT,
    nilai REAL CHECK (
        nilai IS NULL OR (nilai >= 0 AND nilai <= 100)
    ),
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (siswa_id) REFERENCES data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nilai_standar (
    id TEXT PRIMARY KEY NOT NULL,
    siswa_id TEXT,
    nis TEXT,
    nama_siswa TEXT,
    tanggal TEXT NOT NULL,
    jenis_tes TEXT,
    mata_pelajaran TEXT,
    nilai REAL CHECK (
        nilai IS NULL OR (nilai >= 0 AND nilai <= 100)
    ),
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (siswa_id) REFERENCES data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nilai_snbt (
    id TEXT PRIMARY KEY NOT NULL,
    siswa_id TEXT,
    nis TEXT,
    nama_siswa TEXT,
    tanggal TEXT NOT NULL,
    jenis_tes TEXT,
    mata_pelajaran TEXT,
    scor REAL CHECK (
        scor IS NULL OR (scor >= 0 AND scor <= 100)
    ),
    cabang TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (siswa_id) REFERENCES data_siswa (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS onesignal_subscriptions (
    id TEXT PRIMARY KEY NOT NULL,
    subscription_id TEXT NOT NULL,
    nis TEXT NOT NULL,
    platform TEXT DEFAULT 'web',
    user_agent TEXT,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
`;
