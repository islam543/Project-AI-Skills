/** A wallpaper's id, such as "fireflies"; empty while none is applied. */
export type WallpaperId = string

/** What the session has done, counted by the mod for the Neon Rain dashboard. */
export type HudStats = { turns: number; toolCalls: number; failed: number; lastTurnMs: number; peakTools: number; turnTools: number }

/** The music row in the box: shown or not, the audio files in the mod's music folder, and the one playing (any session). */
export type MusicState = { isOpen: boolean; tracks: readonly string[]; playing: string }

/** One skill (or command) in the box's Skills row: its name without the slash, what it does in a line, its group. */
export type SkillEntry = { name: string; nutshell: string; group: string }

/** The Skills row: shown or not, the list read when it opened, the group showing, and the skill clicked (-1 for none). */
export type SkillsState = { isOpen: boolean; list: readonly SkillEntry[]; group: string; picked: number }

/** The app's own figures, from $.session.usage() and session.measure. */
export type HudUsage = {
  contextPercent?: number
  contextTokens?: number
  contextWindow: number
  fiveHour?: { percent: number; resetsAt?: string }
  weekly?: { percent: number; resetsAt?: string }
  costUsd?: number
  startedAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'live-wallpapers': {
      /** The picture picker shows above the prompt (only where a card can't be placed in the conversation). */
      isOpen: boolean
      /** The theme card in the conversation was put away with Close; /themes shows it again. */
      cardAway: boolean
      /** The wallpaper behind the chat now, or empty for none. */
      applied: WallpaperId
      /** What the last pick did, shown in the box above the prompt. */
      note: string
      /** The colour row in the box is open (Colors, beside Music; only for a theme that comes in colours). */
      colorsOpen: boolean
      /** The dashboard's counts, figures and clock; it shows only with Neon Rain. */
      hudStats: HudStats
      hudUsage: HudUsage
      hudNow: number
      /** /hud hid the dashboard. */
      hudHidden: boolean
      /** The music row and what plays (./hooks/music.tsx). */
      music: MusicState
      /** The Skills row (./hooks/skills.tsx). */
      skills: SkillsState
    }
  }
}
