// The Neon Rain dashboard: context fill, plan limits, cost and the session's counts, drawn in text only (this build
// has no Progress element). register.tsx shows it above the prompt while Neon Rain is the wallpaper.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, SessionUsage } from 'claude-code'

import type { HudStats, HudUsage } from '../types'

export const ZERO: HudStats = { turns: 0, toolCalls: 0, failed: 0, lastTurnMs: 0, peakTools: 0, turnTools: 0 }

export const hudStats = atom({ plugin: 'live-wallpapers', key: 'hudStats' } as const, ZERO)
export const hudUsage = atom({ plugin: 'live-wallpapers', key: 'hudUsage' } as const, { contextWindow: 0, startedAt: 0 } as HudUsage)
export const hudNow = atom({ plugin: 'live-wallpapers', key: 'hudNow' } as const, 0)
export const hudHidden = atom({ plugin: 'live-wallpapers', key: 'hudHidden' } as const, false)

const AMBER = '#ffc14d'
const CYAN = '#2de2e6'
const PINK = '#ff3d8b'
const DIM = '#7d8aa8'

function toUsage(u: SessionUsage): HudUsage {
  const limit = (kind: string): HudUsage['fiveHour'] => {
    const found = u.rateLimits.find(each => each.kind === kind)

    return found === undefined ? undefined : { percent: found.percentUsed, ...(found.resetsAt === undefined ? {} : { resetsAt: found.resetsAt }) }
  }
  const fiveHour = limit('five_hour')
  const weekly = limit('seven_day')

  return {
    contextWindow: u.context.window,
    startedAt: u.startedAt,
    ...(u.context.percent === undefined ? {} : { contextPercent: u.context.percent }),
    ...(u.context.tokens === undefined ? {} : { contextTokens: u.context.tokens }),
    ...(fiveHour === undefined ? {} : { fiveHour }),
    ...(weekly === undefined ? {} : { weekly }),
    ...(u.cost === undefined ? {} : { costUsd: u.cost.usd }),
  }
}

/** Reads the app's figures again; a failure leaves the last ones standing. */
export async function refreshUsage($: EngineInterface): Promise<void> {
  try {
    const fresh = toUsage(await $.session.usage())
    await update($, hudUsage, () => fresh)
    await update($, hudNow, () => Date.now())
  } catch {
    // The dashboard keeps what it had.
  }
}

/** 12k, 1.1M: a token count in a few characters. */
function tokens(n: number): string {
  return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n)
}

/** How long until a reset, as 2h 10m or 3d 5h. */
function until(iso: string | undefined, at: number): string {
  if (iso === undefined) {
    return ''
  }

  const minutes = Math.max(0, Math.round((Date.parse(iso) - at) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)

  return days > 0 ? `resets in ${days}d ${hours}h` : `resets in ${hours}h ${minutes % 60}m`
}

/** A segmented bar in text, ■ lit and □ unlit. */
function bar(value: number, cells = 18): [string, string] {
  const lit = Math.round(Math.min(1, Math.max(0, value)) * cells)

  return ['■'.repeat(lit), '□'.repeat(cells - lit)]
}

function clock(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60_000))

  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

type Elements = Pick<ReturnType<EngineInterface['ui']['resolve']>, 'Box' | 'Text'>

/** The dashboard's tree, or nothing while /hud has it hidden. */
export async function hudPanel($: EngineInterface, { Box, Text }: Elements) {
  if (await read($, hudHidden)) {
    return undefined
  }

  const s = await read($, hudStats)
  const u = await read($, hudUsage)
  const at = (await read($, hudNow)) || Date.now()
  const contextPercent = Math.round(u.contextPercent ?? 0)
  const meter = (key: string, value: number, color: string) => {
    const [lit, unlit] = bar(value)

    return (
      <Box key={key} flexDirection="row">
        <Text color={color}>{lit}</Text>
        <Text color={DIM}>{unlit}</Text>
      </Box>
    )
  }
  const limitRow = (label: string, limit: HudUsage['fiveHour'], color: string) =>
    limit === undefined ? (
      <Text key={label} color={DIM}>{`${label.toUpperCase()}  shows after the first reply`}</Text>
    ) : (
      <Box key={label} flexDirection="column">
        <Box flexDirection="row" columnGap="sm">
          <Text color={AMBER}>{label.toUpperCase()}</Text>
          <Text color={color} bold>{`${Math.round(limit.percent)}%`}</Text>
        </Box>
        {meter(`${label}-bar`, limit.percent / 100, color)}
        <Text color={DIM}>{until(limit.resetsAt, at)}</Text>
      </Box>
    )

  return (
    <Box key="hud" flexDirection="column" borderStyle="round" borderColor={AMBER} paddingX={1} gap="xs">
      <Box key="panels" flexDirection="row" flexWrap="wrap" columnGap="lg" rowGap="sm">
        <Box key="context" flexDirection="column" gap="xs" minWidth={28}>
          <Text color={AMBER} bold>CONTEXT</Text>
          <Text color={CYAN} bold size="heading">{`${contextPercent}% used`}</Text>
          {meter('context-bar', contextPercent / 100, CYAN)}
          <Text color={DIM}>{u.contextTokens === undefined ? `of ${tokens(u.contextWindow)} tokens` : `${tokens(u.contextTokens)} of ${tokens(u.contextWindow)} tokens`}</Text>
        </Box>
        <Box key="limits" flexDirection="column" gap="xs" minWidth={34}>
          <Text color={AMBER} bold>PLAN LIMITS</Text>
          {limitRow('5-hour', u.fiveHour, PINK)}
          {limitRow('Weekly', u.weekly, CYAN)}
        </Box>
        <Box key="tools" flexDirection="column" gap="xs" minWidth={22}>
          <Text color={AMBER} bold>TOOL CALLS</Text>
          <Text color={CYAN} bold size="heading">{String(s.toolCalls)}</Text>
          <Text color={DIM}>{`peak ${s.peakTools} in one turn${u.costUsd === undefined ? '' : ` · $${u.costUsd.toFixed(2)} so far`}`}</Text>
        </Box>
      </Box>
      <Box key="status" flexDirection="row" flexWrap="wrap" columnGap="md">
        <Text color={PINK} bold>◆ HUD</Text>
        <Text color={AMBER}>{`TURNS ${s.turns}`}</Text>
        <Text color={AMBER}>{`LAST TURN ${Math.round(s.lastTurnMs / 1000)}s`}</Text>
        <Text color={s.failed > 0 ? PINK : AMBER}>{`FAILED ${s.failed}`}</Text>
        <Text color={AMBER}>{`UPTIME ${clock(at - (u.startedAt || at))}`}</Text>
        <Text color={CYAN} bold>● ACTIVE</Text>
      </Box>
    </Box>
  )
}

// The dashboard's own writes, so each file reads and writes only the state it declares.

/** /hud: hides or shows the dashboard; answers whether it is now hidden. */
export async function toggleHud($: EngineInterface): Promise<boolean> {
  const hidden = !(await read($, hudHidden))
  await update($, hudHidden, () => hidden)

  return hidden
}

export async function startTurn($: EngineInterface): Promise<void> {
  await update($, hudStats, was => ({ ...was, turnTools: 0 }))
}

export async function countTool($: EngineInterface, failed: boolean): Promise<void> {
  await update($, hudStats, was => ({ ...was, toolCalls: was.toolCalls + 1, turnTools: was.turnTools + 1, failed: was.failed + (failed ? 1 : 0) }))
}

export async function countTurn($: EngineInterface, took: number): Promise<void> {
  await update($, hudStats, was => ({ ...was, turns: was.turns + 1, lastTurnMs: took, peakTools: Math.max(was.peakTools, was.turnTools) }))
}

/** Moves the dashboard's clock (uptime and the reset countdowns). */
export async function tickHud($: EngineInterface): Promise<void> {
  await update($, hudNow, () => Date.now())
}
