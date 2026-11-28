// Giant March, live. The still Svg is the picture; this plays over it in the desktop app.
// Every 1.7 seconds a footfall shakes the ground, strongest at the foot of the window and fading up the sky.
// The pointer stirs the steam: the air around it shimmers, a cold light follows it, and what is already bright (the
// giants' eyes, the rim light on their edges, the steam) flares as it passes. It eases in when it arrives and out when it leaves, and
// is dimmer while it rests on the app's own panels.
import { clamp, cos, exp, fract, length, max, picture, pointers, scene, shader, sin, smoothstep, still, time, vec2, vec3, vec4 } from 'claude-code/shader'
import type { Pointer } from 'claude-code/shader'

const STEP = 1.7
const REACH = 190

const hold = (f: Pointer) => (1 - smoothstep(0, 1, f.gone)) * smoothstep(0, 0.25, f.age) * (1 - 0.5 * f.over)

export default shader({
  fps: 30,
  passes: [
    picture(p => {
      const moving = 1 - still
      const quake = exp(-fract(time / STEP) * 7) * moving
      const ground = smoothstep(0.6, 0.0, p.uv.y)
      let shift = vec2(sin(time * 71) * 0.0016, cos(time * 53) * 0.0011) * quake * ground
      let heat = 0

      for (const f of pointers) {
        const d = length(vec2(p.point - f.at)) / REACH
        const near = exp(-d * d * 2.2) * hold(f)
        heat = max(heat, near)
        shift = vec2(shift + vec2(sin(p.point.y * 0.09 + time * 7), cos(p.point.x * 0.08 + time * 6)) * 0.0022 * near * moving)
      }

      const base = scene.sample(vec2(p.uv + shift))
      const lit = smoothstep(0.55, 0.9, base.r * 0.3 + base.g * 0.59 + base.b * 0.11)
      const glow = vec3(0.8, 0.88, 1.0) * heat * 0.22
      const rgb = vec3(base.rgb + glow + vec3(base.rgb) * lit * heat * 1.4)

      return vec4(clamp(rgb, 0, 1), 1)
    }),
  ],
})
