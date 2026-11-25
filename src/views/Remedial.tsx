'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApp } from './Providers';
import { LETTERS } from './format';
import { shuffle } from '../lib/rng';
import { dueIds, recordRemedial } from '../lib/store';

const SESSION = 50;

export function Remedial() {
  const { state, set, map, today } = useApp();
  const [scope, setScope] = useState<'today' | 'all'>('all');
  const [queue, setQueue] = useState<string[] | null>(null);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [tally, setTally] = useState({ ok: 0, no: 0 });

  const all = dueIds(state, map);
  const todaySet = useMemo(() => new Set(state.days[today].ids), [state.days, today]);
  const todays = all.filter(id => todaySet.has(id) && state.hist[id].last === today);
  const pool = scope === 'today' ? todays : all;

  const q = queue ? map.get(queue[pos]) : undefined;
  // Urutan opsi diacak ulang tiap soal agar tidak menghafal posisi jawaban.
  const order = useMemo(
    () => (q ? shuffle(q.options.map((_, i) => i), `${q.id}:${state.hist[q.id]?.n ?? 0}:${pos}`) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q?.id, pos],
  );

  if (!queue) {
    return (
      <>
        <h1>Remedial</h1>
        <p>Soal yang salah atau kosong masuk ke antrean ini. Jawab dengan benar untuk mengeluarkannya; pembahasan muncul langsung setelah menjawab.</p>
        <section className="card">
          {all.length === 0 ? (
            <p>Antrean remedial kosong. <Link href="/paket/">Kerjakan blok</Link> untuk mengisi antrean.</p>
          ) : (
            <>
              <div className="row">
                <button className={'btn sm' + (scope === 'all' ? ' primary' : '')} onClick={() => setScope('all')}>Semua antrean ({all.length})</button>
                <button className={'btn sm' + (scope === 'today' ? ' primary' : '')} onClick={() => setScope('today')}>Dari hari ini ({todays.length})</button>
              </div>
              <p className="muted">Satu sesi berisi maksimal {SESSION} soal.</p>
              <button
                className="btn primary"
                disabled={pool.length === 0}
                onClick={() => {
                  setQueue(shuffle(pool, 'rem:' + Date.now()).slice(0, SESSION));
                  setPos(0); setPicked(null); setTally({ ok: 0, no: 0 });
                }}
              >Mulai sesi remedial ({Math.min(SESSION, pool.length)} soal)</button>
            </>
          )}
        </section>
      </>
    );
  }

  if (!q) {
    return (
      <>
        <h1>Sesi remedial selesai</h1>
        <section className="card hero">
          <div className="grid4 flat">
            <div className="stat"><b className="good">{tally.ok}</b><span>Benar — keluar dari antrean</span></div>
            <div className="stat"><b className="bad">{tally.no}</b><span>Masih salah — tetap di antrean</span></div>
            <div className="stat"><b>{all.length}</b><span>Sisa antrean</span></div>
          </div>
        </section>
        <div className="row">
          {all.length > 0 && <button className="btn primary" onClick={() => setQueue(null)}>Sesi berikutnya</button>}
          <Link className="btn" href="/paket/">Paket Hari Ini</Link>
          <Link className="btn" href="/">Dashboard</Link>
        </div>
      </>
    );
  }

  const answer = (i: number) => {
    if (picked !== null) return;
    const ok = i === q.answer;
    setPicked(i);
    setTally(t => ({ ok: t.ok + (ok ? 1 : 0), no: t.no + (ok ? 0 : 1) }));
    set(s => recordRemedial(s, q.id, ok, today));
  };

  return (
    <>
      <h1>Remedial</h1>
      <section className="card qcard">
        <div className="qmeta">
          <span>Soal {pos + 1} dari {queue.length} · {q.domain} · {q.topic}</span>
          <span><span className="pill ok">{tally.ok} benar</span> <span className="pill no">{tally.no} salah</span></span>
        </div>
        <p className="stem">{q.stem}</p>
        <div className="opts">
          {order.map((oi, i) => {
            const cls = picked === null ? '' : oi === q.answer ? ' right' : oi === picked ? ' wrong' : '';
            return (
              <button key={oi} className={'opt' + cls} disabled={picked !== null} onClick={() => answer(oi)}>
                <b>{LETTERS[i]}</b><span>{q.options[oi]}</span>
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <>
            <div className="expl">
              <b>{picked === q.answer ? 'Benar.' : 'Belum tepat.'}</b> {q.explanation}
            </div>
            <div className="row between">
              <button className="btn" onClick={() => setQueue(null)}>Akhiri sesi</button>
              <button className="btn primary" autoFocus onClick={() => { setPos(pos + 1); setPicked(null); }}>
                {pos + 1 < queue.length ? 'Soal berikutnya →' : 'Lihat ringkasan'}
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}
