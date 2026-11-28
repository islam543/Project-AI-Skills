// Topographic, live: white contour lines on black, drawn from two noise fields that slide slowly past each other, so the
// lines fold together, merge and split. Every fifth line is an index line, brighter. The lines are soft, with a faint
// glow around each, and nothing follows the pointer. Under Reduce Motion the field holds still.
import { abs, dot, floor, fract, fwidth, mix, mod, picture, shader, sin, smoothstep, still, step, time, vec2, vec3, vec4 } from 'claude-code/shader'

const hash = (q: number) => fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453)

const noise = (q: number) => {
  const i = vec2(floor(q))
  const f = vec2(fract(q))
  const u = vec2(f * f * (3 - 2 * f))
  const a = hash(i)
  const b = hash(vec2(i + vec2(1, 0)))
  const c = hash(vec2(i + vec2(0, 1)))
  const d = hash(vec2(i + vec2(1, 1)))

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y)
}

const fbm = (q: number) => noise(q) * 0.55 + noise(vec2(q * 2.03 + 7.1)) * 0.28 + noise(vec2(q * 4.1 + 3.3)) * 0.17

export default shader({
  fps: 30,
  passes: [
    picture(p => {
      const t = time * 0.1 * (1 - still)
      const q = vec2(p.point * 0.0032)
      const v = fbm(vec2(q + vec2(t * 0.9, t * 0.4))) * 0.6 + fbm(vec2(q * 1.3 - vec2(t * 0.5, -t * 0.7) + 4.2)) * 0.6
      const k = v * 14
      const near = abs(fract(k + 0.5) - 0.5)
      const w = fwidth(k)
      // A soft core and a faint glow: a little blur on every line.
      const line = 1 - smoothstep(0, w * 2.6, near)
      const halo = (1 - smoothstep(0, w * 7, near)) * 0.22
      const major = 1 - step(0.5, mod(floor(k + 0.5), 5))
      const ink = (line + halo) * mix(0.55, 1, major)

      return vec4(vec3(ink), 1)
    }),
  ],
})
