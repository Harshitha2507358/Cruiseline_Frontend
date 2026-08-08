// Local, deterministic "ocean" imagery using CSS gradients — no external URLs and
// no binary assets, so the app never depends on the network for imagery. Used as
// voyage-card / hero / detail backgrounds and as a fallback when no image exists.

const PALETTES = [
  ['#0a2342', '#1e5a8a'],
  ['#0d3b66', '#2a9d8f'],
  ['#12324f', '#3a7ca5'],
  ['#0a2342', '#4a6fa5'],
  ['#13293d', '#006494'],
  ['#1b3a4b', '#1e6091'],
]

function hash(str) {
  let h = 0
  const s = String(str ?? '')
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// A stable gradient for a voyage (keyed by name/port/id so it never flickers).
export function voyageGradient(seed) {
  const [a, b] = PALETTES[hash(seed) % PALETTES.length]
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`
}

export const HERO_GRADIENT = 'linear-gradient(120deg, #0a2342 0%, #1e5a8a 55%, #2a9d8f 100%)'

// A faint wavy SVG overlay (data URI) to add subtle texture over gradients.
export const WAVE_OVERLAY =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='200' viewBox='0 0 1200 200'%3E%3Cpath d='M0 120 C 200 60 400 180 600 120 C 800 60 1000 180 1200 120 L1200 200 L0 200 Z' fill='%23ffffff' fill-opacity='0.05'/%3E%3C/svg%3E\")"
