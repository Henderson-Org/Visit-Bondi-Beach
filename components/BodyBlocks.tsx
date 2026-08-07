import type { Block } from '@/lib/content';

/**
 * Renders migrated article content from safe structured blocks (no raw HTML).
 * Consecutive list items are grouped into a single <ul>.
 */
export function BodyBlocks({ blocks }: { blocks: Block[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      out.push(
        <ul key={key}>
          {list.map((t, i) => (
            <li key={i}>{t}</li>
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
    if (b.type === 'h2') out.push(<h2 key={i}>{b.text}</h2>);
    else if (b.type === 'h3') out.push(<h3 key={i}>{b.text}</h3>);
    else if (b.type === 'quote')
      out.push(
        <blockquote key={i} className="border-l-4 border-ocean-500 pl-4 italic text-ink-700">
          {b.text}
        </blockquote>
      );
    else out.push(<p key={i}>{b.text}</p>);
  });
  flush('ul-end');
  return <div className="prose-editorial mt-6">{out}</div>;
}
