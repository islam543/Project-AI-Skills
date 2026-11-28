// Four more scenes, each with a hover trail (kit's hoverField):
// Topographic: black and white contour lines that drift and fold into each other, softly blurred; a shader plays it
// live. It has no hover: the lines move by themselves.
// Dot Wave: rows of white dots rolling like a wave out of the dark.
// Dither Gallery: dithered dot art of a moon, a ringed planet, butterflies and flowers, with fire in the corners.
// Neon Rain: an original rainy neon city at night.
import { anim, between, blur, f2, frame, glow, H, hoverField, moving, pick, r1, rng, vertical, W } from './kit'
import type { Painted } from './kit'

// ---------- Topographic ----------

type Field = (x: number, y: number, t: number) => number

/** Moving hills and pits: blobs on looping paths over a slow wave, so contours meet, merge and split as t runs 0 to 1. */
function topoField(rand: () => number): Field {
  const TAU = Math.PI * 2
  const blobs = Array.from({ length: 8 }, () => ({
    ax: between(rand, 200, 700),
    ay: between(rand, 150, 420),
    fx: pick(rand, [1, 2, -1, -2]),
    fy: pick(rand, [1, -1, 2, 3]),
    px: rand() * TAU,
    py: rand() * TAU,
    s: between(rand, -1, 1.2),
    r: between(rand, 150, 330),
  }))

  return (x, y, t) => {
    let v = 0.35 * Math.sin(x * 0.0045 + t * TAU) * Math.cos(y * 0.006 - t * TAU)

    for (const b of blobs) {
      const cx = W / 2 + b.ax * Math.sin(t * TAU * b.fx + b.px)
      const cy = H / 2 + b.ay * Math.cos(t * TAU * b.fy + b.py)
      v += b.s * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (b.r * b.r))
    }

    return v
  }
}

// Marching squares: for each corner pattern, the cell edges a contour crosses (0 top, 1 right, 2 bottom, 3 left).
const CASES: readonly (readonly [number, number])[][] = [
  [], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]],
  [[3, 0]], [[0, 2]], [[0, 1], [3, 2]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], [],
]

/** Contour lines of `f` at `t` for each level, chained into polylines: path data per level. */
function contours(f: Field, t: number, levels: readonly number[], step: number): string[] {
  const nx = Math.ceil(W / step) + 1
  const ny = Math.ceil(H / step) + 1
  const value: number[] = []

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      value.push(f(i * step, j * step, t))
    }
  }

  const at = (i: number, j: number): number => value[j * nx + i] ?? 0

  return levels.map(level => {
    // Each segment joins two cell edges; an edge's id is shared by the two cells on either side of it.
    const ends: [number, number][] = []
    const points = new Map<number, [number, number]>()
    const edge = (i: number, j: number, side: number): number => {
      if (side === 0) return (j * nx + i) * 2
      if (side === 2) return ((j + 1) * nx + i) * 2
      if (side === 3) return (j * nx + i) * 2 + 1

      return (j * nx + i + 1) * 2 + 1
    }
    const cross = (a: number, b: number): number => (level - a) / (b - a || 1e-9)

    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const tl = at(i, j)
        const tr = at(i + 1, j)
        const br = at(i + 1, j + 1)
        const bl = at(i, j + 1)
        const index = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0)

        for (const [s0, s1] of CASES[index] ?? []) {
          const ids = [s0, s1].map(side => {
            const id = edge(i, j, side)

            if (!points.has(id)) {
              const x = i * step
              const y = j * step
              const p: [number, number] =
                side === 0 ? [x + cross(tl, tr) * step, y]
                : side === 1 ? [x + step, y + cross(tr, br) * step]
                : side === 2 ? [x + cross(bl, br) * step, y + step]
                : [x, y + cross(tl, bl) * step]
              points.set(id, p)
            }

            return id
          })
          ends.push([ids[0] ?? 0, ids[1] ?? 0])
        }
      }
    }

    // Chain the segments into lines through their shared edges.
    const byEdge = new Map<number, number[]>()
    ends.forEach(([a, b], k) => {
      byEdge.set(a, [...(byEdge.get(a) ?? []), k])
      byEdge.set(b, [...(byEdge.get(b) ?? []), k])
    })
    const used = new Set<number>()
    let d = ''

    for (let k = 0; k < ends.length; k++) {
      if (used.has(k)) {
        continue
      }

      used.add(k)
      const [a, b] = ends[k] as [number, number]
      const line = [a, b]
      // Grow from the tail, then from the head.
      for (const grow of [true, false]) {
        for (;;) {
          const tip = grow ? (line[line.length - 1] as number) : (line[0] as number)
          const next = (byEdge.get(tip) ?? []).find(n => !used.has(n))

          if (next === undefined) {
            break
          }

          used.add(next)
          const [na, nb] = ends[next] as [number, number]
          const far = na === tip ? nb : na

          if (grow) {
            line.push(far)
          } else {
            line.unshift(far)
          }
        }
      }

      let [px, py] = points.get(line[0] as number) ?? [0, 0]
      d += `M${Math.round(px)} ${Math.round(py)}`

      for (const id of line.slice(1)) {
        const [x, y] = points.get(id) ?? [px, py]
        const dx = Math.round(x) - Math.round(px)
        const dy = Math.round(y) - Math.round(py)

        if (dx !== 0 || dy !== 0) {
          d += `l${dx} ${dy}`
          px = Math.round(x)
          py = Math.round(y)
        }
      }
    }

    return d
  })
}

const TOPO_CSS =
  '@keyframes f0{0%,100%{opacity:1}25%,75%{opacity:0}}' +
  '@keyframes f1{0%,50%,100%{opacity:0}25%,75%{opacity:1}}' +
  '@keyframes f2{0%,25%,75%,100%{opacity:0}50%{opacity:1}}' +
  '@keyframes topodrift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,22px) scale(1.06)}}' +
  '.minor{fill:none;stroke:#cfcfcf;stroke-width:1.2;opacity:.6}.major{fill:none;stroke:#ffffff;stroke-width:2.2;opacity:.95}'

function topoSvg(still: boolean): string {
  const rand = rng(7)
  const a = moving(still)
  const f = topoField(rand)
  const levels = Array.from({ length: 19 }, (_, k) => -0.9 + k * 0.115)
  // Three nearby moments, cross-faded slowly back and forth, so the lines seem to slide and merge.
  const frames = (still ? [0] : [0, 0.035, 0.07]).map((t, k) => {
    const paths = contours(f, t, levels, 20)
    const minor = paths.filter((_, n) => n % 4 !== 0).join('')
    const major = paths.filter((_, n) => n % 4 === 0).join('')
    const rest = k === 0 ? '' : ' opacity="0"'

    return `<g${rest}${a(`f${k}`, 12, 0, 'ease-in-out')}><path class="minor" d="${minor}"/><path class="major" d="${major}"/></g>`
  })
  const body = `<rect width="${W}" height="${H}" fill="#000"/><g filter="url(#soften)"><g${a('topodrift', 40, 0)}>${frames.join('')}</g></g>`

  return frame(blur('soften', 1.1), TOPO_CSS, body)
}

export const topo: Painted = { scene: () => topoSvg(false), thumb: () => topoSvg(true) }

// ---------- Dot Wave ----------

const WAVE_CSS =
  '@keyframes swell{0%,100%{transform:translateY(-16px)}50%{transform:translateY(16px)}}' +
  '@keyframes flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-56px}}'

function dotWaveSvg(still: boolean): string {
  const a = moving(still)
  const hover = hoverField(still)
  const defs =
    '<linearGradient id="edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1600" y2="0">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset=".33" stop-color="#fff" stop-opacity=".28"/>' +
    '<stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset=".67" stop-color="#fff" stop-opacity=".28"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>' +
    `<g id="mk" fill="#ffffff">${Array.from({ length: 10 }, (_, k) => `<circle cx="${r1(22 * Math.cos(k * 0.628))}" cy="${r1(22 * Math.sin(k * 0.628))}" r="2.2"/>`).join('')}<circle r="3"/></g>`
  let rows = ''

  for (let r = 0; r < 26; r++) {
    let d = ''

    for (let x = -60; x <= W + 60; x += 40) {
      const side = Math.abs(x - W / 2) / (W / 2)
      const y = 330 + r * 19 - Math.pow(side, 1.3) * 230 + 60 * Math.sin(x / 230 + r * 0.22)
      d += `${d === '' ? 'M' : 'L'}${r1(x)} ${r1(y)}`
    }

    const width = r1(2 + (r % 3) * 0.7)
    const opacity = f2(Math.max(0.15, 1 - r * 0.032))
    const row = `<path d="${d}" fill="none" stroke="url(#edge)" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="0 14" opacity="${opacity}"${a('flow', 3 + (r % 4) * 0.4, 0, 'linear')}/>`
    rows += `<g${a('swell', 5.2, -r * 0.18)}>${row}</g>`
  }

  return frame(defs, WAVE_CSS + hover.css, `<rect width="${W}" height="${H}" fill="#000"/>${rows}${hover.body}`)
}

export const dotWave: Painted = { scene: () => dotWaveSvg(false), thumb: () => dotWaveSvg(true) }

// ---------- Dither Gallery ----------

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16)

/** Shade from 0 (dark) to 1 (lit) at (u, v), each -1 to 1 across the piece. */
type Shade = (u: number, v: number) => number

/** Ordered dithering: a square dot wherever the shade beats the Bayer threshold. Path data, one move per dot. */
function dither(shade: Shade, ox: number, oy: number, size: number, step: number): string {
  const n = Math.round(size / step)
  let d = ''

  for (let j = 0; j < n; j++) {
    let last = -1

    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1
      const v = (j / (n - 1)) * 2 - 1

      if (shade(u, v) > (BAYER[(j % 4) * 4 + (i % 4)] ?? 0.5)) {
        d += last < 0 ? `M${r1(ox + i * step)} ${r1(oy + j * step)}h0` : `m${r1((i - last) * step)} 0h0`
        last = i
      }
    }
  }

  return d
}

const sphere = (u: number, v: number, lx: number, ly: number, lz: number): number => {
  const r2 = u * u + v * v

  if (r2 > 1) {
    return 0
  }

  const nz = Math.sqrt(1 - r2)

  return Math.max(0, u * lx + v * ly + nz * lz)
}

const moonShade: Shade = (u, v) => {
  const lit = sphere(u, v, 0.86, -0.22, 0.45) * 1.15
  const craters = [[0.2, -0.3, 0.16], [0.45, 0.2, 0.12], [0.1, 0.45, 0.09]].some(([cu, cv, cr]) => (u - (cu ?? 0)) ** 2 + (v - (cv ?? 0)) ** 2 < (cr ?? 0) ** 2)

  return craters ? lit * 0.55 : lit
}

const planetShade: Shade = (u, v) => {
  const ru = u * Math.cos(0.26) + v * Math.sin(0.26)
  const rv = -u * Math.sin(0.26) + v * Math.cos(0.26)
  const ring = Math.sqrt((ru / 0.98) ** 2 + (rv / 0.24) ** 2)
  const onRing = ring > 0.74 && ring < 0.98
  const body = sphere(u / 0.56, v / 0.56, 0.6, -0.5, 0.6)
  const inBody = u * u + v * v < 0.56 * 0.56

  if (onRing && (rv > 0 || !inBody)) {
    return 0.62 + 0.25 * Math.cos(ring * 40)
  }

  return inBody ? body * (0.85 + 0.15 * Math.sin(v * 22)) : 0
}

const wingShade: Shade = (u, v) => {
  if (Math.abs(u) < 0.045 && Math.abs(v) < 0.6) {
    return 1
  }

  const wings: readonly [number, number, number, number][] = [
    [0.46, -0.26, 0.44, 0.36],
    [0.36, 0.36, 0.3, 0.3],
  ]

  for (const [cu, cv, ru, rv] of wings) {
    const du = (Math.abs(u) - cu) / ru
    const dv = (v - cv) / rv
    const dist = du * du + dv * dv

    if (dist < 1) {
      const spot = (Math.abs(u) - cu * 1.15) ** 2 + (v - cv) ** 2 < 0.01

      return spot ? 0.15 : 0.95 - dist * 0.65
    }
  }

  return 0
}

const flowerShade: Shade = (u, v) => {
  const fv = v + 0.3
  const r = Math.sqrt(u * u + fv * fv)
  // Five round petals: the radius swells between them instead of spiking.
  const petal = 0.36 + 0.16 * Math.abs(Math.cos(2.5 * Math.atan2(fv, u)))

  if (r < 0.13) {
    return 0.35
  }

  if (r < petal) {
    return 1 - (r / petal) * 0.45
  }

  const leaf = ((u - 0.16) / 0.14) ** 2 + ((v - 0.55) / 0.07) ** 2 < 1

  return (Math.abs(u) < 0.04 && v > 0.15) || leaf ? 0.75 : 0
}

/** Fire rising from the bottom corners, one flicker frame per phase. */
function fireShade(phase: number, flip: boolean): Shade {
  return (u, v) => {
    const x = flip ? -u : u
    const h = 0.25 + 0.55 * (1 - (x + 1) / 2) + 0.18 * Math.sin(x * 9 + phase * 2.1) + 0.12 * Math.sin(x * 17 - phase * 3.3)
    const up = (1 - v) / 2

    return up < h ? Math.min(1, 1.5 * (1 - up / h) * (0.8 + 0.2 * Math.sin(x * 31 + v * 13 + phase * 5))) : 0
  }
}

const GALLERY_CSS =
  '@keyframes tw{0%,100%{opacity:.2}50%{opacity:1}}' +
  '@keyframes flutter{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.55)}}' +
  '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}' +
  '@keyframes c0{0%,30%,100%{opacity:1}33%,97%{opacity:0}}' +
  '@keyframes c1{0%,30%,64%,100%{opacity:0}33%,61%{opacity:1}}' +
  '@keyframes c2{0%,61%{opacity:0}64%,97%{opacity:1}100%{opacity:0}}' +
  '.wing{transform-box:fill-box;transform-origin:50% 50%}' +
  '.dots{fill:none;stroke:#e8e8e8;stroke-linecap:square}'

function ditherSvg(still: boolean): string {
  const rand = rng(211)
  const a = moving(still)
  const hover = hoverField(still)
  const mark = `<g id="mk" fill="#ffffff">${Array.from({ length: 12 }, (_, k) => `<rect x="${r1(26 * Math.cos(k * 0.5236) - 1.5)}" y="${r1(26 * Math.sin(k * 0.5236) - 1.5)}" width="3" height="3"/>`).join('')}${Array.from({ length: 6 }, (_, k) => `<rect x="${r1(12 * Math.cos(k * 1.047) - 1.5)}" y="${r1(12 * Math.sin(k * 1.047) - 1.5)}" width="3" height="3"/>`).join('')}</g>`
  const piece = (shade: Shade, x: number, y: number, size: number, step = 5): string =>
    `<path class="dots" d="${dither(shade, x, y, size, step)}" stroke-width="${r1(step * 0.62)}"/>`
  const body: string[] = [`<rect width="${W}" height="${H}" fill="#000"/>`]

  // Stars in the side columns only; the middle stays clear for the conversation.
  for (let i = 0; i < 60; i++) {
    const x = i % 2 === 0 ? between(rand, 10, 380) : between(rand, 1220, 1590)
    const star = `<rect x="${r1(x)}" y="${r1(between(rand, 10, 760))}" width="2.5" height="2.5" fill="#ffffff"/>`
    body.push(i % 3 === 0 ? `<g${a('tw', between(rand, 2, 5), -between(rand, 0, 5))}>${star}</g>` : star)
  }

  body.push(`<g${a('bob', 9, 0)}>${piece(moonShade, 70, 60, 230)}</g>`)
  body.push(`<g class="wing"${a('flutter', 0.7, 0)}>${piece(wingShade, 250, 400, 120, 4)}</g>`)
  body.push(piece(flowerShade, 60, 520, 230))
  body.push(`<g class="wing"${a('flutter', 0.6, -0.3)}>${piece(wingShade, 1300, 70, 170, 4)}</g>`)
  body.push(`<g${a('bob', 11, -4)}>${piece(planetShade, 1290, 300, 270)}</g>`)
  body.push(piece(flowerShade, 1380, 600, 160, 4))

  // Small flowers along the foot, and fire in both corners.
  for (let x = 420; x < 1200; x += between(rand, 60, 110)) {
    body.push(piece(flowerShade, x, 930, 46, 3))
  }

  const fires = (still ? [0] : [0, 1, 2]).map((phase, k) => {
    const corners = piece(fireShade(phase, false), -20, 760, 380, 6) + piece(fireShade(phase, true), 1240, 760, 380, 6)

    return `<g${k === 0 ? '' : ' opacity="0"'}${a(`c${k}`, 0.9, 0, 'linear')}>${corners}</g>`
  })
  body.push(fires.join(''))
  body.push(hover.body)

  return frame(mark, GALLERY_CSS + hover.css, body.join(''))
}

export const ditherGallery: Painted = { scene: () => ditherSvg(false), thumb: () => ditherSvg(true) }

// ---------- Neon Rain ----------

const NEON = { pink: '#ff3d8b', cyan: '#2de2e6', amber: '#ff9f1c' }

const NEON_CSS =
  '@keyframes fall{from{transform:translate(0,-240px)}to{transform:translate(-36px,0)}}' +
  '@keyframes buzz{0%,100%{opacity:1}6%{opacity:.4}8%{opacity:1}52%{opacity:.85}54%{opacity:.3}56%{opacity:1}}' +
  '@keyframes glowp{0%,100%{opacity:.55}50%{opacity:.9}}' +
  '@keyframes cross{from{transform:translateX(-200px)}to{transform:translateX(1800px)}}' +
  '@keyframes shimmer{0%,100%{opacity:.35}50%{opacity:.7}}'

/** A block of towers: dark faces with a grid of windows, a few lit. */
function towers(rand: () => number, count: number, x0: number, x1: number, low: number, high: number, base: number, face: string, lit: number): string {
  let faces = ''
  let windows = ''
  let warm = ''

  for (let k = 0; k < count; k++) {
    const w = between(rand, 60, 140)
    const x = between(rand, x0, x1 - w)
    const top = base - between(rand, low, high)
    faces += `<rect x="${r1(x)}" y="${r1(top)}" width="${r1(w)}" height="${r1(base - top)}"/>`

    for (let y = top + 14; y < base - 10; y += 16) {
      for (let wx = x + 8; wx < x + w - 8; wx += 12) {
        const roll = rand()

        if (roll < lit) {
          const cell = `M${r1(wx)} ${r1(y)}h4v6h-4z`

          if (roll < lit * 0.35) {
            warm += cell
          } else {
            windows += cell
          }
        }
      }
    }
  }

  return `<g fill="${face}">${faces}</g><path d="${windows}" fill="#6fd3e6" opacity=".55"/><path d="${warm}" fill="#ffb347" opacity=".7"/>`
}

function sign(x: number, y: number, w: number, h: number, color: string, flicker: string): string {
  const bars = Array.from({ length: Math.max(2, Math.floor((w > h ? w : h) / 26)) }, (_, k) =>
    w > h
      ? `<rect x="${r1(x + 10 + k * 26)}" y="${r1(y + h * 0.3)}" width="16" height="${r1(h * 0.4)}" rx="2"/>`
      : `<rect x="${r1(x + w * 0.3)}" y="${r1(y + 10 + k * 26)}" width="${r1(w * 0.4)}" height="16" rx="2"/>`,
  ).join('')

  return (
    `<g${flicker}><rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="${color}" opacity=".45" filter="url(#neonglow)"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#0a0d14" stroke="${color}" stroke-width="3"/><g fill="${color}" opacity=".9">${bars}</g></g>`
  )
}

function neonSvg(still: boolean): string {
  const rand = rng(331)
  const a = moving(still)
  const hover = hoverField(still)
  const rainPattern = (id: string, w: number, h: number, n: number, color: string, width: number): string => {
    let lines = ''

    for (let k = 0; k < n; k++) {
      const x = between(rand, 0, w)
      const y = between(rand, 0, h)
      const len = between(rand, 18, 42)
      lines += `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x - len * 0.15)}" y2="${r1(y + len)}"/>`
    }

    return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><g stroke="${color}" stroke-width="${width}" stroke-linecap="round">${lines}</g></pattern>`
  }
  const defs =
    vertical('sky', [[0, '#04060c'], [0.55, '#0b1324'], [1, '#140b18']]) +
    vertical('street', [[0, '#0a0e18'], [1, '#05060a']]) +
    rainPattern('rainA', 180, 240, 7, '#9fb4d6', 1.1) +
    rainPattern('rainB', 120, 240, 9, '#c7d6ee', 0.8) +
    glow('haze1', NEON.cyan, 0.32) +
    glow('haze2', NEON.amber, 0.3) +
    glow('haze3', NEON.pink, 0.28) +
    blur('neonglow', 10) +
    blur('fogf', 30) +
    blur('wet', 6) +
    `<g id="mk" fill="none" stroke-width="1.6"><ellipse rx="30" ry="9" stroke="${NEON.cyan}"/><ellipse rx="18" ry="5" stroke="${NEON.pink}"/><ellipse rx="42" ry="13" stroke="${NEON.cyan}" opacity=".4"/></g>`
  const body: string[] = [`<rect width="${W}" height="${H}" fill="url(#sky)"/>`]

  body.push(towers(rand, 30, 200, 1400, 220, 480, 790, '#0d1526', 0.06))
  body.push(`<circle cx="430" cy="560" r="260" fill="url(#haze1)"/><circle cx="1150" cy="600" r="240" fill="url(#haze2)"/><circle cx="800" cy="420" r="300" fill="url(#haze3)"/>`)
  body.push(`<ellipse cx="800" cy="640" rx="760" ry="120" fill="#1a2a40" opacity=".5" filter="url(#fogf)"/>`)
  body.push(towers(rand, 14, 180, 1420, 300, 640, 860, '#090e19', 0.1))

  // Flying lights crossing high up.
  for (let k = 0; k < 4; k++) {
    const y = between(rand, 140, 380)
    const car = `<circle cx="0" cy="${r1(y)}" r="2.6" fill="#ff5b5b"/><circle cx="10" cy="${r1(y)}" r="2" fill="#ffffff"/><circle cx="5" cy="${r1(y)}" r="14" fill="#ff5b5b" opacity=".25" filter="url(#wet)"/>`
    body.push(`<g${a('cross', between(rand, 18, 34), -between(rand, 0, 30), 'linear')}>${car}</g>`)
  }

  // Tall towers framing both sides, with signs.
  body.push(towers(rand, 3, 0, 300, 700, 980, 1000, '#060a12', 0.14))
  body.push(towers(rand, 3, 1300, 1600, 700, 980, 1000, '#060a12', 0.14))
  body.push(sign(150, 640, 120, 58, NEON.amber, a('buzz', 7, -1)))
  body.push(sign(1450, 240, 44, 210, NEON.cyan, a('buzz', 9, -3)))
  body.push(sign(60, 300, 40, 160, NEON.pink, a('glowp', 4, 0)))
  body.push(sign(1330, 560, 110, 46, NEON.pink, a('buzz', 11, -6)))

  // Wet street: blurred reflections of the signs, shimmering.
  body.push(`<rect y="900" width="${W}" height="100" fill="url(#street)"/>`)

  for (const [x, color] of [[210, NEON.amber], [1472, NEON.cyan], [80, NEON.pink], [1385, NEON.pink], [430, NEON.cyan], [1150, NEON.amber]] as const) {
    body.push(`<g${a('shimmer', between(rand, 2, 4), -between(rand, 0, 4))}><rect x="${x - 14}" y="905" width="28" height="95" fill="${color}" opacity=".5" filter="url(#wet)"/></g>`)
  }

  // Rain in two sheets, falling at different speeds.
  if (!still) {
    body.push(`<g opacity=".35"${a('fall', 0.9, 0, 'linear')}><rect x="-60" y="0" width="${W + 120}" height="${H + 240}" fill="url(#rainA)"/></g>`)
    body.push(`<g opacity=".22"${a('fall', 0.6, -0.2, 'linear')}><rect x="-60" y="0" width="${W + 120}" height="${H + 240}" fill="url(#rainB)"/></g>`)
  }

  body.push(hover.body)

  return frame(defs, NEON_CSS + hover.css, body.join(''))
}

export const neonRain: Painted = { scene: () => neonSvg(false), thumb: () => neonSvg(true) }

// ---------- Pixel Nebula ----------
// A violet galaxy band across a black sky, drawn as a grid of small square pixels, with twinkling stars. Hover leaves
// a trail of bright pixels.

/** How bright the nebula is at (x, y): a diagonal band with cloudy texture and dark dust lanes, 0 to about 1. */
function nebula(x: number, y: number): number {
  // The band runs from the top right down toward the lower left.
  const ax = W * 1.05
  const ay = -H * 0.08
  const bx = -W * 0.05
  const by = H * 0.92
  const len = Math.hypot(bx - ax, by - ay)
  const d = Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / len
  const band = Math.exp(-((d / 200) ** 2))
  const cloud = 0.5 + 0.24 * Math.sin(x * 0.011 + Math.sin(y * 0.007) * 2) + 0.16 * Math.sin((x + y) * 0.019 + 1.3) + 0.1 * Math.sin(x * 0.031 - y * 0.027)
  const lane = 1 - 0.4 * Math.exp(-(((d - 60) / 30) ** 2)) * (0.6 + 0.4 * Math.sin(x * 0.017 + 0.6))
  const core = 0.55 * Math.exp(-(((x - W * 0.8) / 240) ** 2) - (((y - H * 0.18) / 170) ** 2))

  return Math.max(0, band * cloud * lane * 1.15 + core * band)
}

const NEBULA_SHADES: readonly (readonly [number, string])[] = [
  [0.1, '#1a1440'],
  [0.2, '#2a2063'],
  [0.32, '#40308c'],
  [0.46, '#5c45b3'],
  [0.6, '#8363d4'],
  [0.74, '#ad8ceb'],
  [0.88, '#dcc6ff'],
]

const NEBULA_CSS =
  '@keyframes neb{0%,100%{transform:translate(0,0)}50%{transform:translate(-26px,14px)}}' +
  '@keyframes pz{0%,100%{opacity:1}50%{opacity:.5}}' +
  '@keyframes tw{0%,100%{opacity:.2}50%{opacity:1}}'

function nebulaSvg(still: boolean): string {
  const rand = rng(419)
  const a = moving(still)
  const hover = hoverField(still)
  // A still (the thumbnail) uses bigger pixels, so it stays small.
  const cell = still ? 20 : 11
  const size = still ? 13 : 7
  // One path per shade and twinkle phase; each pixel is a zero-length square-capped stroke, written as a relative move.
  const paths = new Map<string, { d: string; x: number; y: number }>()

  for (let y = cell / 2; y < H + cell; y += cell) {
    for (let x = cell / 2; x < W + cell; x += cell) {
      const v = nebula(x, y) * (0.85 + rand() * 0.3)

      // Toward the edges the pixels thin out instead of only dimming, so the band dissolves into the dark.
      if (rand() > Math.min(1, v * 3)) {
        continue
      }

      let shade = -1

      NEBULA_SHADES.forEach(([edge], k) => {
        if (v >= edge) {
          shade = k
        }
      })

      if (shade < 0) {
        continue
      }

      const key = `${shade}:${Math.floor(rand() * 3)}`
      const path = paths.get(key)

      if (path === undefined) {
        paths.set(key, { d: `M${x} ${y}h0`, x, y })
      } else {
        path.d += `m${x - path.x} ${y - path.y}h0`
        path.x = x
        path.y = y
      }
    }
  }

  let pixels = ''

  for (const [key, path] of paths) {
    const [shade, phase] = key.split(':').map(Number) as [number, number]
    const color = NEBULA_SHADES[shade]?.[1] ?? '#ffffff'
    const line = `<path d="${path.d}" stroke="${color}" stroke-width="${size}" stroke-linecap="square" fill="none"/>`
    pixels += phase === 0 ? line : `<g${a('pz', 5 + phase * 2.5, -phase * 1.7)}>${line}</g>`
  }

  let stars = ''

  for (let i = 0; i < 70; i++) {
    const x = Math.round(between(rand, 0, W) / cell) * cell + cell / 2
    const y = Math.round(between(rand, 0, H) / cell) * cell + cell / 2
    const s = pick(rand, [3, 3, 4, 5])
    const star = `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" fill="#ffffff"/>`
    stars += i % 3 === 0 ? `<g${a('tw', between(rand, 2, 6), -between(rand, 0, 6))}>${star}</g>` : star
  }

  // A few bright stars drawn as a pixel cross.
  for (let i = 0; i < 9; i++) {
    const x = Math.round(between(rand, 40, W - 40) / cell) * cell + cell / 2
    const y = Math.round(between(rand, 40, H - 40) / cell) * cell + cell / 2
    const cross = `<path d="M${x} ${y}h0m${cell} 0h0m${-2 * cell} 0h0m${cell} ${cell}h0m0 ${-2 * cell}h0" stroke="#f2eaff" stroke-width="${size * 0.7}" stroke-linecap="square"/>`
    stars += `<g${a('tw', between(rand, 3, 7), -between(rand, 0, 7))}>${cross}</g>`
  }

  const mark = `<g id="mk" fill="#e6d8ff">${[[0, 0], [11, 0], [-11, 0], [0, 11], [0, -11], [11, 11], [-11, -11], [22, 0], [-22, 0], [0, 22], [0, -22]]
    .map(([dx, dy]) => `<rect x="${(dx ?? 0) - 3.5}" y="${(dy ?? 0) - 3.5}" width="7" height="7"/>`)
    .join('')}</g>`
  const body = `<rect width="${W}" height="${H}" fill="#05040b"/><g${a('neb', 60, 0)}>${pixels}${stars}</g>${hover.body}`

  return frame(mark, NEBULA_CSS + hover.css, body)
}

export const pixelNebula: Painted = { scene: () => nebulaSvg(false), thumb: () => nebulaSvg(true) }
