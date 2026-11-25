import type { AppState, BlockState, DayState, Question } from './types';
import { blockCount, blockIds, buildDailyIds } from './daily';

const KEY = 'cbt-harian-ortopedi:v1';
const KEEP_DAYS = 14;

export function emptyState(): AppState {
  return { v: 1, hist: {}, days: {}, custom: [] };
}

export function isValidState(x: unknown): x is AppState {
  if (!x || typeof x !== 'object') return false;
  const s = x as AppState;
  return s.v === 1 && typeof s.hist === 'object' && typeof s.days === 'object' && Array.isArray(s.custom);
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidState(parsed)) return parsed;
    }
  } catch {
    /* penyimpanan rusak/tidak tersedia → mulai baru */
  }
  return emptyState();
}

export function saveState(s: AppState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function emptyBlock(): BlockState {
  return { answers: {}, flags: [], elapsed: 0 };
}

/** Memastikan paket untuk `date` ada; membuang hari lama agar penyimpanan tetap kecil. */
export function ensureDay(s: AppState, date: string, bank: Question[]): AppState {
  if (s.days[date]) return s;
  const days: Record<string, DayState> = {};
  Object.keys(s.days)
    .sort()
    .slice(-(KEEP_DAYS - 1))
    .forEach(d => (days[d] = s.days[d]));
  days[date] = { ids: buildDailyIds(date, bank, s.hist), blocks: {} };
  return { ...s, days };
}

export function updateBlock(s: AppState, date: string, block: number, fn: (b: BlockState) => BlockState): AppState {
  const day = s.days[date];
  if (!day) return s;
  const cur = day.blocks[block] ?? emptyBlock();
  if (cur.submittedAt) return s;
  return { ...s, days: { ...s.days, [date]: { ...day, blocks: { ...day.blocks, [block]: fn(cur) } } } };
}

/** Mengunci blok dan mencatat hasil tiap soal ke riwayat (salah/kosong → antrean remedial). */
export function submitBlock(s: AppState, date: string, block: number, bank: Map<string, Question>, now = new Date()): AppState {
  const day = s.days[date];
  if (!day) return s;
  const cur = day.blocks[block] ?? emptyBlock();
  if (cur.submittedAt) return s;
  const hist = { ...s.hist };
  for (const id of blockIds(day.ids, block)) {
    const q = bank.get(id);
    if (!q) continue;
    const ok = cur.answers[id] === q.answer;
    const h = hist[id] ?? { n: 0, c: 0, last: date, due: false };
    hist[id] = { n: h.n + 1, c: h.c + (ok ? 1 : 0), last: date, due: !ok };
  }
  const done: BlockState = { ...cur, submittedAt: now.toISOString() };
  return { ...s, hist, days: { ...s.days, [date]: { ...day, blocks: { ...day.blocks, [block]: done } } } };
}

/** Jawaban pada sesi remedial: benar → keluar dari antrean. */
export function recordRemedial(s: AppState, id: string, ok: boolean, date: string): AppState {
  const h = s.hist[id] ?? { n: 0, c: 0, last: date, due: false };
  return { ...s, hist: { ...s.hist, [id]: { n: h.n + 1, c: h.c + (ok ? 1 : 0), last: date, due: !ok } } };
}

export interface BlockScore {
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  pct: number;
  byDomain: { domain: string; total: number; correct: number }[];
}

export function scoreBlock(day: DayState, block: number, bank: Map<string, Question>): BlockScore {
  const b = day.blocks[block] ?? emptyBlock();
  const dom = new Map<string, { total: number; correct: number }>();
  let total = 0, correct = 0, blank = 0;
  for (const id of blockIds(day.ids, block)) {
    const q = bank.get(id);
    if (!q) continue;
    total++;
    const a = b.answers[id];
    const d = dom.get(q.domain) ?? { total: 0, correct: 0 };
    d.total++;
    if (a === undefined) blank++;
    else if (a === q.answer) {
      correct++;
      d.correct++;
    }
    dom.set(q.domain, d);
  }
  return {
    total,
    correct,
    blank,
    wrong: total - correct - blank,
    pct: total ? Math.round((correct / total) * 100) : 0,
    byDomain: [...dom].map(([domain, v]) => ({ domain, ...v })).sort((a, b) => a.domain.localeCompare(b.domain)),
  };
}

export interface DaySummary {
  blocks: number;
  done: number;
  answered: number;
  correct: number;
  total: number;
}

export function daySummary(day: DayState | undefined, bank: Map<string, Question>): DaySummary {
  const out: DaySummary = { blocks: 0, done: 0, answered: 0, correct: 0, total: 0 };
  if (!day) return out;
  out.total = day.ids.length;
  out.blocks = blockCount(day.ids.length);
  for (let i = 0; i < out.blocks; i++) {
    if (!day.blocks[i]?.submittedAt) continue;
    const sc = scoreBlock(day, i, bank);
    out.done++;
    out.answered += sc.total - sc.blank;
    out.correct += sc.correct;
  }
  return out;
}

const fmtDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Jumlah hari berturut-turut (berakhir hari ini atau kemarin) dengan minimal satu blok selesai. */
export function streak(s: AppState, today: string): number {
  const active = (d: string) => Object.values(s.days[d]?.blocks ?? {}).some(b => b.submittedAt);
  const cur = new Date(today + 'T12:00:00');
  if (!active(today)) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (active(fmtDay(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

export function dueIds(s: AppState, bank: Map<string, Question>): string[] {
  return Object.keys(s.hist).filter(id => s.hist[id].due && bank.has(id));
}

export function domainStats(s: AppState, bank: Map<string, Question>) {
  const m = new Map<string, { n: number; c: number }>();
  for (const [id, h] of Object.entries(s.hist)) {
    const q = bank.get(id);
    if (!q) continue;
    const d = m.get(q.domain) ?? { n: 0, c: 0 };
    d.n += h.n;
    d.c += h.c;
    m.set(q.domain, d);
  }
  return [...m]
    .map(([domain, v]) => ({ domain, ...v, pct: Math.round((v.c / v.n) * 100) }))
    .sort((a, b) => a.pct - b.pct);
}
