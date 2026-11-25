'use client';

import { useRef, useState } from 'react';
import { useApp } from './Providers';
import { builtinBank, validateQuestion } from '../lib/bank';
import { emptyState, isValidState } from '../lib/store';
import type { Question } from '../lib/types';

const CONTOH = `[
  {
    "id": "trauma-001",
    "domain": "Trauma",
    "topic": "Hip fracture",
    "stem": "Seorang wanita 78 tahun ...",
    "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D", "Pilihan E"],
    "answer": 2,
    "explanation": "Pembahasan singkat ..."
  }
]`;

function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Data() {
  const { state, set, today } = useApp();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const progRef = useRef<HTMLInputElement>(null);
  const soalRef = useRef<HTMLInputElement>(null);

  const read = async (input: HTMLInputElement | null, fn: (data: unknown) => void) => {
    const f = input?.files?.[0];
    if (!f) return;
    try {
      fn(JSON.parse(await f.text()));
    } catch {
      setMsg({ ok: false, text: 'File bukan JSON yang valid.' });
    }
    if (input) input.value = '';
  };

  const importProgress = (data: unknown) => {
    if (!isValidState(data)) return setMsg({ ok: false, text: 'Format file progres tidak dikenali.' });
    if (!window.confirm('Progres saat ini akan diganti dengan isi file. Lanjutkan?')) return;
    set(() => data);
    setMsg({ ok: true, text: 'Progres berhasil dipulihkan.' });
  };

  const importSoal = (data: unknown) => {
    if (!Array.isArray(data)) return setMsg({ ok: false, text: 'File harus berupa array soal.' });
    const good: Question[] = [];
    const errors: string[] = [];
    const seen = new Set(state.custom.map(q => q.id));
    data.forEach((raw, i) => {
      const err = validateQuestion(raw);
      if (err) return void errors.push(`#${i + 1}: ${err}`);
      const q = raw as Question;
      const id = 'impor:' + q.id;
      if (seen.has(id)) return void errors.push(`#${i + 1}: id "${q.id}" duplikat`);
      seen.add(id);
      good.push({ id, domain: q.domain.trim(), topic: typeof q.topic === 'string' && q.topic.trim() ? q.topic : 'Impor', stem: q.stem, options: q.options, answer: q.answer, explanation: q.explanation });
    });
    if (good.length) set(s => ({ ...s, custom: [...s.custom, ...good] }));
    setMsg({
      ok: good.length > 0,
      text: `${good.length} soal ditambahkan` + (errors.length ? `; ${errors.length} ditolak (${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '; …' : ''})` : '') + '. Soal baru masuk ke paket mulai hari berikutnya.',
    });
  };

  return (
    <>
      <h1>Data & Bank Soal</h1>
      {msg && <div className={msg.ok ? 'note' : 'warn'} role="status">{msg.text}</div>}

      <section className="card">
        <h2>Bank soal</h2>
        <p>{builtinBank().length.toLocaleString('id-ID')} soal bawaan + {state.custom.length.toLocaleString('id-ID')} soal impor. Aplikasi berjalan sepenuhnya di browser — tanpa akun, server, atau layanan AI.</p>
        <p className="muted">Tambahkan soal vignette klinis Anda sendiri melalui impor JSON di bawah. Selalu verifikasi dengan referensi standar.</p>
        <div className="row">
          <button className="btn" onClick={() => soalRef.current?.click()}>Impor soal (JSON)</button>
          {state.custom.length > 0 && (
            <button className="btn" onClick={() => window.confirm(`Hapus ${state.custom.length} soal impor?`) && set(s => ({ ...s, custom: [] }))}>Hapus soal impor</button>
          )}
          <input ref={soalRef} type="file" accept="application/json,.json" hidden onChange={e => read(e.target, importSoal)} />
        </div>
        <details>
          <summary>Format file soal</summary>
          <pre>{CONTOH}</pre>
          <p className="muted small"><code>answer</code> adalah indeks pilihan yang benar, dimulai dari 0. Pilihan 2–6 butir, tanpa duplikat.</p>
        </details>
      </section>

      <section className="card">
        <h2>Progres</h2>
        <p>Progres tersimpan di browser perangkat ini. Ekspor secara berkala sebagai cadangan atau untuk pindah perangkat.</p>
        <div className="row">
          <button className="btn" onClick={() => download(`cbt-ortopedi-progres-${today}.json`, JSON.stringify(state))}>Ekspor progres</button>
          <button className="btn" onClick={() => progRef.current?.click()}>Impor progres</button>
          <input ref={progRef} type="file" accept="application/json,.json" hidden onChange={e => read(e.target, importProgress)} />
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm('Hapus seluruh riwayat, paket, dan antrean remedial? Soal impor tetap disimpan.')) {
                set(s => ({ ...emptyState(), custom: s.custom }));
                setMsg({ ok: true, text: 'Progres direset.' });
              }
            }}
          >Reset progres</button>
        </div>
      </section>
    </>
  );
}
