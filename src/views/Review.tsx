'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApp } from './Providers';
import { LETTERS } from './format';
import { blockIds } from '../lib/daily';

type Filter = 'semua' | 'salah' | 'kosong' | 'ragu' | 'benar';

export function Review({ block }: { block: number }) {
  const { state, map, today } = useApp();
  const [filter, setFilter] = useState<Filter>('semua');
  const day = state.days[today];
  const b = day.blocks[block];
  if (!b?.submittedAt) return <p>Review tersedia setelah blok dikumpulkan. <Link href={`/blok/${block}/`}>Kerjakan Blok {block + 1}</Link></p>;

  const items = blockIds(day.ids, block)
    .map((id, i) => ({ q: map.get(id), no: i + 1 }))
    .filter(x => x.q)
    .map(({ q, no }) => {
      const a = b.answers[q!.id];
      const status: Filter = a === undefined ? 'kosong' : a === q!.answer ? 'benar' : 'salah';
      return { q: q!, no, a, status, flagged: b.flags.includes(q!.id) };
    });
  const count = (f: Filter) => (f === 'semua' ? items.length : f === 'ragu' ? items.filter(x => x.flagged).length : items.filter(x => x.status === f).length);
  const shown = items.filter(x => filter === 'semua' || (filter === 'ragu' ? x.flagged : x.status === filter));
  const filters: [Filter, string][] = [['semua', 'Semua'], ['salah', 'Salah'], ['kosong', 'Kosong'], ['ragu', 'Ragu'], ['benar', 'Benar']];

  return (
    <>
      <h1>Review Blok {block + 1}</h1>
      <div className="row">
        {filters.map(([f, label]) => (
          <button key={f} className={'btn sm' + (filter === f ? ' primary' : '')} onClick={() => setFilter(f)}>{label} ({count(f)})</button>
        ))}
        <span className="grow" />
        <Link className="btn sm" href={`/hasil/${block}/`}>← Hasil</Link>
        <Link className="btn sm" href="/remedial/">Remedial</Link>
      </div>
      {shown.length === 0 && <p className="muted">Tidak ada soal pada filter ini.</p>}
      {shown.map(({ q, no, a, status, flagged }) => (
        <article className="card rev" key={q.id}>
          <div className="qmeta">
            <span>Soal {no} · {q.domain} · {q.topic}</span>
            <span>
              {flagged && <span className="pill flag">⚑ Ragu</span>}{' '}
              <span className={'pill ' + (status === 'benar' ? 'ok' : 'no')}>{status === 'benar' ? 'Benar' : status === 'salah' ? 'Salah' : 'Kosong'}</span>
            </span>
          </div>
          <p className="stem">{q.stem}</p>
          <div className="opts">
            {q.options.map((o, i) => (
              <div key={i} className={'opt static' + (i === q.answer ? ' right' : i === a ? ' wrong' : '')}>
                <b>{LETTERS[i]}</b>
                <span>{o}{i === q.answer && <em> — jawaban benar</em>}{i === a && i !== q.answer && <em> — jawaban Anda</em>}</span>
              </div>
            ))}
          </div>
          <div className="expl"><b>Pembahasan.</b> {q.explanation}</div>
        </article>
      ))}
    </>
  );
}
