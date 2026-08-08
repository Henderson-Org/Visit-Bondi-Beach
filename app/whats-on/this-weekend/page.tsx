import type { Metadata } from 'next';
import { WhatsOnLandingView } from '@/components/events/WhatsOnLandingView';
import { isProduction } from '@/lib/site';
import { upcomingEvents, sydneyToday, passesDateFilter } from '@/lib/events';

const TITLE = "What's On in Bondi This Weekend";
const DESCRIPTION = "What's on in Bondi Beach this weekend — markets, events and things to do on Saturday and Sunday. A live, date-aware weekend guide.";

export const revalidate = 1800;
export function generateMetadata(): Metadata {
  return { title: TITLE, description: DESCRIPTION, alternates: { canonical: '/whats-on/this-weekend' }, robots: isProduction() ? undefined : { index: false, follow: true }, openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' } };
}
export default function Page() {
  const today = sydneyToday();
  const events = upcomingEvents(today).filter((r) => passesDateFilter(r.event, 'weekend', today));
  return <WhatsOnLandingView slug="this-weekend" h1={TITLE} kicker="What's On · This weekend" intro="Your Bondi weekend, sorted — what's on this Saturday and Sunday. Always up to date with the current weekend." events={events} emptyLead="Nothing listed for this weekend yet — check back soon." />;
}
