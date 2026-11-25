export interface Question {
  id: string;
  domain: string;
  topic: string;
  stem: string;
  options: string[];
  /** indeks jawaban benar pada `options` */
  answer: number;
  explanation: string;
}

/** [kunci, nilai, grup?] — entri dengan grup sama tidak pernah menjadi distraktor satu sama lain. */
export type Pair = [string, string, string?];

export interface FactTable {
  id: string;
  domain: string;
  topic: string;
  /** stem arah maju, memakai {k}; opsi = nilai */
  f?: string;
  /** stem arah balik, memakai {v}; opsi = kunci */
  r?: string;
  /** opsi arah balik diurutkan sesuai urutan tabel (mis. tipe I, II, III) */
  ord?: boolean;
  note?: string;
  pairs: Pair[];
}

export interface QHist {
  /** jumlah percobaan */
  n: number;
  /** jumlah benar */
  c: number;
  /** tanggal terakhir dikerjakan (YYYY-MM-DD) */
  last: string;
  /** masih masuk antrean remedial */
  due: boolean;
}

export interface BlockState {
  answers: Record<string, number>;
  flags: string[];
  elapsed: number;
  submittedAt?: string;
}

export interface DayState {
  ids: string[];
  blocks: Record<number, BlockState>;
}

export interface AppState {
  v: 1;
  hist: Record<string, QHist>;
  days: Record<string, DayState>;
  custom: Question[];
}
