'use client';

import Link from 'next/link';
import { useApp } from './Providers';
import { fmtDate } from './format';
import { blockCount, DAILY_TARGET } from '../lib/daily';
import { daySummary, domainStats, dueIds, streak } from '../lib/store';

export function Dashboard() {
  const { state, map, today, bank } = useApp();
  const day = state.days[today];
  const sum = daySummary(day, map);
  const due = dueIds(state, map).length;
  const blocks = blockCount(day.ids.length);
  let next = -1;
  for (let i = 0; i < blocks; i++) if (!day.blocks[i]?.submittedAt) { next = i; break; }
  const started = next >= 0 && Object.keys(day.blocks[next]?.answers ?? {}).length > 0;
  const doms = domainStats(state, map);
  const attempted = Object.keys(state.hist).filter(id => map.has(id)).length;
  const pct = sum.answered ? Math.round((sum.correct / sum.answered) * 100) : null;

  return (
    <>
      <p className="muted">{fmtDate(today)}</p>
      <h1>Dashboard</h1>

      <section className="card hero">
        <div>
          <h2>Paket Hari Ini</h2>
          <p>
            {sum.total.toLocaleString('id-ID')} soal unik dalam {blocks} blok · {sum.done} dari {blocks} blok selesai
          </p>
          <div className="bar" aria-label="Progres blok"><i style={{ width: `${(sum.done / Math.max(1, blocks)) * 100}%` }} /></div>
        </div>
        <div className="row">
          {next >= 0 ? (
            <Link className="btn primary" href={`/blok/${next}/`}>{started ? 'Lanjutkan' : 'Mulai'} Blok {next + 1}</Link>
          ) : (
            <span className="pill ok">Semua blok selesai 🎉</span>
          )}
          <Link className="btn" href="/paket/">Lihat semua blok</Link>
        </div>
      </section>

      <section className="grid4">
        <div className="card stat"><b>{sum.answered.toLocaleString('id-ID')}</b><span>Soal dijawab hari ini</span></div>
        <div className="card stat"><b>{pct === null ? '–' : pct + '%'}</b><span>Akurasi hari ini</span></div>
        <div className="card stat"><b>{streak(state, today)}</b><span>Hari beruntun</span></div>
        <div className="card stat">
          <b>{due.toLocaleString('id-ID')}</b><span>Antrean remedial</span>
          {due > 0 && <Link href="/remedial/">Kerjakan →</Link>}
        </div>
      </section>

      <section className="card">
        <h2>Performa per domain</h2>
        {doms.length === 0 ? (
          <p className="muted">Belum ada data. Selesaikan satu blok untuk melihat domain terlemah Anda.</p>
        ) : (
          <table className="tbl">
            <thead><tr><th>Domain</th><th>Benar / Percobaan</th><th>Akurasi</th></tr></thead>
            <tbody>
              {doms.map(d => (
                <tr key={d.domain}>
                  <td>{d.domain}</td>
                  <td>{d.c} / {d.n}</td>
                  <td><div className="bar sm"><i className={d.pct < 60 ? 'bad' : ''} style={{ width: d.pct + '%' }} /></div> {d.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="muted small">
        Bank soal: {bank.length.toLocaleString('id-ID')} soal · {attempted.toLocaleString('id-ID')} sudah pernah dikerjakan.
        {bank.length < DAILY_TARGET && ' Bank lebih kecil dari target 1.000 soal/hari — paket berisi seluruh soal yang tersedia.'}
      </p>
    </>
  );
}
