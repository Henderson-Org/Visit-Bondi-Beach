import type { Metadata } from 'next';
import { WhatsOnLandingView } from '@/components/events/WhatsOnLandingView';
import { isProduction } from '@/lib/site';
import { upcomingEvents, sydneyToday } from '@/lib/events';

const TITLE = 'Bondi Markets';
const DESCRIPTION = "Bondi's markets — the Saturday Bondi Farmers Market and the Sunday Bondi Markets on Campbell Parade. Days, times and what to expect at each.";

export const revalidate = 1800;
export function generateMetadata(): Metadata {
  return { title: TITLE, description: DESCRIPTION, alternates: { canonical: '/whats-on/markets' }, robots: isProduction() ? undefined : { index: false, follow: true }, openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' } };
}
export default function Page() {
  const today = sydneyToday();
  const events = upcomingEvents(today).filter((r) => r.event.categories.includes('markets'));
  return <WhatsOnLandingView slug="markets" h1={TITLE} kicker="What's On · Markets" intro="Bondi's weekend markets are a local institution — fresh produce and food on Saturday, fashion, art and design on Sunday, both by the beach on Campbell Parade." events={events} emptyLead="Market listings are being updated." />;
}
