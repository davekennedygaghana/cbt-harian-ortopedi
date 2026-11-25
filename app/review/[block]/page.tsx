import { Review } from '../../../src/views/Review';
import { MAX_BLOCKS } from '../../../src/lib/daily';

export function generateStaticParams() {
  return Array.from({ length: MAX_BLOCKS }, (_, i) => ({ block: String(i) }));
}

export default function Page({ params }: { params: { block: string } }) {
  return <Review block={Number(params.block)} />;
}
