'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useApp } from './Providers';
import { fmtTime, LETTERS } from './format';
import { blockCount, blockIds } from '../lib/daily';
import { submitBlock, updateBlock } from '../lib/store';

export function Blok({ block }: { block: number }) {
  const { state, set, map, today } = useApp();
  const router = useRouter();
  const day = state.days[today];
  const valid = Number.isInteger(block) && block >= 0 && block < blockCount(day.ids.length);
  const b = valid ? day.blocks[block] : undefined;
  const ids = valid ? blockIds(day.ids, block).filter(id => map.has(id)) : [];
  const [idx, setIdx] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [elapsed, setElapsed] = useState(b?.elapsed ?? 0);
  const elRef = useRef(elapsed);
  elRef.current = elapsed;
  const locked = !!b?.submittedAt;

  // Timer: berjalan hanya saat tab terlihat; disimpan tiap 10 detik dan saat keluar.
  useEffect(() => {
    if (!valid || locked) return;
    const persist = () => set(s => updateBlock(s, today, block, x => ({ ...x, elapsed: elRef.current })));
    const t = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setElapsed(e => e + 1);
      if ((elRef.current + 1) % 10 === 0) persist();
    }, 1000);
    return () => {
      clearInterval(t);
      persist();
    };
  }, [valid, locked, block, today, set]);

  const answers = b?.answers ?? {};
  const flags = b?.flags ?? [];
  const q = map.get(ids[idx]);

  const choose = (opt: number) =>
    q && set(s => updateBlock(s, today, block, x => {
      const a = { ...x.answers };
      if (a[q.id] === opt) delete a[q.id];
      else a[q.id] = opt;
      return { ...x, answers: a, elapsed: elRef.current };
    }));
  const toggleFlag = () =>
    q && set(s => updateBlock(s, today, block, x => ({
      ...x,
      flags: x.flags.includes(q.id) ? x.flags.filter(f => f !== q.id) : [...x.flags, q.id],
    })));

  useEffect(() => {
    if (!valid || locked) return;
    const on = (e: KeyboardEvent) => {
      if (confirm || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright') setIdx(i => Math.min(ids.length - 1, i + 1));
      else if (k === 'arrowleft') setIdx(i => Math.max(0, i - 1));
      else if (k === 'r') toggleFlag();
      else if (q) {
        const n = /^[1-6]$/.test(k) ? Number(k) - 1 : 'abcdef'.indexOf(k);
        if (k.length === 1 && n >= 0 && n < q.options.length) choose(n);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  if (!valid) return <p>Blok tidak ditemukan. <Link href="/paket/">Kembali ke Paket Hari Ini</Link></p>;
  if (locked) {
    return (
      <div className="card">
        <h2>Blok {block + 1} sudah dikumpulkan</h2>
        <div className="row">
          <Link className="btn primary" href={`/hasil/${block}/`}>Lihat Hasil</Link>
          <Link className="btn" href={`/review/${block}/`}>Review</Link>
        </div>
      </div>
    );
  }
  if (!q) return <p>Soal tidak tersedia. <Link href="/paket/">Kembali</Link></p>;

  const answered = ids.filter(id => answers[id] !== undefined).length;
  const submit = () => {
    set(s => submitBlock(updateBlock(s, today, block, x => ({ ...x, elapsed: elRef.current })), today, block, map));
    router.push(`/hasil/${block}/`);
  };

  return (
    <div className="exam">
      <div className="exambar">
        <Link href="/paket/" className="muted">← Keluar (tersimpan)</Link>
        <strong>Blok {block + 1}</strong>
        <span>{answered}/{ids.length} terjawab</span>
        <span className="timer" aria-label="Waktu berjalan">⏱ {fmtTime(elapsed)}</span>
        <button className="btn primary sm" onClick={() => setConfirm(true)}>Kumpulkan</button>
      </div>

      <div className="examgrid">
        <section className="card qcard">
          <div className="qmeta">
            <span>Soal {idx + 1} dari {ids.length}</span>
            <button className={'btn sm' + (flags.includes(q.id) ? ' flag' : '')} onClick={toggleFlag} aria-pressed={flags.includes(q.id)}>
              ⚑ {flags.includes(q.id) ? 'Ditandai ragu' : 'Tandai ragu'}
            </button>
          </div>
          <p className="stem">{q.stem}</p>
          <div className="opts" role="radiogroup" aria-label="Pilihan jawaban">
            {q.options.map((o, i) => (
              <button key={i} role="radio" aria-checked={answers[q.id] === i} className={'opt' + (answers[q.id] === i ? ' sel' : '')} onClick={() => choose(i)}>
                <b>{LETTERS[i]}</b><span>{o}</span>
              </button>
            ))}
          </div>
          <div className="row between">
            <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Sebelumnya</button>
            {idx < ids.length - 1 ? (
              <button className="btn primary" onClick={() => setIdx(idx + 1)}>Berikutnya →</button>
            ) : (
              <button className="btn primary" onClick={() => setConfirm(true)}>Kumpulkan Blok</button>
            )}
          </div>
          <p className="muted small">Pintasan: A–E / 1–5 memilih · ← → berpindah · R menandai ragu</p>
        </section>

        <aside className="card navgrid" aria-label="Navigasi soal">
          {ids.map((id, i) => (
            <button
              key={id}
              className={'num' + (i === idx ? ' cur' : '') + (answers[id] !== undefined ? ' ans' : '') + (flags.includes(id) ? ' flg' : '')}
              onClick={() => setIdx(i)}
              aria-label={`Soal ${i + 1}`}
            >{i + 1}</button>
          ))}
        </aside>
      </div>

      {confirm && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="card">
            <h2>Kumpulkan Blok {block + 1}?</h2>
            <p>
              {answered} dari {ids.length} soal terjawab
              {ids.length - answered > 0 && <> · <b className="bad">{ids.length - answered} masih kosong</b> (dihitung salah)</>}
              {flags.length > 0 && <> · {flags.length} ditandai ragu</>}.
            </p>
            <p className="muted">Setelah dikumpulkan, jawaban tidak dapat diubah.</p>
            <div className="row">
              <button className="btn primary" onClick={submit}>Ya, kumpulkan</button>
              <button className="btn" onClick={() => setConfirm(false)}>Kembali mengerjakan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
