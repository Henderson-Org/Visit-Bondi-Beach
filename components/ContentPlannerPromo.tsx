import { DayPlannerPromo } from '@/components/DayPlannerPromo';
import { plannerContextFor } from '@/lib/plannerContext';

/**
 * End-of-article Day Planner promo that pre-selects interests from the page's topic.
 * `context` is the page path + title; the mapper picks sensible interests + heading.
 */
export function ContentPlannerPromo({ context, placement = 'content-page' }: { context: string; placement?: string }) {
  const ctx = plannerContextFor(context);
  return <DayPlannerPromo variant="inline" placement={placement} interests={ctx.interests} heading={ctx.heading} />;
}
