// Small helpers every scene shares: a seeded random source, rounding, glows and inline animations.

/** A seeded random source, so a scene draws the same every time. */
export function rng(seed: number): () => number {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)] as T
}

export function between(rand: () => number, lo: number, hi: number): number {
  return lo + rand() * (hi - lo)
}

export const r1 = (n: number): number => Math.round(n * 10) / 10
export const f2 = (n: number): string => n.toFixed(2)

/** A radial gradient that fades a color out from its middle. */
export function glow(id: string, color: string, strength: number, cx = '.5', cy = '.5', r = '.5'): string {
  return (
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${color}" stop-opacity="${strength}"/>` +
    `<stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`
  )
}

/** An inline CSS animation from keyframes the scene defines. */
export function anim(name: string, seconds: number, delay: number, timing = 'ease-in-out'): string {
  return ` style="animation:${name} ${r1(seconds)}s ${timing} ${r1(delay)}s infinite"`
}

// ---------- painted scenes ----------

export const W = 1600
export const H = 1000

/** A scene and its thumbnail, each one Svg document. */
export type Painted = { scene: () => string; thumb: () => string }

export function frame(defs: string, css: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<defs>${defs}</defs><style>${css}</style>${body}</svg>`
  )
}

export function blur(id: string, deviation: number): string {
  return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${deviation}"/></filter>`
}

export function vertical(id: string, stops: readonly (readonly [number, string, number?])[]): string {
  const parts = stops.map(([at, color, opacity]) => `<stop offset="${at}" stop-color="${color}"${opacity === undefined ? '' : ` stop-opacity="${opacity}"`}/>`)

  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${parts.join('')}</linearGradient>`
}

/** An animation, or nothing for a still (a thumbnail). */
export function moving(still: boolean): typeof anim {
  return still ? () => '' : anim
}

/**
 * Hover trails: invisible cells laid over the scene. Under the pointer a cell shows the mark `#mk` (defined by the
 * scene, drawn around 0,0), which then fades out slowly, so moving the cursor leaves a trail behind it. Works wherever
 * the window passes the pointer to the backdrop; a still (thumbnail) gets none.
 */
export function hoverField(still: boolean, cell = 80, fadeSeconds = 1.8): { css: string; body: string } {
  if (still) {
    return { css: '', body: '' }
  }

  const css =
    '.hv rect{fill:#000;fill-opacity:0}' +
    `.hv use{opacity:0;pointer-events:none;transform-box:fill-box;transform-origin:50% 50%;transform:scale(.55);transition:opacity ${fadeSeconds}s ease-out,transform ${fadeSeconds}s ease-out}` +
    '.hv:hover use{opacity:1;transform:scale(1);transition:opacity .08s,transform .35s ease-out}'
  let body = ''

  for (let y = 0; y < H; y += cell) {
    for (let x = 0; x < W; x += cell) {
      body += `<g class="hv"><rect x="${x}" y="${y}" width="${cell}" height="${cell}"/><use href="#mk" x="${x + cell / 2}" y="${y + cell / 2}"/></g>`
    }
  }

  return { css, body }
}
