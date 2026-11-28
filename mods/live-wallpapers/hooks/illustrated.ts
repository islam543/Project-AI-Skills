// The illustrated scenes: drawn in vector shapes, gradients and soft blurs, not in characters.
// Giant March: a lone wanderer on a cliff watches hundreds of original giants march through the steam.
// Aurora Cabin: northern lights over snowy peaks, a husky, and a cabin where someone works late.
// Every figure here is this mod's own design.
import { anim, between, blur, f2, frame, glow, H, moving, pick, r1, rng, vertical, W } from './kit'
import type { Painted } from './kit'

// ---------- shapes from parts ----------

/** One piece of a silhouette: a capsule (a circle when both ends meet) or a trapezoid. */
type Part =
  | { cap: readonly [number, number, number, number, number] }
  | { trap: readonly [number, number, number, number, number, number] }

function partsSvg(parts: readonly Part[]): string {
  return parts
    .map(part => {
      if ('cap' in part) {
        const [ax, ay, bx, by, radius] = part.cap

        return ax === bx && ay === by
          ? `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="${r1(radius)}"/>`
          : `<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(bx)}" y2="${r1(by)}" stroke-width="${r1(radius * 2)}"/>`
      }

      const [y0, y1, l0, rt0, l1, rt1] = part.trap

      return `<polygon points="${r1(l0)},${r1(y0)} ${r1(rt0)},${r1(y0)} ${r1(rt1)},${r1(y1)} ${r1(l1)},${r1(y1)}"/>`
    })
    .join('')
}

/** An original giant, facing out, mid-stride: `u` is a hundredth of its height; it is 60u wide. */
function giantParts(u: number, stride: number, heft: number): Part[] {
  const cx = 30 * u

  return [
    { cap: [cx, 7 * u, cx, 12 * u, 6.6 * u * heft] },
    { cap: [cx, 14 * u, cx, 19 * u, 4.4 * u] },
    { cap: [cx - 15 * u, 22 * u, cx - 15 * u, 22 * u, 6.8 * u * heft] },
    { cap: [cx + 15 * u, 22 * u, cx + 15 * u, 22 * u, 6.8 * u * heft] },
    { trap: [19 * u, 55 * u, cx - 18 * u * heft, cx + 18 * u * heft, cx - 11 * u, cx + 11 * u] },
    { cap: [cx - 20 * u, 24 * u, cx - 22 * u - stride * u, 62 * u, 4.8 * u] },
    { cap: [cx + 20 * u, 24 * u, cx + 22 * u + stride * u * 0.5, 61 * u, 4.8 * u] },
    { cap: [cx - 6 * u, 55 * u, cx - 7 * u - stride * u, 98 * u, 5.4 * u] },
    { cap: [cx + 6 * u, 55 * u, cx + 8 * u + stride * u, 97 * u, 5.4 * u] },
  ]
}

/** The wanderer, seen from behind: hair tied up at the back, a high collar, a long coat to the boots. 90s by 210s. */
function wandererParts(s: number): { coat: Part[]; rest: Part[] } {
  return {
    coat: [{ trap: [32 * s, 196 * s, 24 * s, 66 * s, 11 * s, 81 * s] }],
    rest: [
      { cap: [45 * s, 17 * s, 45 * s, 21 * s, 11.5 * s] },
      { cap: [45 * s, 0, 48 * s, 5 * s, 7.5 * s] },
      { cap: [48 * s, 6 * s, 53 * s, 30 * s, 3.6 * s] },
      { cap: [35 * s, 34 * s, 55 * s, 34 * s, 6.5 * s] },
      { cap: [26 * s, 40 * s, 19 * s, 118 * s, 6.5 * s] },
      { cap: [64 * s, 40 * s, 72 * s, 116 * s, 6.5 * s] },
      { cap: [38 * s, 190 * s, 37 * s, 208 * s, 4.4 * s] },
      { cap: [53 * s, 190 * s, 55 * s, 208 * s, 4.4 * s] },
    ],
  }
}

// ---------- Giant March ----------

const MARCH_CSS =
  '@keyframes stomp{0%,100%{transform:translateY(0)}20%{transform:translateY(-5px)}45%{transform:translateY(0)}}' +
  '@keyframes quake{0%,18%,100%{transform:translate(0,0)}3%{transform:translate(2px,-1px)}7%{transform:translate(-2px,1px)}11%{transform:translate(1px,0)}}' +
  '@keyframes march{from{transform:translateX(0)}to{transform:translateX(1600px)}}' +
  '@keyframes flap{0%,100%{transform:skewX(0deg)}50%{transform:skewX(-7deg)}}' +
  '@keyframes drift{0%,100%{transform:translateX(-40px)}50%{transform:translateX(40px)}}' +
  '@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}' +
  '@keyframes steam{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.45}100%{transform:translate(18px,-120px) scale(2.4);opacity:0}}' +
  '@keyframes ash{0%{transform:translate(0,0);opacity:0}10%{opacity:.8}100%{transform:translate(90px,-420px);opacity:0}}' +
  '.hem{transform-box:fill-box;transform-origin:50% 0}' +
  '.eye .eg{transform-box:fill-box;transform-origin:50% 50%;transition:transform .5s}' +
  '.rimg{transition:fill .4s,stroke .4s}' +
  '.gi:hover .eye{animation:none!important;opacity:1}' +
  '.gi:hover .eye .eg{transform:scale(2.4)}' +
  '.gi:hover .rimg,.wd:hover .rimg{fill:#ffffff;stroke:#ffffff}' +
  '.wd:hover .hem{animation-duration:1.1s!important}'

/** A horde: one line of the army, drawn as copies of a few giant shapes and marching on forever. */
type Horde = { count: number; height: number; feet: number; color: string; seconds: number; lines: number; soft: boolean }

const HORDES: readonly Horde[] = [
  { count: 130, height: 46, feet: 636, color: '#7c858f', seconds: 900, lines: 3, soft: true },
  { count: 64, height: 90, feet: 672, color: '#5c646e', seconds: 700, lines: 2, soft: true },
  { count: 26, height: 170, feet: 724, color: '#3d444d', seconds: 520, lines: 2, soft: false },
]

const LEDGE = 762

function marchSvg(still: boolean): string {
  const rand = rng(97)
  const a = moving(still)
  const shapes = [0, 1, 2].map(k =>
    `<symbol id="g${k}" viewBox="0 0 60 100"><g stroke-linecap="round">${partsSvg(giantParts(1, [-3, 1, 4][k] ?? 0, [0.95, 1.05, 1.12][k] ?? 1))}</g></symbol>`,
  )
  const defs =
    vertical('sky', [[0, '#151b23'], [0.4, '#323b47'], [0.62, '#7d8794'], [0.665, '#b9c0c7'], [0.7, '#6b737d'], [1, '#16191d']]) +
    vertical('haze', [[0, '#c9ced4', 0], [0.7, '#c9ced4', 0.35], [1, '#c9ced4', 0]]) +
    vertical('plain', [[0, '#4a5058'], [1, '#15181c']]) +
    vertical('cliff', [[0, '#1b1f24'], [1, '#0a0c0e']]) +
    glow('sun', '#f4f1e6', 0.5) +
    glow('eye', '#eef2f5', 0.75) +
    glow('vig', '#000000', 0, '.5', '.45', '.75').replace('stop-opacity="0"/></radialGradient>', 'stop-opacity=".55"/></radialGradient>') +
    blur('steamband', 26) +
    blur('soft', 1.5) +
    blur('steamf', 9) +
    shapes.join('')

  const sky = `<rect width="${W}" height="${H}" fill="url(#sky)"/><circle cx="1100" cy="380" r="300" fill="url(#sun)"/><circle cx="1100" cy="380" r="58" fill="#f4f1e6" opacity=".35" filter="url(#soft)"/>`
  const world: string[] = []

  // The steam of the army: a long band of cloud over the horizon, drifting.
  for (let i = 0; i < 12; i++) {
    const cloud = `<ellipse cx="${r1(between(rand, -100, W + 100))}" cy="${r1(between(rand, 430, 600))}" rx="${r1(between(rand, 180, 360))}" ry="${r1(between(rand, 50, 110))}" fill="${pick(rand, ['#d8dde3', '#c3c9d0', '#e6e9ec'])}" opacity="${f2(between(rand, 0.3, 0.55))}" filter="url(#steamband)"/>`
    world.push(`<g${a('drift', between(rand, 24, 44), -between(rand, 0, 30))}>${cloud}</g>`)
  }

  world.push('<path d="M0 640L140 630L300 636L460 624L640 634L820 626L1000 638L1180 628L1360 636L1520 626L1600 632V700H0Z" fill="#4a525c"/>')

  // Hundreds of giants in lines that fade into the haze. Each line is drawn twice, one screen apart, and marches one
  // screen per loop, so the army never ends.
  HORDES.forEach((horde, depth) => {
    const w = horde.height * 0.6
    const perLine = Math.ceil(horde.count / horde.lines)
    let lines = ''

    for (let line = 0; line < horde.lines; line++) {
      const feet = horde.feet - line * horde.height * 0.14
      let uses = ''

      for (let i = 0; i < perLine; i++) {
        const x = (i + between(rand, 0, 0.6)) * (W / perLine) - w / 2
        const h = horde.height * between(rand, 0.9, 1.08)
        const use = (at: number): string =>
          `<use href="#g${Math.floor(rand() * 3)}" x="${r1(at)}" y="${r1(feet - h)}" width="${r1(h * 0.6)}" height="${r1(h)}"/>`
        uses += use(x) + (still ? '' : use(x - W))
      }

      lines += `<g${a('stomp', 1.5 + line * 0.23 + depth * 0.1, -line * 0.6)}>${uses}</g>`
    }

    const soft = horde.soft ? ' filter="url(#soft)"' : ''
    world.push(`<g${a('march', horde.seconds, 0, 'linear')}><g fill="${horde.color}" stroke="${horde.color}"${soft}>${lines}</g></g>`)
    world.push(`<rect y="${horde.feet - horde.height * 1.4}" width="${W}" height="${r1(horde.height * 1.6)}" fill="url(#haze)" opacity="${f2(0.8 - depth * 0.2)}"/>`)
  })

  // The plain, then the giants close enough to see their eyes and their steam.
  world.push(`<rect y="728" width="${W}" height="${H - 728}" fill="url(#plain)"/>`)

  for (let i = 0; i < 26; i++) {
    const x = between(rand, 0, W)
    const y = between(rand, 750, 990)
    const s = between(rand, 4, 14) * (y / 800)
    world.push(`<polygon points="${r1(x - s)},${r1(y)} ${r1(x - s * 0.3)},${r1(y - s * 0.7)} ${r1(x + s * 0.6)},${r1(y - s * 0.5)} ${r1(x + s)},${r1(y)}" fill="#22262b"/>`)
  }

  const near = (u: number, x: number, top: number, body: string, rim: string): string => {
    const parts = giantParts(u, between(rand, -3, 4), between(rand, 0.92, 1.12))
    let giant =
      `<g class="rimg" fill="${rim}" stroke="${rim}" stroke-linecap="round" transform="translate(${r1(-u * 0.45)} ${r1(-u * 0.55)})">${partsSvg(parts)}</g>` +
      `<g fill="${body}" stroke="${body}" stroke-linecap="round">${partsSvg(parts)}</g>` +
      `<g class="eye"${a('pulse', between(rand, 2, 4), -between(rand, 0, 4))}>` +
      `<circle class="eg" cx="${r1(30 * u)}" cy="${r1(10 * u)}" r="${r1(7 * u)}" fill="url(#eye)"/>` +
      `<circle cx="${r1(27.6 * u)}" cy="${r1(10 * u)}" r="${r1(0.8 * u)}" fill="#f6f8fa"/><circle cx="${r1(32.4 * u)}" cy="${r1(10 * u)}" r="${r1(0.8 * u)}" fill="#f6f8fa"/></g>`

    if (!still) {
      for (const vent of [15, 45]) {
        const puff = `<circle cx="${r1(vent * u)}" cy="${r1(18 * u)}" r="${r1(5 * u)}" fill="#e6e9ec" filter="url(#steamf)"/>`
        giant += `<g transform="translate(${r1(vent * u)} ${r1(18 * u)}) scale(${f2(u / 3.4)}) translate(${r1(-vent * u)} ${r1(-18 * u)})"><g${a('steam', between(rand, 5, 8), -between(rand, 0, 8), 'ease-out')}>${puff}</g></g>`
      }
    }

    giant += `<ellipse cx="${r1(30 * u)}" cy="${r1(98 * u)}" rx="${r1(28 * u)}" ry="${r1(5 * u)}" fill="#8f969e" opacity=".35" filter="url(#steamf)"/>`

    return `<g class="gi" transform="translate(${r1(x)} ${r1(top)})"><rect width="${r1(60 * u)}" height="${r1(100 * u)}" fill="#000" fill-opacity="0"/>${giant}</g>`
  }

  // Six giants a line closer, marching like the rest.
  let closer = ''

  for (let i = 0; i < 6; i++) {
    const u = 3.3 * between(rand, 0.9, 1.08)
    const x = (i + between(rand, 0.1, 0.6)) * (W / 6) - 30 * u
    const one = (at: number): string => `<g${a('stomp', 1.7 + rand() * 0.3, -rand() * 2)}>${near(u, at, 800 - 100 * u, '#262b31', '#b8c0c9')}</g>`
    closer += one(x) + (still ? '' : one(x - W))
  }

  world.push(`<g${a('march', 440, 0, 'linear')}>${closer}</g>`)

  // Two giants right up close, crossing slowly.
  for (let i = 0; i < 2; i++) {
    const u = 6.6
    const x = 120 + i * 640
    const one = (at: number): string => `<g${a('stomp', 1.8, -i * 0.9)}>${near(u, at, 1085 - 100 * u, '#121519', '#cfd6de')}</g>`
    world.push(`<g${a('march', 380, -i * 190, 'linear')}>${one(x)}${still ? '' : one(x - W)}</g>`)
  }

  if (!still) {
    for (let i = 0; i < 30; i++) {
      const fleck = `<circle cx="${r1(between(rand, 0, W))}" cy="${r1(between(rand, 400, 1000))}" r="${r1(between(rand, 1, 2.6))}" fill="${pick(rand, ['#c9ced4', '#9aa1a9', '#e6e9ec'])}"/>`
      world.push(`<g${a('ash', between(rand, 12, 24), -between(rand, 0, 24), 'linear')}>${fleck}</g>`)
    }
  }

  // The cliff, its cold lit edge, and the wanderer on the ledge.
  world.push(`<path d="M1080 1000L1150 860L1190 800L1230 774L1260 ${LEDGE}L${W} ${LEDGE - 6}V${H}Z" fill="url(#cliff)"/>`)
  world.push(`<path d="M1150 860L1190 800L1230 774L1260 ${LEDGE}L${W} ${LEDGE - 6}" stroke="#9aa3ad" stroke-width="2" fill="none" opacity=".5"/>`)
  const s = 1.3
  const fig = wandererParts(s)
  const fx = 1350 - 45 * s
  const fy = LEDGE - 208 * s + 2
  const rimOf = (parts: readonly Part[]): string =>
    `<g class="rimg" fill="#cfd6de" stroke="#cfd6de" stroke-linecap="round" transform="translate(-2 -1.5)">${partsSvg(parts)}</g>`
  const darkOf = (parts: readonly Part[]): string => `<g fill="#07090b" stroke="#07090b" stroke-linecap="round">${partsSvg(parts)}</g>`
  world.push(
    `<g class="wd" transform="translate(${r1(fx)} ${r1(fy)})"><rect x="-10" y="-10" width="${r1(110 * s)}" height="${r1(225 * s)}" fill="#000" fill-opacity="0"/>` +
      `<g class="hem"${a('flap', 4.5, -1.2)}>${rimOf(fig.coat)}${darkOf(fig.coat)}</g>${rimOf(fig.rest)}${darkOf(fig.rest)}</g>`,
  )

  const body = `${sky}<g${a('quake', 1.7, 0, 'linear')}>${world.join('')}</g><rect width="${W}" height="${H}" fill="url(#vig)"/>`

  return frame(defs, MARCH_CSS, body)
}

export const march: Painted = { scene: () => marchSvg(false), thumb: () => marchSvg(true) }

// ---------- Aurora Cabin ----------

const AURORA_CSS =
  '@keyframes aur{0%,100%{transform:skewX(0deg) translateX(0)}50%{transform:skewX(-6deg) translateX(40px)}}' +
  '@keyframes breathe{0%,100%{opacity:.7}50%{opacity:1}}' +
  '@keyframes tw{0%,100%{opacity:.25}50%{opacity:1}}' +
  '@keyframes gust{0%,80%,100%{transform:rotate(0deg)}84%{transform:rotate(2.2deg)}88%{transform:rotate(-1.3deg)}92%{transform:rotate(.6deg)}96%{transform:rotate(0deg)}}' +
  '@keyframes smoke{0%{transform:translate(0,0) scale(.5);opacity:0}12%{opacity:.5}100%{transform:translate(140px,-280px) scale(2.6);opacity:0}}' +
  '@keyframes lean{0%,58%,100%{transform:translate(0,0) rotate(0deg)}64%,80%{transform:translate(4px,1px) rotate(7deg)}}' +
  '@keyframes flick{0%,100%{opacity:.85}20%{opacity:1}40%{opacity:.7}60%{opacity:.95}80%{opacity:.8}}' +
  '@keyframes wag{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}}' +
  '@keyframes sit{0%,78%{opacity:1}79%,97%{opacity:0}98%,100%{opacity:1}}' +
  '@keyframes dash{0%,78%{opacity:0;transform:translateX(0)}79%{opacity:1;transform:translateX(0)}95%{opacity:1;transform:translateX(1500px)}96%,100%{opacity:0;transform:translateX(1500px)}}' +
  '@keyframes legA{0%,49%{opacity:1}50%,100%{opacity:0}}' +
  '@keyframes legB{0%,49%{opacity:0}50%,100%{opacity:1}}' +
  '@keyframes fall{from{transform:translateY(0)}to{transform:translateY(1000px)}}' +
  '@keyframes sway{0%,100%{transform:translateX(-14px)}50%{transform:translateX(14px)}}' +
  '.cur,.tree,.tail,.who{transform-box:fill-box}' +
  '.cur{transform-origin:50% 100%}.tree{transform-origin:50% 100%}.tail{transform-origin:0 100%}.who{transform-origin:50% 100%}'

/** A pine as path data: a trunk and four tiers, and the snow lying on each tier. */
function pine(cx: number, base: number, h: number): { tree: string; snow: string } {
  let tree = `M${r1(cx - h * 0.025)} ${r1(base)}h${r1(h * 0.05)}v${r1(-h * 0.14)}h${r1(-h * 0.05)}z`
  let snow = ''

  for (let i = 0; i < 4; i++) {
    const top = base - h + i * h * 0.2
    const bottom = top + h * 0.34
    const half = h * (0.1 + i * 0.065)
    tree += `M${r1(cx)} ${r1(top)}L${r1(cx + half)} ${r1(bottom)}L${r1(cx - half)} ${r1(bottom)}Z`
    snow += `M${r1(cx - half * 0.8)} ${r1(bottom - 1)}L${r1(cx - half * 0.45)} ${r1(bottom - h * 0.03)}M${r1(cx + half * 0.35)} ${r1(bottom - h * 0.025)}L${r1(cx + half * 0.65)} ${r1(bottom - 1)}`
  }

  return { tree, snow }
}

type Point = readonly [number, number]

const lerp = (p: Point, q: Point, t: number): Point => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]

/** A mountain range: a ridge of peaks and valleys over `base`, with a snow cap on every peak. */
function range(rand: () => number, base: number, peaks: number, low: number, high: number, fill: string, snowFill: string): string {
  const step = (W + 200) / peaks
  const ridge: Point[] = [[-100, base]]

  for (let i = 0; i < peaks; i++) {
    const px = -100 + step * (i + 0.5) + between(rand, -step * 0.2, step * 0.2)
    const py = between(rand, low, high)
    ridge.push([px, py])
    ridge.push([px + step * 0.5 + between(rand, -20, 20), Math.min(base - 20, py + between(rand, 90, 220))])
  }

  ridge.push([W + 100, base])
  let out = `<polygon points="${ridge.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="${fill}"/>`

  for (let i = 1; i < ridge.length - 1; i += 2) {
    const peak = ridge[i] as Point
    const left = lerp(peak, ridge[i - 1] as Point, 0.3)
    const right = lerp(peak, ridge[i + 1] as Point, 0.26)
    const lowest = Math.max(left[1], right[1])
    const zig: Point[] = [
      [left[0] + (right[0] - left[0]) * 0.3, lowest - (lowest - peak[1]) * 0.2],
      [left[0] + (right[0] - left[0]) * 0.55, lowest + 4],
      [left[0] + (right[0] - left[0]) * 0.78, right[1] - 6],
    ]
    const cap = [peak, right, zig[2], zig[1], zig[0], left] as Point[]
    out += `<polygon points="${cap.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ')}" fill="${snowFill}"/>`
  }

  return out
}

/** An aurora curtain: a wavy ribbon, soft-edged, with fine vertical rays over it. */
function curtain(x0: number, x1: number, top: number, bottom: number, phase: number): string {
  const n = 16
  const upper: string[] = []
  const lower: string[] = []

  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    upper.push(`${r1(x)},${r1(top + 70 * Math.sin(i * 0.7 + phase) + 30 * Math.sin(i * 1.9 + phase * 2))}`)
    lower.push(`${r1(x)},${r1(bottom + 50 * Math.sin(i * 0.9 + phase))}`)
  }

  const shape = `${upper.join(' ')} ${lower.reverse().join(' ')}`

  return `<polygon points="${shape}" fill="url(#aurora)" filter="url(#aurf)"/><polygon points="${shape}" fill="url(#rays)"/>`
}

function husky(still: boolean): string {
  const a = moving(still)
  const fur = '#7d879c'
  const white = '#e7ecf5'
  const dark = '#2a3042'
  // Sitting, looking up at the moon.
  const sitting =
    `<g class="tail"${a('wag', 1.6, 0)}><path d="M18 -12C34 -18 36 -38 22 -36" stroke="${fur}" stroke-width="7" stroke-linecap="round" fill="none"/></g>` +
    `<ellipse cx="8" cy="-22" rx="20" ry="22" fill="${fur}"/><ellipse cx="-6" cy="-30" rx="12" ry="20" fill="${white}"/>` +
    `<rect x="-12" y="-24" width="6" height="24" rx="3" fill="${white}"/><rect x="-3" y="-22" width="6" height="22" rx="3" fill="${white}"/>` +
    `<g transform="rotate(-14 -8 -56)"><polygon points="-15,-66 -10,-82 -4,-66" fill="${fur}"/><polygon points="-5,-66 1,-80 5,-63" fill="${fur}"/>` +
    `<ellipse cx="-8" cy="-58" rx="13" ry="12" fill="${fur}"/><ellipse cx="-13" cy="-54" rx="8" ry="7" fill="${white}"/>` +
    `<ellipse cx="-21" cy="-57" rx="8" ry="5" fill="${white}"/><circle cx="-28" cy="-58" r="2.3" fill="${dark}"/><circle cx="-14" cy="-61" r="1.5" fill="${dark}"/></g>`
  // Running, two leg frames.
  const legs = (front: Point, back: Point): string =>
    `<path d="M22 -26L${front[0]} ${front[1]}M-22 -26L${back[0]} ${back[1]}" stroke="${white}" stroke-width="5" stroke-linecap="round"/>`
  const running =
    `<path d="M-30 -34C-44 -40 -50 -32 -46 -26" stroke="${fur}" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<g${a('legA', 0.32, 0, 'linear')}>${legs([40, -6], [-42, -8])}</g><g opacity="0"${a('legB', 0.32, 0, 'linear')}>${legs([14, -4], [-12, -4])}</g>` +
    `<ellipse cx="0" cy="-30" rx="32" ry="12" fill="${fur}"/><ellipse cx="2" cy="-25" rx="22" ry="6" fill="${white}"/>` +
    `<polygon points="28,-46 31,-58 36,-46" fill="${fur}"/><ellipse cx="34" cy="-40" rx="11" ry="9" fill="${fur}"/>` +
    `<ellipse cx="44" cy="-38" rx="7" ry="4" fill="${white}"/><circle cx="50" cy="-39" r="2" fill="${dark}"/>`

  return (
    `<g transform="translate(250 952) scale(1.1)"><g${a('sit', 46, -6, 'linear')}>${sitting}</g>` +
    `<g opacity="0"${a('dash', 46, -6, 'linear')}>${running}</g></g>`
  )
}

function cabin(still: boolean): string {
  const a = moving(still)
  let out = '<ellipse cx="1350" cy="985" rx="190" ry="26" fill="#ffcf73" opacity=".12" filter="url(#smokef)"/>'
  // Firewood.
  for (let i = 0; i < 9; i++) {
    const x = 1196 + (i % 3) * 12 + (Math.floor(i / 3) % 2) * 6
    const y = 966 - Math.floor(i / 3) * 11
    out += `<circle cx="${x}" cy="${y}" r="6" fill="#5a3a22"/><circle cx="${x}" cy="${y}" r="2.6" fill="#8a6440"/>`
  }

  out += '<rect x="1250" y="880" width="200" height="95" fill="#3b2617"/>'

  for (let y = 892; y < 975; y += 12) {
    out += `<path d="M1250 ${y}H1450" stroke="#2a1a10" stroke-width="2"/>`
  }

  out +=
    '<rect x="1405" y="805" width="22" height="55" fill="#2e2224"/><rect x="1401" y="799" width="30" height="9" rx="3" fill="#e4ecf7"/>' +
    '<polygon points="1230,886 1350,802 1470,886" fill="#1f1418"/>' +
    '<polygon points="1224,885 1350,794 1476,885 1464,894 1350,812 1236,894" fill="#e4ecf7"/>' +
    '<clipPath id="win"><rect x="1275" y="905" width="58" height="42"/></clipPath>' +
    '<rect x="1275" y="905" width="58" height="42" fill="url(#lamp)"/>' +
    `<g clip-path="url(#win)"><rect x="1307" y="922" width="17" height="12" fill="#bfe3ff" opacity=".9"/><rect x="1275" y="938" width="58" height="9" fill="#3b2617"/>` +
    `<g class="who"${a('lean', 22, -4)}><circle cx="1292" cy="921" r="6.5" fill="#2a1c14"/><ellipse cx="1292" cy="941" rx="13" ry="9" fill="#2a1c14"/></g></g>` +
    '<rect x="1275" y="905" width="58" height="42" fill="none" stroke="#2a1a10" stroke-width="4"/><path d="M1304 905V947M1275 926H1333" stroke="#2a1a10" stroke-width="2.5"/>' +
    '<rect x="1375" y="915" width="34" height="60" fill="#24160d"/><circle cx="1402" cy="946" r="2" fill="#c9a24a"/>' +
    `<g${a('flick', 2.5, 0)}><circle cx="1424" cy="912" r="42" fill="url(#lantern)"/><circle cx="1424" cy="912" r="5" fill="#ffd27a"/></g>`

  // Chimney smoke, leaning with the wind.
  for (let i = 0; i < 7; i++) {
    out += `<g${a('smoke', 14, -i * 2, 'ease-out')}><circle cx="1416" cy="795" r="13" fill="#9aa6c4" opacity=".35" filter="url(#smokef)"/></g>`
  }

  return out
}

function auroraSvg(still: boolean): string {
  const rand = rng(131)
  const a = moving(still)
  const defs =
    vertical('sky', [[0, '#060a1c'], [0.55, '#0d1a33'], [0.8, '#12304a'], [1, '#0e1a30']]) +
    vertical('aurora', [[0, '#8f5ce0', 0], [0.25, '#8f5ce0', 0.32], [0.6, '#36d39a', 0.55], [1, '#36d39a', 0]]) +
    '<pattern id="rays" width="11" height="1000" patternUnits="userSpaceOnUse"><rect width="2.5" height="1000" fill="#d9fff0" opacity=".09"/></pattern>' +
    vertical('far', [[0, '#2c3d6b'], [1, '#18223f']]) +
    vertical('mid', [[0, '#22305a'], [1, '#111a33']]) +
    vertical('cap', [[0, '#e4ebf7'], [1, '#93a4c6']]) +
    vertical('snow', [[0, '#41548a'], [1, '#1b2440']]) +
    vertical('lamp', [[0, '#ffe09a'], [1, '#ffb44f']]) +
    glow('moonglow', '#e8f0ff', 0.28) +
    glow('lantern', '#ffcf73', 0.55) +
    '<radialGradient id="moonface" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fbfaf4"/><stop offset="1" stop-color="#cfcbbf"/></radialGradient>' +
    blur('aurf', 16) +
    blur('smokef', 7)
  const body: string[] = [`<rect width="${W}" height="${H}" fill="url(#sky)"/>`]

  for (let i = 0; i < 130; i++) {
    const star = `<circle cx="${r1(between(rand, 0, W))}" cy="${r1(between(rand, 0, 700))}" r="${r1(between(rand, 0.5, 1.6))}" fill="#ffffff" opacity="${f2(between(rand, 0.4, 0.95))}"/>`
    body.push(i % 3 === 0 ? `<g${a('tw', between(rand, 2, 6), -between(rand, 0, 6))}>${star}</g>` : star)
  }

  for (const [x, y, s] of [[300, 300, 9], [1120, 80, 7], [1490, 260, 10], [760, 40, 6]] as const) {
    body.push(`<path d="M${x} ${y - s}L${x + s * 0.18} ${y - s * 0.18}L${x + s} ${y}L${x + s * 0.18} ${y + s * 0.18}L${x} ${y + s}L${x - s * 0.18} ${y + s * 0.18}L${x - s} ${y}L${x - s * 0.18} ${y - s * 0.18}Z" fill="#ffffff" opacity=".9"/>`)
  }

  body.push(
    '<circle cx="330" cy="140" r="170" fill="url(#moonglow)"/><circle cx="330" cy="140" r="46" fill="url(#moonface)"/>' +
      '<circle cx="315" cy="126" r="9" fill="#c4bfb2" opacity=".55"/><circle cx="345" cy="152" r="12" fill="#c4bfb2" opacity=".5"/>' +
      '<circle cx="322" cy="162" r="5" fill="#c4bfb2" opacity=".5"/><circle cx="352" cy="124" r="5" fill="#c4bfb2" opacity=".45"/>',
  )

  ;[
    { x0: -100, x1: 700, top: 150, bottom: 620, phase: 0.4, seconds: 26 },
    { x0: 500, x1: 1300, top: 90, bottom: 600, phase: 2.1, seconds: 32 },
    { x0: 1050, x1: 1750, top: 160, bottom: 640, phase: 4.2, seconds: 29 },
  ].forEach((c, i) => {
    body.push(`<g class="cur"${a('aur', c.seconds, -i * 7)}><g${a('breathe', c.seconds * 0.6, -i * 4)}>${curtain(c.x0, c.x1, c.top, c.bottom, c.phase)}</g></g>`)
  })

  body.push(range(rand, 760, 6, 380, 520, 'url(#far)', 'url(#cap)'))
  body.push(range(rand, 830, 4, 470, 600, 'url(#mid)', 'url(#cap)'))

  // A far line of small pines along the foot of the mountains.
  let distant = ''

  for (let x = 0; x < W; x += between(rand, 14, 26)) {
    distant += pine(x, 830 + between(rand, -6, 6), between(rand, 40, 70)).tree
  }

  body.push(`<path d="${distant}" fill="#0c142a"/>`)
  body.push('<path d="M0 850C200 820 420 860 640 845C900 828 1100 870 1340 850C1460 840 1540 845 1600 850V1000H0Z" fill="url(#snow)"/>')
  body.push('<path d="M0 850C200 820 420 860 640 845C900 828 1100 870 1340 850C1460 840 1540 845 1600 850" stroke="#7083b4" stroke-width="2" fill="none" opacity=".6"/>')

  // Near pines, left and right; a gust passes left to right now and then.
  const grove = (xs: readonly number[], base: number, low: number, high: number): void => {
    for (const x of xs) {
      const h = between(rand, low, high)
      const p = pine(x, base + between(rand, -8, 8), h)
      const tree = `<path d="${p.tree}" fill="#0a1226"/><path d="${p.snow}" stroke="#c8d4ea" stroke-width="2" stroke-linecap="round" opacity=".75"/>`
      body.push(`<g class="tree"${a('gust', 75, r1((x / W) * 2.5), 'ease-in-out')}>${tree}</g>`)
    }
  }

  grove([30, 95, 150, 215, 280, 350, 410], 975, 180, 340)
  grove([1170, 1225, 1490, 1545, 1590], 900, 200, 320)
  body.push(cabin(still))
  body.push(husky(still))

  if (!still) {
    const flakes: string[] = []

    for (let i = 0; i < 90; i++) {
      const x = r1(between(rand, 0, W))
      const y = r1(between(rand, 0, H))
      const r = r1(between(rand, 0.8, 2.2))
      flakes.push(`<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${r1(y - H)}" r="${r}"/>`)
    }

    body.push(`<g fill="#ffffff" opacity=".7"${a('sway', 9, 0)}><g${a('fall', 70, 0, 'linear')}>${flakes.join('')}</g></g>`)
  }

  return frame(defs, AURORA_CSS, body.join(''))
}

export const aurora: Painted = { scene: () => auroraSvg(false), thumb: () => auroraSvg(true) }
