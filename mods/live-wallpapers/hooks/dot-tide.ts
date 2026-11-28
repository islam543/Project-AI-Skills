import { H, W, f2 } from './kit'

/**
 * Dot Tide: a field of dots under a slow, rolling surface on warm charcoal, the top rows of the field lit brighter, with
 * Claude's spark turning in the top right corner. The dots come from one pattern and the surface is one masked path, so
 * the scene stays small however many dots show. The dots take any colour (see TINTS); the spark keeps Claude's orange.
 */

/** The dot colours the box offers, the first the default (the grey of the picture it was drawn from). */
export const TINTS = [
  { id: 'ash', label: 'Ash', color: '#8b857b' },
  { id: 'claude', label: 'Claude', color: '#d97757' },
  { id: 'sand', label: 'Sand', color: '#d8c39d' },
  { id: 'mint', label: 'Mint', color: '#78d3ad' },
  { id: 'ice', label: 'Ice', color: '#8cc4f2' },
  { id: 'rose', label: 'Rose', color: '#ec8fb0' },
  { id: 'violet', label: 'Violet', color: '#ab97f5' },
] as const

const GROUND = '#1f1c18'
const SPARK = '#d97757'
/** The dot grid's pitch: the hover cells are six of it wide, so their dots sit on the grid. */
const STEP = 14
/** One loop of the surface, as wide as the scene, so a slide of one period joins up with the start. */
const PERIOD = W

/** A colour mixed toward white by `amount` (0 to 1): the lit dots near the surface. */
function lighter(hex: string, amount: number): string {
  const channel = (at: number): string => {
    const value = parseInt(hex.slice(at, at + 2), 16)

    return Math.round(value + (255 - value) * amount)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${channel(1)}${channel(3)}${channel(5)}`
}

/** The surface's height at `x`: three waves in one period, which gives the long rise and the dip of the picture. */
function surfaceAt(x: number): number {
  const turn = (2 * Math.PI * x) / PERIOD

  return 470 + 44 * Math.sin(turn + 0.4) + 24 * Math.sin(2 * turn + 2.1) + 9 * Math.sin(3 * turn + 0.7)
}

/**
 * The surface's top over two periods and a margin each side, so sliding it left by one period loops without a seam and
 * neither end ever shows. `closed` runs it down to the bottom: the field; open, it is the rim alone.
 */
function surfacePath(step: number, closed: boolean): string {
  const from = -2 * step
  const to = 2 * PERIOD + 2 * step
  let d = ''

  for (let x = from; x <= to; x += step) {
    d += `${d === '' ? 'M' : 'L'}${x} ${f2(surfaceAt(x))}`
  }

  return closed ? `${d}L${to} ${H + 60}L${from} ${H + 60}Z` : d
}

/** Claude's spark: twelve rounded rays of uneven length round a small core, at the origin. */
function spark(): string {
  const lengths = [58, 47, 55, 44, 60, 49, 53, 45, 57, 48, 52, 46]
  let rays = ''

  lengths.forEach((length, i) => {
    const angle = ((i * 30 + (i % 2 === 0 ? 0 : 4)) * Math.PI) / 180
    rays += `<line x1="0" y1="0" x2="${f2(Math.cos(angle) * length)}" y2="${f2(Math.sin(angle) * length)}"/>`
  })

  return `<g stroke="${SPARK}" stroke-width="9" stroke-linecap="round">${rays}</g><circle r="11" fill="${SPARK}"/>`
}

/** The lit dots the pointer brings up: a six by six patch on the grid, brightest at its middle. */
function hoverPatch(color: string): string {
  let dots = ''

  for (const dy of [-35, -21, -7, 7, 21, 35]) {
    for (const dx of [-35, -21, -7, 7, 21, 35]) {
      const fall = 1 - Math.hypot(dx, dy) / 52
      if (fall > 0.05) {
        dots += `<circle cx="${dx}" cy="${dy}" r="2.3" fill-opacity="${f2(fall)}"/>`
      }
    }
  }

  return `<g id="dt-mark" fill="${color}">${dots}</g>`
}

/** Cells over the dot field that light a patch where the pointer passes; none on a still picture. */
function hoverCells(): string {
  const cell = STEP * 6
  let body = ''

  for (let y = cell * 5; y < H; y += cell) {
    for (let x = 0; x < W; x += cell) {
      body += `<g class="dt-hv"><rect x="${x}" y="${y}" width="${cell}" height="${cell}"/><use href="#dt-mark" x="${x + cell / 2}" y="${y + cell / 2}"/></g>`
    }
  }

  return body
}

/**
 * The scene in `color`. `still` is the preview: no motion, no pointer, a coarser surface. The view keeps the top right
 * corner in sight at any window shape, so the spark is never cut off.
 */
export function dotTide(color: string = TINTS[0].color, still = false): string {
  const lit = lighter(color, 0.45)
  // The preview is drawn some 14 times smaller: a coarser grid of bigger dots still reads as dots there.
  const pitch = still ? 44 : STEP
  const dot = (radius: number, fill: string, id: string): string =>
    `<pattern id="${id}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><circle cx="${pitch / 2}" cy="${pitch / 2}" r="${f2((radius * pitch) / STEP)}" fill="${fill}"/></pattern>`
  const step = still ? 64 : 16
  const defs =
    dot(1.7, color, 'dt-dots') +
    dot(2.3, lit, 'dt-lit') +
    `<linearGradient id="dt-deep" x1="0" y1="0" x2="0" y2="1"><stop offset=".38" stop-color="#fff"/><stop offset="1" stop-color="#8a8a8a"/></linearGradient>` +
    `<filter id="dt-soft" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>` +
    `<path id="dt-surface" d="${surfacePath(step, true)}"/>` +
    `<path id="dt-top" d="${surfacePath(step, false)}"/>` +
    // The field: everything under the surface, fading with depth. The rim: a soft band along the surface.
    `<mask id="dt-field" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><g class="dt-roll"><g class="dt-bob"><use href="#dt-surface" fill="url(#dt-deep)"/></g></g></mask>` +
    `<mask id="dt-rim" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><g class="dt-roll"><g class="dt-bob"><use href="#dt-top" fill="none" stroke="#fff" stroke-width="${still ? 120 : 58}" filter="url(#dt-soft)"/></g></g></mask>` +
    (still ? '' : hoverPatch(lit))
  const css = still
    ? ''
    : '.dt-roll{animation:dt-roll 38s linear infinite}' +
      '.dt-bob{animation:dt-bob 9s ease-in-out infinite alternate}' +
      '.dt-turn{animation:dt-turn 80s linear infinite}' +
      '.dt-grow{transition:transform .5s ease-out}.dt-star:hover .dt-grow{transform:scale(1.18)}' +
      '.dt-hv rect{fill:#000;fill-opacity:0}' +
      '.dt-hv use{opacity:0;pointer-events:none;transition:opacity 1.6s ease-out}' +
      '.dt-hv:hover use{opacity:1;transition:opacity .08s}' +
      `@keyframes dt-roll{to{transform:translateX(-${PERIOD}px)}}` +
      '@keyframes dt-bob{from{transform:translateY(-10px)}to{transform:translateY(14px)}}' +
      '@keyframes dt-turn{to{transform:rotate(360deg)}}' +
      '@media (prefers-reduced-motion:reduce){.dt-roll,.dt-bob,.dt-turn{animation:none}}'

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMin slice">` +
    `<defs>${defs}</defs><style>${css}</style>` +
    `<rect width="${W}" height="${H}" fill="${GROUND}"/>` +
    `<rect width="${W}" height="${H}" fill="url(#dt-dots)" mask="url(#dt-field)"/>` +
    `<g mask="url(#dt-field)"><rect width="${W}" height="${H}" fill="url(#dt-lit)" mask="url(#dt-rim)"/></g>` +
    (still ? '' : hoverCells()) +
    `<g class="dt-star" transform="translate(${W - 150} 140)"><circle r="80" fill="#000" fill-opacity="0"/><g class="dt-grow"><g class="dt-turn">${spark()}</g></g></g>` +
    '</svg>'
  )
}
