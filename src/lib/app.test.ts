import { describe, expect, it } from 'vitest';
import { builtinBank, generateFromTable, validateQuestion } from './bank';
import { BLOCK_SIZE, DAILY_TARGET, MAX_BLOCKS, blockCount, blockIds, buildDailyIds } from './daily';
import { daySummary, dueIds, emptyState, ensureDay, recordRemedial, scoreBlock, streak, submitBlock, updateBlock } from './store';
import type { Question } from './types';

/** Bank sintetis 1.200 soal — tes paket & alur tidak bergantung pada isi data. */
function syntheticBank(n = 1200): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    domain: `D${i % 12}`,
    topic: 'T',
    stem: `Soal ${i}?`,
    options: ['A', 'B', 'C', 'D', 'E'].map(l => `${l}${i}`),
    answer: i % 5,
    explanation: `Pembahasan ${i}.`,
  }));
}

describe('generator soal dari tabel fakta', () => {
  it('distraktor tidak pernah berasal dari grup yang sama atau bernilai sama', () => {
    const qs = generateFromTable({
      id: 't', domain: 'D', topic: 'T', f: '{k}?', r: '{v}?',
      pairs: [['a', '1', 'g'], ['b', '2', 'g'], ['c', '3'], ['d', '4'], ['e', '5'], ['f', '1']],
    });
    const fa = qs.find(q => q.stem === 'a?')!;
    expect(fa.options).not.toContain('2');
    expect(fa.options[fa.answer]).toBe('1');
    const ra = qs.find(q => q.id.startsWith('t:r:a'))!;
    expect(ra.options).not.toContain('b');
    expect(ra.options).not.toContain('f');
  });

  it('bank bawaan valid, unik, dan deterministik', () => {
    const bank = builtinBank();
    expect(bank.length).toBeGreaterThan(0);
    expect(new Set(bank.map(q => q.id)).size).toBe(bank.length);
    for (const q of bank) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(4);
      expect(q.options.length, q.id).toBeLessThanOrEqual(5);
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
      expect(validateQuestion(q), q.id).toBeNull();
    }
    expect(JSON.stringify(builtinBank().slice(0, 20))).toBe(JSON.stringify(bank.slice(0, 20)));
  });

  it('menolak soal impor yang tidak valid', () => {
    expect(validateQuestion({ id: 'x', domain: 'd', stem: 's', explanation: 'e', options: ['a', 'b'], answer: 2 })).not.toBeNull();
    expect(validateQuestion({ id: 'x', domain: 'd', stem: 's', explanation: 'e', options: ['a', 'a'], answer: 0 })).not.toBeNull();
    expect(validateQuestion({ id: 'x', domain: 'd', stem: 's', explanation: 'e', options: ['a', 'b'], answer: 1 })).toBeNull();
  });
});

describe('paket harian', () => {
  const bank = syntheticBank();
  const ids = buildDailyIds('2026-01-05', bank, {});
  it('1.000 soal unik dalam 20 blok berisi 50', () => {
    expect(DAILY_TARGET).toBe(1000);
    expect(ids.length).toBe(DAILY_TARGET);
    expect(new Set(ids).size).toBe(DAILY_TARGET);
    expect(blockCount(ids.length)).toBe(MAX_BLOCKS);
    for (let i = 0; i < MAX_BLOCKS; i++) expect(blockIds(ids, i).length).toBe(BLOCK_SIZE);
  });
  it('deterministik per tanggal dan berbeda antar tanggal', () => {
    expect(buildDailyIds('2026-01-05', bank, {})).toEqual(ids);
    expect(buildDailyIds('2026-01-06', bank, {})).not.toEqual(ids);
  });
  it('bank kecil → paket berisi seluruh soal, blok lebih sedikit', () => {
    const s = buildDailyIds('2026-01-05', bank.slice(0, 120), {});
    expect(s.length).toBe(120);
    expect(blockCount(s.length)).toBe(3);
    expect(blockIds(s, 2).length).toBe(20);
  });
  it('memprioritaskan remedial lalu soal yang belum pernah dikerjakan', () => {
    const hist: Record<string, { n: number; c: number; last: string; due: boolean }> = {};
    ids.forEach((id, i) => (hist[id] = { n: 1, c: i < 10 ? 0 : 1, last: '2026-01-05', due: i < 10 }));
    const next = new Set(buildDailyIds('2026-01-06', bank, hist));
    ids.slice(0, 10).forEach(id => expect(next.has(id)).toBe(true));
    bank.filter(q => !hist[q.id]).forEach(q => expect(next.has(q.id)).toBe(true));
  });
});

describe('alur blok → hasil → remedial', () => {
  const bank = syntheticBank();
  const map = new Map(bank.map(q => [q.id, q]));
  const date = '2026-01-05';

  it('menilai blok, mengunci, dan mengisi antrean remedial', () => {
    let s = ensureDay(emptyState(), date, bank);
    const b0 = blockIds(s.days[date].ids, 0);
    s = updateBlock(s, date, 0, b => {
      const answers: Record<string, number> = {};
      b0.slice(0, 30).forEach(id => (answers[id] = map.get(id)!.answer));
      b0.slice(30, 40).forEach(id => (answers[id] = (map.get(id)!.answer + 1) % 5));
      return { ...b, answers };
    });
    s = submitBlock(s, date, 0, map);
    const sc = scoreBlock(s.days[date], 0, map);
    expect(sc).toMatchObject({ total: 50, correct: 30, wrong: 10, blank: 10, pct: 60 });
    expect(sc.byDomain.reduce((a, d) => a + d.total, 0)).toBe(50);
    expect(dueIds(s, map).length).toBe(20);
    expect(daySummary(s.days[date], map)).toMatchObject({ blocks: 20, done: 1, answered: 40, correct: 30 });

    // blok terkunci: perubahan & submit ulang diabaikan
    const again = submitBlock(updateBlock(s, date, 0, b => ({ ...b, answers: {} })), date, 0, map);
    expect(again).toBe(s);

    s = recordRemedial(s, b0[35], true, date);
    expect(s.hist[b0[35]]).toMatchObject({ n: 2, c: 1, due: false });
    expect(dueIds(s, map).length).toBe(19);
    expect(streak(s, date)).toBe(1);
    expect(streak(s, '2026-01-06')).toBe(1);
    expect(streak(s, '2026-01-07')).toBe(0);
  });

  it('paket hari yang sama tidak dibuat ulang', () => {
    const s = ensureDay(emptyState(), date, bank);
    expect(ensureDay(s, date, bank.slice(0, 10))).toBe(s);
  });
});
