import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../src/styles.css';
import { Providers } from '../src/views/Providers';
import { Shell } from '../src/views/Shell';

export const metadata: Metadata = {
  title: 'CBT Harian • Ortopedi',
  description: 'Latihan CBT harian ortopedi untuk persiapan ujian board residen.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
