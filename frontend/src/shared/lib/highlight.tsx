export interface HighlightPart {
  part: string;
  match: boolean;
}

/** Split text into matched/unmatched parts, safely escaping the query. */
export function splitHighlight(text: string, query: string): HighlightPart[] {
  if (!query?.trim()) return [{ part: text, match: false }];
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${safe})`, 'gi');
  return text.split(regex).map((part) => ({
    part,
    match: regex.test(part),
  }));
}

/** Create an HTML string with <mark> tags for non-React consumers. */
export function highlightHtml(text: string, query: string): string {
  const parts = splitHighlight(text, query);
  return parts
    .map((p) =>
      p.match
        ? `<mark>${escapeHtml(p.part)}</mark>`
        : escapeHtml(p.part)
    )
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
