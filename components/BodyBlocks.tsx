import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Block } from '@/lib/content';
import { QuickFacts, LocalTip, Callout, Faq, ItineraryTimeline } from '@/components/blocks';

/**
 * Render inline Markdown-style links in body text: `[label](/internal-path)` becomes a
 * Next <Link> (internal, /-prefixed) and `[label](https://…)` an external anchor with
 * rel="nofollow noopener". Everything else passes through as plain text. Lets authored
 * bodies carry real internal links for SEO without an HTML pipeline.
 */
const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g;

export function renderText(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  let i = 0;
  while ((m = LINK_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    if (href.startsWith('/')) {
      parts.push(<Link key={i++} href={href} className="text-ocean-700 underline hover:text-ocean-800">{label}</Link>);
    } else {
      parts.push(<a key={i++} href={href} target="_blank" rel="nofollow noopener" className="text-ocean-700 underline">{label}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 ? parts[0] : parts;
}

/**
 * Renders article content from safe structured blocks (no raw HTML).
 *
 * Crawled bodies use the text-bearing blocks (p/h2/h3/li/quote); authored
 * first-person bodies (content/bodies/*.json) additionally use the richer blocks
 * (list/localTip/callout/quickFacts/faq/itinerary), rendered via the editorial
 * components in components/blocks.tsx. Consecutive `li` blocks group into one <ul>.
 */
export function BodyBlocks({ blocks }: { blocks: Block[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key}>
          {list.map((t, i) => (
            <li key={i}>{renderText(t)}</li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  blocks.forEach((b, i) => {
    if (b.type === 'li') {
      list.push(b.text);
      return;
    }
    flush(`ul-${i}`);
    switch (b.type) {
      case 'h2':
        out.push(<h2 key={i}>{b.text}</h2>);
        break;
      case 'h3':
        out.push(<h3 key={i}>{b.text}</h3>);
        break;
      case 'quote':
        out.push(
          <blockquote key={i} className="border-l-4 border-ocean-500 pl-4 italic text-ink-700">
            {b.text}
          </blockquote>
        );
        break;
      case 'list':
        out.push(
          <ul key={i}>
            {b.items.map((t, j) => (
              <li key={j}>{renderText(t)}</li>
            ))}
          </ul>
        );
        break;
      case 'localTip':
        out.push(<LocalTip key={i}>{b.text}</LocalTip>);
        break;
      case 'callout':
        out.push(
          <Callout key={i} tone={b.tone} title={b.title}>
            {b.text}
          </Callout>
        );
        break;
      case 'quickFacts':
        out.push(<QuickFacts key={i} items={b.items} />);
        break;
      case 'faq':
        out.push(<Faq key={i} items={b.items} />);
        break;
      case 'itinerary':
        out.push(<ItineraryTimeline key={i} stops={b.stops} />);
        break;
      default:
        out.push(<p key={i}>{renderText(b.text)}</p>);
    }
  });
  flush('ul-end');
  return <div className="prose-editorial mt-6">{out}</div>;
}
