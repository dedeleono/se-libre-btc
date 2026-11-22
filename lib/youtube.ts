const WATCH_HOSTS = new Set(["www.youtube.com", "youtube.com"]);

export function parseYouTubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
  if (WATCH_HOSTS.has(url.hostname)) return url.searchParams.get("v") || null;
  return null;
}
