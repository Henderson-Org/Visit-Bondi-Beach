import type { Metadata } from 'next';
import { StayCategoryView } from '@/components/stay/StayCategoryView';
import { getStayCategory } from '@/data/stay-categories';
import { isProduction, seoTitle } from '@/lib/site';

const SLUG = 'best-hotels-bondi-beach';
export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const c = getStayCategory(SLUG)!;
  return {
    title: seoTitle(c.metaTitle),
    description: c.metaDescription,
    alternates: { canonical: `/stay/${SLUG}` },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: c.metaTitle, description: c.metaDescription, type: 'website', images: c.heroImage },
  };
}

export default function Page() {
  return <StayCategoryView category={getStayCategory(SLUG)!} />;
}
