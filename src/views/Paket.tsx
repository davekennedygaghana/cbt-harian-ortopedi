'use client';

import Link from 'next/link';
import { useApp } from './Providers';
import { fmtDate } from './format';
import { fmtTime } from './format';
import { blockCount, blockIds } from '../lib/daily';
import { scoreBlock } from '../lib/store';

export function Paket() {
  const { state, map, today } = useApp();
  const day = state.days[today];
  const blocks = blockCount(day.ids.length);

  return (
    <>
      <p className="muted">{fmtDate(today)}</p>
      <h1>Paket Hari Ini</h1>
      <p>{day.ids.length.toLocaleString('id-ID')} soal unik · {blocks} blok. Blok dapat dikerjakan dalam urutan apa pun; jawaban tersimpan otomatis.</p>
      <div className="blocks">
        {Array.from({ length: blocks }, (_, i) => {
          const b = day.blocks[i];
          const size = blockIds(day.ids, i).length;
          const answered = Object.keys(b?.answers ?? {}).length;
          if (b?.submittedAt) {
            const sc = scoreBlock(day, i, map);
            return (
              <div className="card blk done" key={i}>
                <h3>Blok {i + 1}</h3>
                <b className={sc.pct >= 70 ? 'good' : 'bad'}>{sc.pct}%</b>
                <span className="muted small">{sc.correct}/{sc.total} benar · {fmtTime(b.elapsed)}</span>
                <div className="row">
                  <Link className="btn sm" href={`/hasil/${i}/`}>Hasil</Link>
                  <Link className="btn sm" href={`/review/${i}/`}>Review</Link>
                </div>
              </div>
            );
          }
          return (
            <div className="card blk" key={i}>
              <h3>Blok {i + 1}</h3>
              <span className="muted small">{size} soal{answered > 0 && ` · ${answered} terjawab`}</span>
              <Link className={'btn sm' + (answered ? ' primary' : '')} href={`/blok/${i}/`}>{answered ? 'Lanjutkan' : 'Kerjakan'}</Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
