import type { ThemeBackdropGlass, ThemeSetArgs } from 'claude-code'

import { BAKED_THUMBS } from './baked-thumbs'
import { TINTS, dotTide } from './dot-tide'
import { dotWave, ditherGallery, neonRain, pixelNebula, topo } from './gallery'
import { DITHER_COLORS, NEBULA_COLORS, TIDE_COLORS, TOPO_COLORS } from './looks'
import { aurora, march } from './illustrated'
import { anim, between, f2, glow, pick, r1, rng } from './kit'

/** One wallpaper: what the picker says, the glass over it, the window it is made for, its scene and its thumbnail. */
export type Wall = {
  id: string
  title: string
  blurb: string
  /** The mode the scene is made for; `auto` follows the app's own light or dark mode. */
  window: 'light' | 'dark' | 'auto'
  /** The app's own colors for this look, where it has them (makeColors); absent, the app keeps its own. */
  colors?: ThemeSetArgs['colors']
  glass: ThemeBackdropGlass
  scene: () => string
  thumb: () => string
  /** A shader the desktop app plays over the scene, reacting to the pointer; the Svg alone shows anywhere else. */
  shader?: 'march' | 'topo'
  /** The colours the scene comes in, the first its default; the box offers them while it is on (Dot Tide). */
  tints?: readonly Tint[]
  /** The scene in one of those colours. */
  sceneIn?: (color: string) => string
}

export type Tint = { readonly id: string; readonly label: string; readonly color: string }

/**
 * A scene in a colour other than its default is its own id, `dot-tide__mint`: 1 to 64 letters, digits, `_` and `-`, as
 * a scene's name may be, so the choice is kept, shared with the other sessions and drawn like any other.
 */
const TINT_MARK = '__'

const W = 1600
const H = 1000
const FONT = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'
/** A monospace glyph's width, and a line's height, per unit of font size. */
const CW = 0.6
const LH = 1.15
/** How much taller a character cell is than wide: keeps blobs round. */
const ASPECT = LH / CW
const NBSP = ' '

// ---------- small helpers ----------


/** Text safe inside SVG: only the three allowed references, and spaces that keep their place. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ /g, NBSP)
}

/** Lines of characters as one text element, the first baseline at y. */
function txt(lines: readonly string[], x: number, y: number, size: number, fill: string, extra = ''): string {
  const head = `<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(size)}" fill="${fill}"${extra}>`

  if (lines.length === 1) {
    return `${head}${esc(lines[0] ?? '')}</text>`
  }

  const spans = lines.map((line, i) => `<tspan x="${r1(x)}" dy="${i === 0 ? 0 : LH}em">${esc(line)}</tspan>`).join('')

  return `${head}${spans}</text>`
}

function widthOf(lines: readonly string[], size: number): number {
  return Math.max(...lines.map(line => line.length)) * size * CW
}

function heightOf(lines: readonly string[], size: number): number {
  return lines.length * size * LH
}

type Circle = readonly [number, number, number]

function field(x: number, y: number, circles: readonly Circle[]): number {
  let f = -Infinity

  for (const [cx, cy, rad] of circles) {
    const dx = x - cx
    const dy = (y - cy) * ASPECT
    f = Math.max(f, 1 - Math.sqrt(dx * dx + dy * dy) / rad)
  }

  return f
}

/** A soft shape in characters: dense glyphs inside, light ones at the edge. Circles are in cells, radius in columns. */
function blob(
  cols: number,
  rows: number,
  plus: readonly Circle[],
  ramp: string,
  seed: number,
  minus: readonly Circle[] = [],
  gain = 1.7,
): string[] {
  const rand = rng(seed)
  const out: string[] = []

  for (let y = 0; y < rows; y++) {
    let line = ''

    for (let x = 0; x < cols; x++) {
      const f = field(x + 0.5, y + 0.5, plus)
      const cut = minus.length === 0 ? -1 : field(x + 0.5, y + 0.5, minus)

      if (f <= 0 || cut > -0.04) {
        line += ' '
        continue
      }

      const v = Math.min(0.999, Math.max(0, f * gain + (rand() - 0.5) * 0.3))
      line += ramp[Math.floor(v * ramp.length)] ?? ' '
    }

    out.push(line.replace(/ +$/, ''))
  }

  return out
}

function cloud(rand: () => number, cols: number, seed: number): string[] {
  const rows = Math.round(cols / 4)
  const n = 4 + Math.floor(rand() * 3)
  const circles: Circle[] = []

  for (let i = 0; i < n; i++) {
    const big = i === 1 || i === n - 2 ? 1.3 : 1
    const rad = cols * between(rand, 0.12, 0.19) * big
    circles.push([cols * (0.16 + (0.68 * i) / (n - 1)), rows - 1 - (rad / ASPECT) * 0.55, rad])
  }

  return blob(cols, rows, circles, ' .:-=+*%@', seed)
}

function jelly(rand: () => number, cols: number, seed: number): { bell: string[]; legs: string[] } {
  const dome = Math.ceil(cols / 2 / ASPECT) + 1
  const bell = blob(cols, dome, [[cols / 2, dome, cols / 2]], ' .:-=+oO@', seed, [], 1.5)
  bell.push(` ${'~'.repeat(cols - 2)}`)
  const legs: string[] = []
  const rowsOfLegs = 4 + Math.floor(rand() * 4)

  for (let r = 0; r < rowsOfLegs; r++) {
    let line = ''

    for (let x = 0; x < cols; x++) {
      const isLeg = x % 3 === 2 && x < cols - 1 && rand() < 0.95 - r * 0.11
      line += isLeg ? pick(rand, [';', ':', '|', '(', ')', "'", ';']) : ' '
    }

    legs.push(line.replace(/ +$/, ''))
  }

  return { bell, legs }
}

// ---------- a scene under construction ----------

const BASE_CSS =
  `text{font-family:${FONT};white-space:pre}` +
  '@keyframes tw{0%,100%{opacity:.15}50%{opacity:1}}' +
  '@keyframes tw2{0%,100%{opacity:.5}50%{opacity:1}}' +
  '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}' +
  '@keyframes sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}' +
  '@keyframes rip{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.8);opacity:0}}' +
  '@keyframes wig{0%,100%{transform:translateX(-14px)}50%{transform:translateX(14px)}}' +
  '@keyframes lap{0%,100%{transform:translateX(-36px)}50%{transform:translateX(36px)}}' +
  '@keyframes w1{0%,100%{transform:translate(0,0)}33%{transform:translate(22px,-26px)}66%{transform:translate(-16px,-10px)}}' +
  '@keyframes w2{0%,100%{transform:translate(0,0)}33%{transform:translate(-24px,14px)}66%{transform:translate(12px,26px)}}' +
  '@keyframes w3{0%,100%{transform:translate(0,0)}50%{transform:translate(28px,18px)}}' +
  '.sw{transform-box:fill-box;transform-origin:50% 100%}' +
  '.rp{transform-box:fill-box;transform-origin:50% 50%}'

class Build {
  private readonly css: string[] = []
  private readonly body: string[] = []
  private readonly defs: string[] = []
  private k = 0

  constructor(private readonly bg: readonly [string, string]) {}

  def(markup: string): void {
    this.defs.push(markup)
  }

  add(markup: string): void {
    this.body.push(markup)
  }

  rule(css: string): void {
    this.css.push(css)
  }

  private name(): string {
    return `a${this.k++}`
  }

  /** Carries `inner` across the screen forever. At rest (reduced motion) it sits where it is drawn. */
  across(inner: string, x: number, w: number, seconds: number, dir: 1 | -1): string {
    const n = this.name()
    const a = -x - w - 60
    const b = W + 60 - x
    const travel = b - a
    const [from, to] = dir === 1 ? [a, b] : [b, a]
    const at = dir === 1 ? -a / travel : b / travel
    this.css.push(`@keyframes ${n}{from{transform:translateX(${r1(from)}px)}to{transform:translateX(${r1(to)}px)}}`)

    return `<g style="animation:${n} ${r1(seconds)}s linear ${r1(-at * seconds)}s infinite">${inner}</g>`
  }

  /**
   * Carries `inner` across one grid cell at a time, so tiles drawn on the grid stay on it. `x` and `w` are whole cells.
   * The delay lands mid-step, so at rest and at the start it sits where it is drawn.
   */
  stepAcross(inner: string, x: number, w: number, cell: number, seconds: number, dir: 1 | -1): string {
    const n = this.name()
    const a = -Math.ceil((x + w + 60) / cell) * cell
    const b = Math.ceil((W + 60 - x) / cell) * cell
    const steps = (b - a) / cell
    const [from, to] = dir === 1 ? [a, b] : [b, a]
    const at = (dir === 1 ? -a : b) / (b - a)
    const delay = -(at * seconds + seconds / steps / 2)
    this.css.push(`@keyframes ${n}{from{transform:translateX(${from}px)}to{transform:translateX(${to}px)}}`)

    return `<g style="animation:${n} ${r1(seconds)}s steps(${steps}) ${r1(delay)}s infinite">${inner}</g>`
  }

  /** Carries `inner` up (-1) or down (1) through the screen forever, fading at the ends if asked. */
  along(inner: string, top: number, h: number, seconds: number, dir: 1 | -1, fade = false): string {
    const n = this.name()
    const a = -top - h - 40
    const b = H + 40 - top
    const travel = b - a
    const [from, to] = dir === 1 ? [a, b] : [b, a]
    const at = dir === 1 ? -a / travel : b / travel
    const ends = fade ? ';opacity:0' : ''
    const middle = fade ? '12%,80%{opacity:1}' : ''
    this.css.push(
      `@keyframes ${n}{0%{transform:translateY(${r1(from)}px)${ends}}${middle}100%{transform:translateY(${r1(to)}px)${ends}}}`,
    )

    return `<g style="animation:${n} ${r1(seconds)}s linear ${r1(-at * seconds)}s infinite">${inner}</g>`
  }

  /** Slides a repeating row sideways by exactly one period, so the loop has no seam. */
  slide(inner: string, period: number, seconds: number, dir: 1 | -1): string {
    const n = this.name()
    const [from, to] = dir === 1 ? [-period, 0] : [0, -period]
    this.css.push(`@keyframes ${n}{from{transform:translateX(${r1(from)}px)}to{transform:translateX(${r1(to)}px)}}`)

    return `<g style="animation:${n} ${r1(seconds)}s linear 0s infinite">${inner}</g>`
  }

  svg(): string {
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
      `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${this.bg[0]}"/>` +
      `<stop offset="1" stop-color="${this.bg[1]}"/></linearGradient>${this.defs.join('')}</defs>` +
      `<style>${BASE_CSS}${this.css.join('')}</style>` +
      `<rect width="${W}" height="${H}" fill="url(#bg)"/>${this.body.join('')}</svg>`
    )
  }
}

const TW = 320
const TH = 180

function thumbSvg(bg: readonly [string, string], inner: string, defs = ''): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TW} ${TH}" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/>` +
    `<stop offset="1" stop-color="${bg[1]}"/></linearGradient>${defs}</defs>` +
    `<style>text{font-family:${FONT};white-space:pre}</style>` +
    `<rect width="${TW}" height="${TH}" fill="url(#bg)"/>${inner}</svg>`
  )
}

// ---------- 1. Ember ----------

const EMBER_BG = ['#24160f', '#0d0806'] as const

function emberBed(rand: () => number, width: number, size: number, bottom: number, b?: Build): string {
  const colors = ['#ff5a24', '#ff7a33', '#ff9447', '#ffb15e', '#ffcf86']
  const cols = Math.ceil(width / (size * CW)) + 2
  let out = ''

  colors.forEach((color, k) => {
    let row = ''

    for (let i = 0; i < cols; i++) {
      row += rand() < 0.9 - k * 0.18 ? pick(rand, ['^', '^', '~', "'", '`', '.', ',', ':', ';', '*']) : ' '
    }

    const line = txt([row], -4, bottom - k * size * 1.2, size, color)
    out += b === undefined ? line : `<g${anim('tw2', between(rand, 2.5, 5.5), -between(rand, 0, 5))}>${line}</g>`
  })

  return out
}

function emberScene(): string {
  const b = new Build(EMBER_BG)
  const rand = rng(11)
  b.def(glow('heat', '#ff6a2b', 0.4, '.5', '1', '.75'))
  b.add(`<rect width="${W}" height="${H}" fill="url(#heat)"/>`)
  const dots = '.   '.repeat(Math.ceil(W / (16 * CW * 4)) + 1)

  for (let y = 30; y < H; y += 38) {
    b.add(txt([dots], 6, y, 16, '#4a3125'))
  }

  b.add(emberBed(rand, W, 18, H - 8, b))

  for (let i = 0; i < 36; i++) {
    const size = Math.round(between(rand, 12, 30))
    const x = between(rand, 20, W - 20)
    const y = between(rand, 80, H - 60)
    const spark = txt([pick(rand, ['*', '+', 'x', '.', "'", '`', '*', '.'])], x, y, size, pick(rand, ['#ff9a5c', '#ffcf8a', '#ff6b3d', '#ffe2b0']))
    const inner = `<g${anim('wig', between(rand, 3, 7), -between(rand, 0, 7))}>${spark}</g>`
    b.add(b.along(inner, y - size, size, between(rand, 14, 32), -1, true))
  }

  return b.svg()
}

function emberThumb(): string {
  const rand = rng(12)
  let inner = `<rect width="${TW}" height="${TH}" fill="url(#heat)"/>`

  for (let i = 0; i < 16; i++) {
    inner += txt([pick(rand, ['*', '+', '.', "'"])], between(rand, 10, 300), between(rand, 20, 140), between(rand, 8, 16), pick(rand, ['#ff9a5c', '#ffcf8a', '#ff6b3d']))
  }

  inner += txt(['*'], 248, 52, 44, '#ff8a4c')
  inner += emberBed(rand, TW, 11, TH - 4)

  return thumbSvg(EMBER_BG, inner, glow('heat', '#ff6a2b', 0.45, '.5', '1', '.8'))
}

// ---------- 2. Cloud Drift ----------

const CLOUD_BG = ['#86c3f2', '#e4f4ff'] as const

function cloudScene(): string {
  const b = new Build(CLOUD_BG)
  const rand = rng(23)
  b.def(glow('sun', '#fffbe6', 0.9, '.16', '.12', '.45'))
  b.add(`<rect width="${W}" height="${H}" fill="url(#sun)"/>`)
  const layers = [
    { n: 3, size: 12, op: 0.55, lo: 28, hi: 40, slow: 300, fast: 380 },
    { n: 3, size: 16, op: 0.8, lo: 34, hi: 48, slow: 200, fast: 260 },
    { n: 3, size: 21, op: 1, lo: 36, hi: 52, slow: 140, fast: 190 },
  ]
  let seed = 100

  for (const layer of layers) {
    for (let i = 0; i < layer.n; i++) {
      const art = cloud(rand, Math.round(between(rand, layer.lo, layer.hi)), seed++)
      const x = between(rand, 0, W - 200)
      const y = between(rand, 60, H - 260)
      const shadow = txt(art, x + 3, y + 5, layer.size, '#9cc8ea', ` opacity="${f2(layer.op * 0.6)}"`)
      const body = txt(art, x, y, layer.size, '#ffffff', ` opacity="${f2(layer.op)}"`)
      b.add(b.across(shadow + body, x, widthOf(art, layer.size), between(rand, layer.slow, layer.fast), 1))
    }
  }

  for (let i = 0; i < 3; i++) {
    const art = pick(rand, [['v  v', '  v'], ['^v^', '   ^v^'], ['v', '   v  v']])
    const x = between(rand, 100, W - 300)
    const y = between(rand, 120, 420)
    const bird = `<g${anim('bob', 5, -i * 1.7)}>${txt(art, x, y, 16, '#4b7aa0')}</g>`
    b.add(b.across(bird, x, widthOf(art, 16), between(rand, 70, 110), 1))
  }

  return b.svg()
}

function cloudThumb(): string {
  const rand = rng(24)
  let inner = `<rect width="${TW}" height="${TH}" fill="url(#sun)"/>`
  inner += txt(cloud(rand, 30, 7), 20, 40, 7, '#ffffff')
  inner += txt(cloud(rand, 36, 8), 160, 92, 8, '#ffffff')
  inner += txt(cloud(rand, 24, 9), 60, 128, 6, '#ffffff', ' opacity=".8"')

  return thumbSvg(CLOUD_BG, inner, glow('sun', '#fffbe6', 0.9, '.16', '.12', '.5'))
}

// ---------- 3. Honu Lagoon ----------

const LAGOON_BG = ['#8ae3e8', '#168aa6'] as const

const TURTLE = [
  '        ______',
  '    _.-"# ## #"-._    __',
  '  ,"  ## #  # ##  ". (o >',
  ' (_._______________,_.-"',
  '    //          //',
]

function sandRows(rand: () => number, width: number, size: number, bottom: number): string {
  let out = ''

  ;['#f7e5b8', '#eed69e', '#e3c787', '#d8b973'].forEach((color, k) => {
    let row = ''

    for (let i = 0; i < Math.ceil(width / (size * CW)) + 2; i++) {
      row += rand() < 0.85 - k * 0.22 ? pick(rand, ['.', ',', ':', ';', "'", '`']) : ' '
    }

    out += txt([row], -4, bottom - k * size, size, color)
  })

  return out
}

function lagoonScene(): string {
  const b = new Build(LAGOON_BG)
  const rand = rng(37)

  for (let i = 0; i < 5; i++) {
    const x = between(rand, 100, W - 200)
    const w = between(rand, 60, 140)
    b.add(`<polygon points="${r1(x)},0 ${r1(x + w)},0 ${r1(x + w * 3 + 160)},${H} ${r1(x + 160)},${H}" fill="#ffffff" opacity="${f2(between(rand, 0.05, 0.11))}"/>`)
  }

  for (let y = 60; y < 720; y += 64) {
    let row = ''

    for (let i = 0; i < Math.ceil(W / (14 * CW)) + 14; i++) {
      row += rand() < 0.16 ? pick(rand, ['~', '~', '.', '-']) : ' '
    }

    b.add(`<g${anim('lap', between(rand, 9, 15), -between(rand, 0, 9))}>${txt([row], -60, y, 14, '#ecffff', ' opacity=".35"')}</g>`)
  }

  ;[
    { y: 250, size: 20, sec: 160 },
    { y: 560, size: 14, sec: 230 },
  ].forEach((t, i) => {
    const x = between(rand, 200, W - 600)
    const swimmer = `<g${anim('bob', 8, -i * 3)}>${txt(TURTLE, x, t.y, t.size, '#1d5b49')}</g>`
    b.add(b.across(swimmer, x, widthOf(TURTLE, t.size), t.sec, 1))
  })

  for (let i = 0; i < 3; i++) {
    const art = pick(rand, [['<><  <><', '  <><   <><', '<><'], ['<><', '   <>< <><'], ['<>< <><', ' <><']])
    const x = between(rand, 100, W - 200)
    const y = between(rand, 150, 760)
    b.add(b.across(txt(art, x, y, 14, '#ffd36b'), x, widthOf(art, 14), between(rand, 55, 85), -1))
  }

  for (let i = 0; i < 14; i++) {
    const size = between(rand, 12, 22)
    const x = between(rand, 30, W - 30)
    const y = between(rand, 120, H - 80)
    const bubble = `<g${anim('wig', between(rand, 3, 6), -between(rand, 0, 6))}>${txt([pick(rand, ['o', 'O', '.', 'o'])], x, y, size, '#ffffff', ' opacity=".75"')}</g>`
    b.add(b.along(bubble, y - size, size, between(rand, 16, 30), -1, true))
  }

  b.add(sandRows(rand, W, 16, H - 8))

  for (let i = 0; i < 6; i++) {
    const x = i < 3 ? between(rand, 30, 320) : between(rand, 1280, 1570)
    const rows = 7 + Math.floor(rand() * 6)
    const stalk = Array.from({ length: rows }, (_, r) => (r % 2 === 0 ? ' )' : '('))
    const top = H - 60 - heightOf(stalk, 20)
    b.add(`<g class="sw"${anim('sway', between(rand, 6, 9), -between(rand, 0, 8))}>${txt(stalk, x, top + 20, 20, '#2b8a5a')}</g>`)
  }

  return b.svg()
}

function lagoonThumb(): string {
  const rand = rng(38)
  let inner = txt(TURTLE, 70, 62, 9, '#1d5b49')
  inner += txt(['<><  <><', '  <><'], 210, 120, 9, '#ffd36b')

  for (let i = 0; i < 8; i++) {
    inner += txt([pick(rand, ['o', 'O', '.'])], between(rand, 20, 300), between(rand, 20, 140), between(rand, 8, 13), '#ffffff', ' opacity=".8"')
  }

  inner += sandRows(rand, TW, 9, TH - 3)

  return thumbSvg(LAGOON_BG, inner)
}

// ---------- 4. Koi Pond ----------

const KOI_BG = ['#1a5a4c', '#0a2b24'] as const

function pad(cols: number, seed: number): string[] {
  const rows = Math.round(cols / ASPECT) + 1

  return blob(cols, rows, [[cols / 2, rows / 2, cols / 2]], ' .:-=+*#', seed, [[cols * 0.86, rows * 0.3, cols * 0.2]], 1.4)
}

function koiScene(): string {
  const b = new Build(KOI_BG)
  const rand = rng(41)

  for (let y = 40; y < H; y += 46) {
    let row = ''

    for (let i = 0; i < Math.ceil(W / (14 * CW)); i++) {
      row += rand() < 0.08 ? pick(rand, ['~', '.', '-', "'"]) : ' '
    }

    b.add(txt([row], 0, y, 14, '#2f7563', ' opacity=".7"'))
  }

  for (let i = 0; i < 6; i++) {
    const ring = txt(['( )'], between(rand, 120, W - 120), between(rand, 120, H - 160), 22, '#7fc4b0')
    b.add(`<g class="rp"${anim('rip', between(rand, 6, 9), -between(rand, 0, 9), 'ease-out')}>${ring}</g>`)
  }

  const KOI = ['#ff8b3d', '#fff3e3', '#ff5b45', '#ffb04a', '#ffd9b8', '#ff7a2f']
  KOI.forEach((color, i) => {
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1
    const art = [dir === 1 ? '><((((o>' : '<o))))><']
    const size = between(rand, 22, 32)
    const x = between(rand, 100, W - 300)
    const y = between(rand, 160, H - 180)
    const fish = `<g${anim('bob', between(rand, 6, 9), -between(rand, 0, 8))}>${txt(art, x, y, size, color)}</g>`
    b.add(b.across(fish, x, widthOf(art, size), between(rand, 45, 90), dir))
  })

  const spots: readonly (readonly [number, number])[] = [
    [70, 70], [1330, 50], [1450, 560], [30, 500], [250, 800], [1190, 790], [620, 40],
  ]
  spots.forEach(([x, y], i) => {
    const cols = Math.round(between(rand, 16, 26))
    const art = pad(cols, 300 + i)
    b.add(txt(art, x, y + 16, 16, i % 2 === 0 ? '#4ea56b' : '#3c8a57'))

    if (i % 3 === 0) {
      const flower = txt(['@'], x + cols * 16 * CW * 0.4, y + heightOf(art, 16) * 0.55, 22, '#ffb7cc')
      b.add(`<g${anim('tw2', between(rand, 4, 7), -between(rand, 0, 6))}>${flower}</g>`)
    }
  })

  return b.svg()
}

function koiThumb(): string {
  let inner = txt(pad(18, 7), 6, 14, 8, '#4ea56b')
  inner += txt(pad(14, 8), 236, 112, 8, '#3c8a57')
  inner += txt(['@'], 40, 44, 14, '#ffb7cc')
  inner += txt(['><((((o>'], 140, 70, 18, '#ff8b3d')
  inner += txt(['<o))))><'], 90, 128, 15, '#fff3e3')
  inner += txt(['( )'], 230, 60, 14, '#7fc4b0')

  return thumbSvg(KOI_BG, inner)
}

// ---------- 5. Jellyfish ----------

const JELLY_BG = ['#0d1a3a', '#040814'] as const

function drawJelly(art: { bell: string[]; legs: string[] }, x: number, y: number, size: number, color: string, flicker: string): string {
  const legsY = y + heightOf(art.bell, size)

  return txt(art.bell, x, y, size, color) + `<g${flicker}>${txt(art.legs, x, legsY, size, color, ' opacity=".75"')}</g>`
}

function jellyScene(): string {
  const b = new Build(JELLY_BG)
  const rand = rng(53)
  b.def(glow('jg', '#ffd6f2', 0.5))
  const snowRows: string[] = []

  for (let y = 20; y < H; y += 50) {
    let row = ''

    for (let i = 0; i < Math.ceil(W / (12 * CW)); i++) {
      row += rand() < 0.04 ? pick(rand, ['.', "'", '.']) : ' '
    }

    snowRows.push(txt([row], 0, y, 12, '#6d7fb3', ' opacity=".55"'))
    snowRows.push(txt([row], 0, y - H, 12, '#6d7fb3', ' opacity=".55"'))
  }

  // The snow is drawn twice, one screen apart, and falls exactly one screen per loop.
  b.rule(`@keyframes snow{from{transform:translateY(0)}to{transform:translateY(${H}px)}}`)
  b.add(`<g style="animation:snow 120s linear 0s infinite">${snowRows.join('')}</g>`)
  const COLORS = ['#ff9ad5', '#c9a7ff', '#8fd3ff', '#ffb3e6', '#b0f0ff', '#d9b8ff']

  COLORS.forEach((color, i) => {
    const cols = Math.round(between(rand, 14, 26))
    const size = between(rand, 13, 18)
    const art = jelly(rand, cols, 500 + i)
    const x = i < 3 ? between(rand, 40, 520) : between(rand, 1000, W - 260)
    const y = between(rand, 80, H - 260)
    const w = widthOf(art.bell, size)
    const h = heightOf(art.bell, size) + heightOf(art.legs, size)
    const halo = `<circle cx="${r1(x + w / 2)}" cy="${r1(y)}" r="${r1(w * 0.8)}" fill="url(#jg)" opacity=".45"/>`
    const body = drawJelly(art, x, y, size, color, anim('tw2', between(rand, 2, 4), -between(rand, 0, 4)))
    const bobbing = `<g${anim('bob', between(rand, 6, 9), -between(rand, 0, 8))}>${halo}${body}</g>`
    b.add(b.along(bobbing, y - size, h, between(rand, 70, 130), -1))
  })

  return b.svg()
}

function jellyThumb(): string {
  const rand = rng(54)
  let inner = ''

  for (let i = 0; i < 14; i++) {
    inner += txt(['.'], between(rand, 5, 315), between(rand, 5, 175), 9, '#6d7fb3')
  }

  inner += `<circle cx="96" cy="60" r="44" fill="url(#jg)" opacity=".5"/>`
  inner += drawJelly(jelly(rand, 18, 9), 60, 44, 7, '#ff9ad5', '')
  inner += drawJelly(jelly(rand, 14, 10), 210, 96, 6, '#c9a7ff', '')

  return thumbSvg(JELLY_BG, inner, glow('jg', '#ffd6f2', 0.5))
}

// ---------- 6. Paper Boats ----------

const BOATS_BG = ['#e8f5f7', '#8ec4d3'] as const

const BOAT = [
  '     /|',
  '    / |',
  '   /__|',
  '______|___',
  '`.______.`',
]

function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number): number => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const part = (i: number): string => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')

  return `#${part(0)}${part(1)}${part(2)}`
}

function waveRow(rand: () => number): string {
  let unit = ''

  for (let i = 0; i < 12 + Math.floor(rand() * 6); i++) {
    unit += rand() < 0.7 ? pick(rand, ['~', '~', '-', '~']) : ' '
  }

  return unit
}

function boatsScene(): string {
  const b = new Build(BOATS_BG)
  const rand = rng(61)
  b.def('<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe2ea"/><stop offset="1" stop-color="#5d9fb5"/></linearGradient>')
  b.add(`<rect y="430" width="${W}" height="${H - 430}" fill="url(#sea)"/>`)

  for (let k = 0; k < 12; k++) {
    const t = k / 11
    const size = 11 + k * 1.5
    const y = 450 + 560 * Math.pow(t, 1.4)
    const unit = waveRow(rand)
    const period = unit.length * size * CW
    const row = unit.repeat(Math.ceil((W + period) / period) + 1)
    const line = txt([row], 0, y, size, mix('#e6f6f9', '#2f7891', t))
    b.add(b.slide(line, period, 16 + (11 - k) * 2.5, k % 2 === 0 ? 1 : -1))
  }

  for (let i = 0; i < 5; i++) {
    const depth = (i + 0.5) / 5
    const size = 12 + depth * 18
    const x = between(rand, 80, W - 300)
    const y = 470 + depth * 400
    const boat = txt(BOAT, x + 2, y + 2, size, '#3f7487', ' opacity=".45"') + txt(BOAT, x, y, size, '#fffdf6')
    const bobbing = `<g${anim('bob', between(rand, 5, 8), -between(rand, 0, 7))}>${boat}</g>`
    b.add(b.across(bobbing, x, widthOf(BOAT, size), 320 - depth * 160, 1))
  }

  for (let i = 0; i < 2; i++) {
    const x = between(rand, 200, W - 300)
    const y = between(rand, 100, 300)
    const gull = `<g${anim('bob', 5, -i * 2)}>${txt(['v   v', '  v'], x, y, 15, '#6f8f99')}</g>`
    b.add(b.across(gull, x, 90, between(rand, 80, 120), -1))
  }

  return b.svg()
}

function boatsThumb(): string {
  const rand = rng(62)
  let inner = '<rect y="78" width="320" height="102" fill="url(#sea)"/>'

  for (let k = 0; k < 6; k++) {
    const t = k / 5
    const size = 7 + k
    inner += txt([waveRow(rand).repeat(8)], -4, 86 + 92 * Math.pow(t, 1.3), size, mix('#e6f6f9', '#2f7891', t))
  }

  inner += txt(BOAT, 60, 74, 9, '#fffdf6')
  inner += txt(BOAT, 200, 112, 12, '#fffdf6')

  return thumbSvg(BOATS_BG, inner, '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe2ea"/><stop offset="1" stop-color="#5d9fb5"/></linearGradient>')
}

// ---------- 7. Fireflies ----------

const FIRE_BG = ['#103029', '#091a16'] as const
const LIME = '#d6f26b'
const GRID = 26

function grid(id: string, cell: number, stroke = '#1d4239'): string {
  return `<pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse"><path d="M${cell} 0H0V${cell}" fill="none" stroke="${stroke}" stroke-width="1"/></pattern>`
}

/** A firefly: one to three cells of glyphs, some lit as solid blocks. */
function firefly(rand: () => number, x: number, y: number, size: number): string {
  const cells = 1 + Math.floor(rand() * 3)
  const isRow = rand() < 0.5
  const cw = size * 1.1
  const ch = size * 1.3
  let out = ''

  for (let j = 0; j < cells; j++) {
    const cx = x + (isRow ? j * cw : 0)
    const cy = y + (isRow ? 0 : j * ch)
    const glyph = pick(rand, ['t', '%', ';', ':', 'o', ',', "'", 't'])

    if (rand() < 0.6) {
      out += `<rect x="${r1(cx - size * 0.1)}" y="${r1(cy - size * 0.95)}" width="${r1(size * 0.95)}" height="${r1(size * 1.2)}" rx="2" fill="${LIME}"/>`
      out += txt([glyph], cx + size * 0.08, cy, size, '#143229')
    } else {
      out += txt([glyph], cx + size * 0.08, cy, size, LIME)
    }
  }

  return out
}

function garden(rand: () => number, width: number, bottom: number, cell: number, size: number, maxRows: number, twinkles?: string[]): string {
  const cols = Math.floor(width / cell)
  const heights: number[] = []

  for (let i = 0; i < cols; i++) {
    const edge = Math.abs(i - cols / 2) / (cols / 2)
    heights.push(Math.round(rand() * (1 + (maxRows - 1) * (0.25 + 0.75 * Math.pow(edge, 1.3)))))
  }

  const shades = ['#1f5242', '#285f4b', '#2f6d54', '#387b5c', '#468b63', '#5b9e6a']
  let out = ''

  for (let k = 0; k < maxRows; k++) {
    let glyphs = ''
    const xs: string[] = []

    heights.forEach((h, i) => {
      if (h > k) {
        glyphs += pick(rand, ['X', 'S', 't', 'x', '%', 's', 'S', 'X'])
        xs.push(String(i * cell + cell * 0.25))
      }
    })

    if (glyphs !== '') {
      out += `<text x="${xs.join(' ')}" y="${r1(bottom - k * cell)}" font-size="${size}" fill="${shades[Math.min(k, shades.length - 1)]}">${esc(glyphs)}</text>`
    }
  }

  if (twinkles !== undefined) {
    for (let n = 0; n < 18; n++) {
      const i = Math.floor(rand() * cols)
      const h = heights[i] ?? 0

      if (h > 0) {
        const k = Math.floor(rand() * h)
        twinkles.push(txt([pick(rand, ['X', 'S', 't', '%'])], i * cell + cell * 0.25, bottom - k * cell, size, LIME))
      }
    }
  }

  return out
}

function firefliesScene(): string {
  const b = new Build(FIRE_BG)
  const rand = rng(71)
  b.def(grid('gr', GRID))
  b.def(glow('fg', LIME, 0.26))
  b.add(`<rect width="${W}" height="${H}" fill="url(#gr)" opacity=".6"/>`)

  for (let i = 0; i < 16; i++) {
    const x = between(rand, 40, W - 100)
    const y = between(rand, 60, H - 260)
    const size = 20
    const halo = `<circle cx="${r1(x + 10)}" cy="${r1(y - 8)}" r="${r1(between(rand, 70, 120))}" fill="url(#fg)"/>`
    const lit = `<g${anim('tw', between(rand, 3, 8), -between(rand, 0, 8))}>${halo}${firefly(rand, x, y, size)}</g>`
    b.add(`<g${anim(pick(rand, ['w1', 'w2', 'w3']), between(rand, 9, 16), -between(rand, 0, 12))}>${lit}</g>`)
  }

  const twinkles: string[] = []
  b.add(garden(rand, W, H - 6, GRID, 18, 9, twinkles))
  twinkles.forEach(t => b.add(`<g${anim('tw', between(rand, 2, 6), -between(rand, 0, 6))}>${t}</g>`))

  return b.svg()
}

function firefliesThumb(): string {
  const rand = rng(72)
  let inner = `<rect width="${TW}" height="${TH}" fill="url(#gr)" opacity=".6"/>`

  for (let i = 0; i < 6; i++) {
    const x = between(rand, 20, 290)
    const y = between(rand, 24, 120)
    inner += `<circle cx="${r1(x + 4)}" cy="${r1(y - 4)}" r="26" fill="url(#fg)"/>` + firefly(rand, x, y, 9)
  }

  inner += garden(rand, TW, TH - 3, 10, 8, 4)

  return thumbSvg(FIRE_BG, inner, grid('gr', 10) + glow('fg', LIME, 0.3))
}

// ---------- 8. Moonlit: glyph tiles on a grid ----------

const MOON_BG = ['#0a1136', '#1e3a8f'] as const
const MOONLIGHT = '#fff3c8'
const CELL = 22

/** Which cells of a grid are filled: [row][col]. */
type Cells = boolean[][]

type TileStyle = {
  fill: string
  bright: string
  glyph: string
  glyphBright: string
  dot: string
  chars: readonly string[]
  brightShare: number
}

const CLOUD_TILES: TileStyle = {
  fill: '#24357f',
  bright: '#3349a8',
  glyph: '#7f93dd',
  glyphBright: '#c3cdfb',
  dot: '#3d4d9c',
  chars: ['S', 'S', '%', 'X', 't', 'S', 't'],
  brightShare: 0.3,
}

const MOON_TILES: TileStyle = {
  fill: '#cfc59c',
  bright: '#e4dcb8',
  glyph: '#3a3f66',
  glyphBright: '#4a4f78',
  dot: '#56659f',
  chars: ['%', ':', 't', ';', ':', '%', 't'],
  brightShare: 0.35,
}

/** A cloud as rows of cells: narrow on top, widest near the base. */
function cloudCells(rand: () => number, cols: number): Cells {
  const profile = pick(rand, [
    [0.45, 0.8, 1, 0.95],
    [0.2, 0.65, 0.85, 1, 0.7],
    [0.5, 0.85, 1, 1],
  ])

  return profile.map(share => {
    const width = Math.max(2, Math.round(cols * share + (rand() - 0.5) * 3))
    const start = Math.round((cols - width) / 2 + (rand() - 0.5) * 3)

    return Array.from({ length: cols + 4 }, (_, c) => c >= start && c < start + width)
  })
}

/** A crescent, horns up and to the right, as cells. */
function crescentCells(size: number): Cells {
  const k = size / 12

  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      const x = (c + 0.5) / k
      const y = (r + 0.5) / k
      const isLit = (x - 6) ** 2 + (y - 6) ** 2 <= 5.8 ** 2
      const isShadow = (x - 8.6) ** 2 + (y - 3.4) ** 2 <= 5.4 ** 2

      return isLit && !isShadow
    }),
  )
}

/**
 * Draws filled cells as tiles with a glyph on each, plus a few faint dots in the empty cells around them.
 * Bright tiles fall into two groups that pulse out of step when `pulse` is given.
 */
function tiles(
  rand: () => number,
  cells: Cells,
  ox: number,
  oy: number,
  cell: number,
  style: TileStyle,
  fontSize: number,
  pulse?: (markup: string, phase: number) => string,
): string {
  const side = r1(cell - 3)
  const paths = ['', '', '']
  const glyphs: { xs: string[]; chars: string; y: number }[][] = [[], [], []]
  const dots: { x: number; y: number; ch: string }[] = []
  const isOn = (r: number, c: number): boolean => cells[r]?.[c] === true

  cells.forEach((row, r) => {
    const rowGlyphs = [0, 1, 2].map(() => ({ xs: [] as string[], chars: '', y: oy + r * cell + cell * 0.72 }))

    row.forEach((on, c) => {
      const x = ox + c * cell
      const y = oy + r * cell

      if (!on) {
        const isEdge = isOn(r - 1, c) || isOn(r + 1, c) || isOn(r, c - 1) || isOn(r, c + 1)

        if (isEdge && rand() < 0.22) {
          dots.push({ x: x + cell / 2, y: y + cell * 0.68, ch: pick(rand, ['o', '.', ':', "'", 'o']) })
        }

        return
      }

      const group = rand() < style.brightShare ? (rand() < 0.5 ? 1 : 2) : 0
      paths[group] += `M${r1(x + 1.5)} ${r1(y + 1.5)}h${side}v${side}h-${side}z`
      const slot = rowGlyphs[group] as { xs: string[]; chars: string; y: number }
      slot.xs.push(String(r1(x + cell / 2)))
      slot.chars += pick(rand, style.chars)
    })

    rowGlyphs.forEach((slot, group) => (glyphs[group] as typeof rowGlyphs).push(slot))
  })

  const layer = (group: number): string => {
    const fill = group === 0 ? style.fill : style.bright
    const ink = group === 0 ? style.glyph : style.glyphBright
    const text = (glyphs[group] ?? [])
      .filter(slot => slot.chars !== '')
      .map(slot => `<text x="${slot.xs.join(' ')}" y="${r1(slot.y)}" font-size="${fontSize}" fill="${ink}" text-anchor="middle">${esc(slot.chars)}</text>`)
      .join('')

    return paths[group] === '' ? '' : `<path d="${paths[group]}" fill="${fill}"/>${text}`
  }

  const dotText =
    dots.length === 0
      ? ''
      : `<text x="${dots.map(d => r1(d.x)).join(' ')}" y="${dots.map(d => r1(d.y)).join(' ')}" font-size="${fontSize}" fill="${style.dot}" text-anchor="middle">${esc(dots.map(d => d.ch).join(''))}</text>`

  const bright = pulse === undefined ? layer(1) + layer(2) : pulse(layer(1), 0) + pulse(layer(2), 1)

  return dotText + layer(0) + bright
}

function moonScene(): string {
  const b = new Build(MOON_BG)
  const rand = rng(83)
  b.def(grid('mgrid', CELL, '#1a2b72'))
  b.def(glow('mg', MOONLIGHT, 0.16))
  b.add(`<rect width="${W}" height="${H}" fill="url(#mgrid)" opacity=".55"/>`)

  for (let i = 0; i < 90; i++) {
    const star = txt([pick(rand, ['.', '.', '.', '+', "'", '.'])], between(rand, 10, W - 10), between(rand, 10, H - 10), between(rand, 10, 18), pick(rand, ['#ffffff', '#dfe6ff', '#9fb2ff']))
    b.add(i % 2 === 0 ? `<g${anim('tw', between(rand, 2, 6), -between(rand, 0, 6))}>${star}</g>` : star)
  }

  const pulse = (markup: string, phase: number): string =>
    markup === '' ? '' : `<g${anim('tw2', 3 + phase * 1.7, -phase * 2.1 - rand() * 3)}>${markup}</g>`

  // The moon stays put, softly lit; its bright tiles breathe.
  const moonCol = 49
  const moonRow = 3
  const moonSize = 12
  b.add(`<circle cx="${(moonCol + moonSize / 2) * CELL}" cy="${(moonRow + moonSize / 2) * CELL}" r="${moonSize * CELL * 1.1}" fill="url(#mg)"/>`)
  b.add(tiles(rand, crescentCells(moonSize), moonCol * CELL, moonRow * CELL, CELL, MOON_TILES, 13, pulse))

  // Clouds drift right a cell at a time, slow enough to feel like weather.
  const clouds = [
    { col: 17, row: 7, cols: 22, seconds: 420 },
    { col: 46, row: 17, cols: 22, seconds: 360 },
    { col: 26, row: 26, cols: 20, seconds: 480 },
    { col: 2, row: 34, cols: 12, seconds: 540 },
  ]

  for (const cloud of clouds) {
    const cells = cloudCells(rand, cloud.cols)
    const x = cloud.col * CELL
    const markup = tiles(rand, cells, x, cloud.row * CELL, CELL, CLOUD_TILES, 13, pulse)
    b.add(b.stepAcross(markup, x, (cloud.cols + 4) * CELL, CELL, cloud.seconds, 1))
  }

  return b.svg()
}

function moonThumb(): string {
  const rand = rng(84)
  const cell = 8
  let inner = `<rect width="${TW}" height="${TH}" fill="url(#tgrid)" opacity=".6"/>`

  for (let i = 0; i < 22; i++) {
    inner += txt(['.'], between(rand, 5, 315), between(rand, 8, 175), between(rand, 7, 11), '#dfe6ff')
  }

  inner += `<circle cx="248" cy="58" r="70" fill="url(#mg)"/>`
  inner += tiles(rand, crescentCells(10), 26 * cell, 2 * cell, cell, MOON_TILES, 5)
  inner += tiles(rand, cloudCells(rand, 14), 3 * cell, 5 * cell, cell, CLOUD_TILES, 5)
  inner += tiles(rand, cloudCells(rand, 12), 12 * cell, 15 * cell, cell, CLOUD_TILES, 5)

  return thumbSvg(MOON_BG, inner, grid('tgrid', cell, '#1a2b72') + glow('mg', MOONLIGHT, 0.2))
}

// ---------- the list ----------

export const WALLS: readonly Wall[] = [
  { id: 'ember', title: 'Ember', blurb: 'Sparks rise from a glowing bed of coals.', window: 'dark', glass: { blur: 14, tint: '#1a110d', opacity: 0.5 }, scene: emberScene, thumb: emberThumb },
  { id: 'cloud-drift', title: 'Cloud Drift', blurb: 'Character clouds sail across a soft sky.', window: 'light', glass: { blur: 12, tint: '#f2f9ff', opacity: 0.5 }, scene: cloudScene, thumb: cloudThumb },
  { id: 'honu-lagoon', title: 'Honu Lagoon', blurb: 'Sea turtles glide past bubbles and seaweed.', window: 'light', glass: { blur: 10, tint: '#e9fbfc', opacity: 0.5 }, scene: lagoonScene, thumb: lagoonThumb },
  { id: 'koi-pond', title: 'Koi Pond', blurb: 'Koi weave between lily pads and ripples.', window: 'dark', glass: { blur: 12, tint: '#0d2a24', opacity: 0.5 }, scene: koiScene, thumb: koiThumb },
  { id: 'jellyfish', title: 'Jellyfish', blurb: 'Glowing jellies drift up through marine snow.', window: 'dark', glass: { blur: 14, tint: '#0a1128', opacity: 0.5 }, scene: jellyScene, thumb: jellyThumb },
  { id: 'paper-boats', title: 'Paper Boats', blurb: 'Folded boats bob along rolling waves.', window: 'light', glass: { blur: 12, tint: '#f1f9fb', opacity: 0.5 }, scene: boatsScene, thumb: boatsThumb },
  { id: 'fireflies', title: 'Fireflies', blurb: 'Fireflies blink over a garden of glyphs.', window: 'dark', glass: { blur: 12, tint: '#0c211c', opacity: 0.45 }, scene: firefliesScene, thumb: firefliesThumb },
  { id: 'moonlit', title: 'Moonlit', blurb: 'A tiled moon and glyph clouds on a night grid.', window: 'dark', glass: { blur: 14, tint: '#0d1236', opacity: 0.5 }, scene: moonScene, thumb: moonThumb },
  { id: 'giant-march', title: 'Giant March', blurb: 'A lone wanderer on a cliff watches hundreds of giants march through the steam.', window: 'dark', glass: { blur: 14, tint: '#14181d', opacity: 0.5 }, scene: march.scene, thumb: () => BAKED_THUMBS['giant-march'], shader: 'march' },
  { id: 'aurora-cabin', title: 'Aurora Cabin', blurb: 'Northern lights over snowy peaks, a husky, and a cabin where someone works late.', window: 'dark', glass: { blur: 14, tint: '#0c1226', opacity: 0.5 }, scene: aurora.scene, thumb: () => BAKED_THUMBS['aurora-cabin'] },
  { id: 'topographic', colors: TOPO_COLORS, title: 'Topographic', blurb: 'Soft black and white contour lines that drift, merge and split.', window: 'dark', glass: { blur: 10, tint: '#000000', opacity: 0.55 }, scene: topo.scene, thumb: topo.thumb, shader: 'topo' },
  { id: 'dot-wave', title: 'Dot Wave', blurb: 'Rows of white dots rolling out of the dark like a slow wave.', window: 'dark', glass: { blur: 8, tint: '#000000', opacity: 0.55 }, scene: dotWave.scene, thumb: () => BAKED_THUMBS['dot-wave'] },
  { id: 'dither-gallery', colors: DITHER_COLORS, title: 'Dither Gallery', blurb: 'Dithered dot art of a moon, a ringed planet, butterflies and flowers, with fire in the corners.', window: 'dark', glass: { blur: 8, tint: '#000000', opacity: 0.55 }, scene: ditherGallery.scene, thumb: () => BAKED_THUMBS['dither-gallery'] },
  { id: 'neon-rain', title: 'Neon Rain', blurb: 'A rainy neon city at night, signs buzzing over a wet street.', window: 'dark', glass: { blur: 14, tint: '#070a12', opacity: 0.5 }, scene: neonRain.scene, thumb: () => BAKED_THUMBS['neon-rain'] },
  { id: 'pixel-nebula', colors: NEBULA_COLORS, title: 'Pixel Nebula', blurb: 'A violet galaxy band made of square pixels, with twinkling stars.', window: 'dark', glass: { blur: 12, tint: '#07060f', opacity: 0.5 }, scene: pixelNebula.scene, thumb: () => BAKED_THUMBS['pixel-nebula'] },
  {
    id: 'dot-tide',
    title: 'Dot Tide',
    blurb: "A field of dots under a slow rolling surface, Claude's spark turning in the corner; pick the dots' colour in the box.",
    window: 'dark',
    glass: { blur: 10, tint: '#1f1c18', opacity: 0.5 },
    // Every dot colour keeps this palette: a colour is the theme with its scene swapped.
    colors: TIDE_COLORS,
    scene: () => dotTide(),
    thumb: () => dotTide(TINTS[0].color, true),
    tints: TINTS,
    sceneIn: color => dotTide(color),
  },
]

/** The base theme's id of a choice: `dot-tide__mint` is Dot Tide. */
export function baseIdOf(id: string): string {
  return id.split(TINT_MARK)[0] ?? id
}

/** The colour's id in a choice, or the default's where it names none. */
export function tintIdOf(id: string, wall: Wall): string | undefined {
  return id.split(TINT_MARK)[1] ?? wall.tints?.[0]?.id
}

/** The theme in one of its colours; the default colour, or one it does not have, is the theme itself. */
export function variantOf(base: Wall, tintId: string): Wall {
  const paint = base.sceneIn
  const tint = base.tints?.find(each => each.id === tintId)

  if (paint === undefined || tint === undefined || tint === base.tints?.[0]) {
    return base
  }

  return { ...base, id: `${base.id}${TINT_MARK}${tint.id}`, scene: () => paint(tint.color) }
}

/** Finds a wallpaper by id or title, ignoring case, spaces and dashes. */
export function wallOf(name: string | undefined): Wall | undefined {
  if (name === undefined) {
    return undefined
  }

  if (name.includes(TINT_MARK)) {
    const base = wallOf(baseIdOf(name))

    return base === undefined ? undefined : variantOf(base, name.split(TINT_MARK)[1] ?? '')
  }

  const key = name.toLowerCase().replace(/[\s_-]+/g, '')

  return WALLS.find(wall => wall.id.replace(/-/g, '') === key || wall.title.toLowerCase().replace(/\s+/g, '') === key)
}
