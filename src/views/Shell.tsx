'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useApp } from './Providers';

const NAV: [string, string][] = [
  ['/', 'Dashboard'],
  ['/paket/', 'Paket Hari Ini'],
  ['/remedial/', 'Remedial'],
  ['/data/', 'Data'],
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname() ?? '/';
  const { saveOk } = useApp();
  const focus = path.startsWith('/blok/');

  return (
    <>
      <header className="top">
        <Link className="brand" href="/">CBT Harian <span>• Ortopedi</span></Link>
        {!focus && (
          <nav>
            {NAV.map(([href, label]) => {
              const on = href === '/' ? path === '/' : path.startsWith(href);
              return (
                <Link key={href} href={href} className={on ? 'on' : ''}>{label}</Link>
              );
            })}
          </nav>
        )}
      </header>
      {!saveOk && (
        <div className="warn wrap">Progres tidak dapat disimpan di browser ini (penyimpanan penuh atau diblokir). Ekspor data Anda dari menu Data.</div>
      )}
      <main className="wrap">{children}</main>
      <footer className="wrap foot">
        Materi latihan untuk belajar mandiri — bukan pengganti textbook, guideline, atau penilaian klinis. Progres tersimpan hanya di perangkat ini.
      </footer>
    </>
  );
}
