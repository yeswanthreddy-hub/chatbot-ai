export function makeTitle(text) {
  const line = text
    .split('\n')
    .map((l) => l.replace(/^#{1,6}\s*/, '').replace(/[*_`~]/g, ''))
    .map((l) => l.trim())
    .find(Boolean)
  const title = line || text
  return title.length > 34 ? `${title.slice(0, 34)}…` : title
}