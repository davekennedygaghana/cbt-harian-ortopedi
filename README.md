# CBT Harian • Ortopedi (Next.js)

Versi Next.js (App Router, static export). Berjalan sepenuhnya di browser: tanpa server, akun, API key, atau AI.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit test (Vitest)
npm run build    # type-check + build statis ke folder out/
```

Hasil `out/` adalah situs statis: unggah ke layanan static hosting mana pun (Netlify, Vercel static, GitHub Pages, dll.). Deploy belum dilakukan.

## Mengganti data soal dengan versi lengkap

Folder `src/data/` di sini hanya berisi **sample** (3 tabel). Versi lengkap (±1.500 soal, 30+ tabel)
ada di branch `claude/cbt-harian-ortopedi-app-3jva7v` pada repo asal. Salin folder `src/data/` dari sana
dan timpa file yang ada.

## Alur

Dashboard `/` → Paket Hari Ini `/paket/` → Kerjakan Blok `/blok/[0-19]/` → Hasil `/hasil/[n]/` → Review `/review/[n]/` → Remedial `/remedial/`. Data & ekspor/impor di `/data/`.

## Struktur

- `app/` – route Next.js (App Router); rute dinamis dibuat statis untuk blok 0–19
- `src/views/` – komponen halaman (client) dan `Providers` (state + localStorage)
- `src/lib/` – engine murni: pembangkit soal, paket harian, penilaian, remedial (diuji di `app.test.ts`)
- `src/data/` – tabel fakta (sample)
