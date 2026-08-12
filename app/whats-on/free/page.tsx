import type { Metadata } from 'next';
import { WhatsOnLandingView } from '@/components/events/WhatsOnLandingView';
import { isProduction } from '@/lib/site';
import { upcomingEvents, sydneyToday } from '@/lib/events';

const TITLE = 'Free Events in Bondi';
const DESCRIPTION = "Free things on in Bondi Beach - the weekly markets, festivals and outdoor events you can enjoy without a ticket. A local guide to free Bondi events.";

export const revalidate = 1800;
export function generateMetadata(): Metadata {
  return { title: TITLE, description: DESCRIPTION, alternates: { canonical: '/whats-on/free' }, robots: isProduction() ? undefined : { index: false, follow: true }, openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' } };
}
export default function Page() {
  const today = sydneyToday();
  const events = upcomingEvents(today).filter((r) => r.event.priceType === 'free');
  return <WhatsOnLandingView slug="free" h1={TITLE} kicker="What's On · Free" intro="You don't need to spend a cent to enjoy Bondi. Here are the free events on now and coming up - from the weekend markets to Sculpture by the Sea." events={events} emptyLead="No free events listed right now." />;
}
