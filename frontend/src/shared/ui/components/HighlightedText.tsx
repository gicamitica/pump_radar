import React from 'react';
import { splitHighlight } from '@/shared/lib/highlight';

export interface HighlightedTextProps {
  text: string;
  query: string;
  markClassName?: string;
}

export function HighlightedText({
  text,
  query,
  markClassName = 'bg-primary/20 text-foreground rounded px-0.5',
}: HighlightedTextProps) {
  const parts = splitHighlight(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} className={markClassName}>
            {p.part}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.part}</React.Fragment>
        )
      )}
    </>
  );
}

export default HighlightedText;
