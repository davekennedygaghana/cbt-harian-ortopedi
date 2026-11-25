import { Blok } from '../../../src/views/Blok';
import { MAX_BLOCKS } from '../../../src/lib/daily';

// Rute dinamis dibuat statis untuk setiap nomor blok (0–19).
export function generateStaticParams() {
  return Array.from({ length: MAX_BLOCKS }, (_, i) => ({ block: String(i) }));
}

export default function Page({ params }: { params: { block: string } }) {
  const n = Number(params.block);
  return <Blok key={n} block={n} />;
}
