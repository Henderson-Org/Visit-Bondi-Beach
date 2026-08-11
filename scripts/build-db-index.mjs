import { readFileSync, writeFileSync } from 'node:fs';
const active = JSON.parse(readFileSync('data/restaurants.json', 'utf8'));
const excluded = JSON.parse(readFileSync('data/restaurants-excluded.json', 'utf8'));

const hasPage = (r) => r.whyGo && r.whyGo.length > 40;
const venues = active.map((r) => ({
  name: r.name,
  former: r.formerName || null,
  url: hasPage(r) ? `/bondi-eat-and-drink/venues/${r.id}` : null,
  type: r.type,
  precinct: r.precinct,
  cuisines: r.cuisines.filter((c) => c && c !== '—').slice(0, 3),
}));

const closed = excluded.map((e) => ({ name: e.name, status: e.status, note: e.note || '' }));

const collections = [
  ['best-restaurants-bondi-beach', 'Best restaurants'],
  ['waterfront-dining-bondi-beach', 'Beachfront & ocean-view dining'],
  ['breakfast-brunch-bondi-beach', 'Best breakfast & brunch'],
  ['best-cafes-bondi-beach', 'Best cafés & coffee'],
  ['best-bars-bondi-beach', 'Best bars'],
  ['cheap-eats-bondi-beach', 'Best cheap eats'],
  ['family-friendly-bondi-beach', 'Family-friendly places to eat'],
  ['vegan-vegetarian-bondi-beach', 'Best vegan & vegetarian'],
  ['date-night-bondi-beach', 'Best date-night restaurants'],
  ['pubs-bondi-beach', 'Best pubs'],
  ['bakeries-sweets-bondi-beach', 'Best bakeries & sweets'],
].map(([slug, title]) => ({ slug, title, url: `/bondi-eat-and-drink/${slug}` }));

writeFileSync('/tmp/db-index.json', JSON.stringify({ hub: '/bondi-eat-and-drink', venues, closed, collections }, null, 2));
console.log(`db-index: ${venues.length} active (${venues.filter((v) => v.url).length} with pages), ${closed.length} closed, ${collections.length} collections`);
