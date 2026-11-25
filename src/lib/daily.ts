import type { Question, QHist } from './types';
import { shuffle } from './rng';

export const DAILY_TARGET = 1000;
export const BLOCK_SIZE = 50;
export const MAX_BLOCKS = 20;

/** Tanggal lokal dalam format YYYY-MM-DD. */
export function todayStr(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Memilih paket harian: maksimal 1.000 soal unik.
 * Prioritas: (1) antrean remedial, (2) belum pernah dikerjakan,
 * (3) sudah dikerjakan — yang paling lama tidak dilihat lebih dulu.
 * Hasil deterministik untuk kombinasi tanggal + riwayat yang sama.
 */
export function buildDailyIds(date: string, bank: Question[], hist: Record<string, QHist>): string[] {
  const seen = new Set<string>();
  const unique = bank.filter(q => (seen.has(q.id) ? false : (seen.add(q.id), true)));
  const mixed = shuffle(unique, 'paket:' + date);
  const due: string[] = [];
  const fresh: string[] = [];
  const old: { id: string; last: string }[] = [];
  for (const q of mixed) {
    const h = hist[q.id];
    if (!h) fresh.push(q.id);
    else if (h.due) due.push(q.id);
    else old.push({ id: q.id, last: h.last });
  }
  old.sort((a, b) => (a.last < b.last ? -1 : a.last > b.last ? 1 : 0));
  const picked = [...due, ...fresh, ...old.map(o => o.id)].slice(0, DAILY_TARGET);
  // Acak ulang agar domain dan prioritas tercampur merata di semua blok.
  return shuffle(picked, 'urut:' + date);
}

export function blockCount(total: number): number {
  return Math.min(MAX_BLOCKS, Math.ceil(total / BLOCK_SIZE));
}

export function blockIds(ids: string[], block: number): string[] {
  return ids.slice(block * BLOCK_SIZE, (block + 1) * BLOCK_SIZE);
}
