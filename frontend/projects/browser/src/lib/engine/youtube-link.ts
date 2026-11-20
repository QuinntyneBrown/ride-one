// The video id of a YouTube link (L2-010 AC14).
export const MAX_LENGTH = 2048;

const LINK =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?([^#]*)|(?:shorts|embed)\/([A-Za-z0-9_-]{11}))|youtu\.be\/([A-Za-z0-9_-]{11}))(?:[?#].*)?$/i;
const ID = /^[A-Za-z0-9_-]{11}$/;

/** The id, or null when the link is not a YouTube video link. */
export function parseYouTubeId(url: string | null | undefined): string | null {
  if (!url || !url.trim() || url.length > MAX_LENGTH) return null;
  const match = LINK.exec(url.trim());
  if (!match) return null;
  const candidate = match[2] ?? match[3] ?? watchId(match[1] ?? '');
  return candidate !== null && ID.test(candidate) ? candidate : null;
}

function watchId(query: string): string | null {
  for (const pair of query.split('&')) {
    if (pair.startsWith('v=')) return pair.slice(2);
  }
  return null;
}
