'use client';

import Link from 'next/link';
import { useApp } from './Providers';
import { fmtTime } from './format';
import { blockCount } from '../lib/daily';
import { scoreBlock } from '../lib/store';

export function Hasil({ block }: { block: number }) {
  const { state, map, today } = useApp();
  const day = state.days[today];
  const b = day.blocks[block];
  if (!b?.submittedAt) return <p>Blok ini belum dikumpulkan. <Link href={`/blok/${block}/`}>Kerjakan Blok {block + 1}</Link></p>;
  const sc = scoreBlock(day, block, map);
  const blocks = blockCount(day.ids.length);
  let next = -1;
  for (let i = 1; i <= blocks; i++) {
    const j = (block + i) % blocks;
    if (!day.blocks[j]?.submittedAt) { next = j; break; }
  }
  const toFix = sc.wrong + sc.blank;

  return (
    <>
      <h1>Hasil Blok {block + 1}</h1>
      <section className="card hero">
        <div className="score"><b className={sc.pct >= 70 ? 'good' : 'bad'}>{sc.pct}%</b><span>{sc.correct} dari {sc.total} benar</span></div>
        <div className="grid4 flat">
          <div className="stat"><b className="good">{sc.correct}</b><span>Benar</span></div>
          <div className="stat"><b className="bad">{sc.wrong}</b><span>Salah</span></div>
          <div className="stat"><b>{sc.blank}</b><span>Kosong</span></div>
          <div className="stat"><b>{fmtTime(b.elapsed)}</b><span>Waktu ({sc.total ? Math.round(b.elapsed / sc.total) : 0} dtk/soal)</span></div>
        </div>
      </section>

      <section className="card">
        <h2>Per domain</h2>
        <table className="tbl">
          <thead><tr><th>Domain</th><th>Benar</th><th>Akurasi</th></tr></thead>
          <tbody>
            {sc.byDomain.map(d => {
              const p = Math.round((d.correct / d.total) * 100);
              return (
                <tr key={d.domain}>
                  <td>{d.domain}</td><td>{d.correct} / {d.total}</td>
                  <td><div className="bar sm"><i className={p < 60 ? 'bad' : ''} style={{ width: p + '%' }} /></div> {p}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="row">
        <Link className="btn primary" href={`/review/${block}/`}>Review pembahasan</Link>
        {toFix > 0 && <Link className="btn" href="/remedial/">Remedial ({toFix} soal dari blok ini)</Link>}
        {next >= 0 && <Link className="btn" href={`/blok/${next}/`}>Lanjut ke Blok {next + 1} →</Link>}
        <Link className="btn" href="/paket/">Paket Hari Ini</Link>
      </div>
    </>
  );
}
