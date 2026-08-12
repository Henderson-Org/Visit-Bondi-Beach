import type { Metadata } from 'next';
import { WhatsOnLandingView } from '@/components/events/WhatsOnLandingView';
import { isProduction } from '@/lib/site';
import { upcomingEvents, sydneyToday, passesDateFilter } from '@/lib/events';

const TITLE = "What's On in Bondi Today";
const DESCRIPTION = "What's on in Bondi Beach today - a live, date-aware list of events happening today, from markets to festivals. Updated for the current Sydney date.";

export const revalidate = 1800;
export function generateMetadata(): Metadata {
  return { title: TITLE, description: DESCRIPTION, alternates: { canonical: '/whats-on/today' }, robots: isProduction() ? undefined : { index: false, follow: true }, openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' } };
}
export default function Page() {
  const today = sydneyToday();
  const events = upcomingEvents(today).filter((r) => passesDateFilter(r.event, 'today', today));
  return <WhatsOnLandingView slug="today" h1={TITLE} kicker="What's On · Today" intro="Everything happening in Bondi today. This page always reads the current Sydney date." events={events} emptyLead="Nothing scheduled in Bondi for today just yet." />;
}
