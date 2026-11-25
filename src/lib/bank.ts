import type { FactTable, Question } from './types';
import { hash, shuffle } from './rng';
import { TABLES } from '../data';

const MAX_OPTIONS = 5;
const MIN_OPTIONS = 4;

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

function slug(s: string): string {
  const base = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
  return `${base}-${hash(s).toString(36)}`;
}

/** Membangkitkan soal single-best-answer dari satu tabel fakta. Deterministik. */
export function generateFromTable(t: FactTable): Question[] {
  const out: Question[] = [];
  const expl = (k: string, v: string) => `${k} — ${v}.${t.note ? ' ' + t.note : ''}`;

  t.pairs.forEach(([k, v, g], i) => {
    if (t.f) {
      const id = `${t.id}:f:${slug(k)}`;
      const pool = [
        ...new Set(t.pairs.filter(([, v2, g2]) => v2 !== v && !(g && g2 === g)).map(p => p[1])),
      ];
      if (pool.length >= MIN_OPTIONS - 1) {
        const distractors = shuffle(pool, id + ':d').slice(0, MAX_OPTIONS - 1);
        const options = shuffle([v, ...distractors], id + ':o').map(cap);
        out.push({
          id,
          domain: t.domain,
          topic: t.topic,
          stem: t.f.replace('{k}', k),
          options,
          answer: options.indexOf(cap(v)),
          explanation: expl(k, v),
        });
      }
    }
    if (t.r) {
      const id = `${t.id}:r:${slug(k)}`;
      const pool = t.pairs
        .map((p, idx) => ({ p, idx }))
        .filter(({ p, idx }) => idx !== i && p[1] !== v && !(g && p[2] === g));
      if (pool.length >= MIN_OPTIONS - 1) {
        const picked = shuffle(pool, id + ':d').slice(0, MAX_OPTIONS - 1);
        let opts = [{ p: t.pairs[i], idx: i }, ...picked];
        opts = t.ord ? opts.sort((a, b) => a.idx - b.idx) : shuffle(opts, id + ':o');
        const options = opts.map(o => cap(o.p[0]));
        out.push({
          id,
          domain: t.domain,
          topic: t.topic,
          stem: t.r.replace('{v}', v),
          options,
          answer: options.indexOf(cap(k)),
          explanation: expl(k, v),
        });
      }
    }
  });
  return out;
}

let cache: Question[] | null = null;

/** Bank soal bawaan (dibangkitkan sekali, lalu di-cache di memori). */
export function builtinBank(): Question[] {
  if (!cache) cache = TABLES.flatMap(generateFromTable);
  return cache;
}

/** Validasi soal impor; mengembalikan pesan galat atau null bila valid. */
export function validateQuestion(q: unknown): string | null {
  if (!q || typeof q !== 'object') return 'bukan objek';
  const o = q as Record<string, unknown>;
  for (const key of ['id', 'domain', 'stem', 'explanation'] as const) {
    if (typeof o[key] !== 'string' || !(o[key] as string).trim()) return `field "${key}" wajib berupa teks`;
  }
  if (!Array.isArray(o.options) || o.options.length < 2 || o.options.length > 6) return 'options harus 2–6 pilihan';
  if (o.options.some(x => typeof x !== 'string' || !x.trim())) return 'setiap option harus teks';
  if (new Set(o.options as string[]).size !== o.options.length) return 'options tidak boleh duplikat';
  if (!Number.isInteger(o.answer) || (o.answer as number) < 0 || (o.answer as number) >= o.options.length)
    return 'answer harus indeks option yang valid (mulai 0)';
  return null;
}

/** Bank lengkap = bawaan + soal impor. */
export function fullBank(custom: Question[]): Question[] {
  return [...builtinBank(), ...custom];
}
