/** https URL to an iframe src; YouTube links become privacy-friendly embeds. Anything else: null. */
export function embedUrl(raw: string): string | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  const yt = u.hostname.endsWith('youtu.be') ? u.pathname.slice(1) : u.hostname.endsWith('youtube.com') ? u.searchParams.get('v') : null
  return yt ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}` : u.href
}
