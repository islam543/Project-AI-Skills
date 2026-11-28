import { atom, read, update } from 'claude-code'
import type { ElementConstructor, EngineInterface, Register, SvgProps } from 'claude-code'

import type { MusicState, SkillsState, WallpaperId } from '../types'
import { countTool, countTurn, hudPanel, refreshUsage, startTurn, tickHud, toggleHud } from './hud'
import { skillsNow, skillsRows, toggleSkills } from './skills'
import { endMusic, musicCommand, musicNow, openMusicFolder, playTrack, stopMusic, tickMusic, toggleMusicRow, trackTitle } from './music'
import { prepareStateDir, stateDir } from './home'
import { WALLS, baseIdOf, tintIdOf, variantOf, wallOf } from './scenes'
import type { Wall } from './scenes'

const PLUGIN = 'live-wallpapers'
/** The `$.store` key that keeps the choice: a wallpaper id, or "off". The shared file below wins when it exists. */
const STORE_KEY = 'applied'
/** Shown the first time the mod loads, before any choice is kept. */
const FIRST = 'fireflies'
/** The dashboard shows above the prompt only while this wallpaper is on. */
const NEON = 'neon-rain'

/**
 * The commands. The desktop app keeps the built-in /theme for itself, so the picker is /themes, and every wallpaper
 * has its own /theme-<id>: typing /theme lists them all.
 */
const PICKER = 'themes'
const NEXT = 'theme-next'
const OFF = 'theme-off'
const PREFIX = 'theme-'
const HUD = 'hud'
/** /music: plays the audio files of the mod's music folder (./music.tsx). */
const MUSIC = 'music'

const isOpen = atom({ plugin: 'live-wallpapers', key: 'isOpen' } as const, false)
const cardAway = atom({ plugin: 'live-wallpapers', key: 'cardAway' } as const, false)
/** The theme card's id among this mod's rows in the conversation. */
const CARD = 'theme-card'
const applied = atom({ plugin: 'live-wallpapers', key: 'applied' } as const, '' as WallpaperId)
/** What the last pick did, shown in the box above the prompt so a pick never passes silently. */
const note = atom({ plugin: 'live-wallpapers', key: 'note' } as const, '')
/** The colour row in the box is open (only offered for a theme that comes in colours). */
const colorsOpen = atom({ plugin: 'live-wallpapers', key: 'colorsOpen' } as const, false)

// Built once per load: a scene is tens of kilobytes of markup.
const scenes = new Map<string, string>()
const thumbs = new Map<string, string>()

function sceneOf(wall: Wall): string {
  const kept = scenes.get(wall.id) ?? wall.scene()
  scenes.set(wall.id, kept)

  return kept
}

function thumbOf(wall: Wall): string {
  const kept = thumbs.get(wall.id) ?? wall.thumb()
  thumbs.set(wall.id, kept)

  return kept
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** False once this build has refused `overrideColorScheme`; a reload asks again. */
let takesColorScheme = true

/**
 * Sets the scene, asking the window to match its light or dark mode. Builds differ: newer ones read the scene's name
 * as `scene` and the mode beside the backdrop; older ones read `id` and the mode inside it, and refuse an attribute
 * they do not know. So the name goes under both keys, and the mode is tried beside, then inside, then left out.
 */
async function setScene($: EngineInterface, wall: Wall) {
  // A variable, not a literal, so the extra `id` for older builds passes the type check.
  const backdrop = { scene: wall.id, id: wall.id, glass: wall.glass }
  const colors = wall.colors === undefined ? {} : { colors: wall.colors }

  // A look that follows the app's own mode names none.
  if (wall.window === 'auto') {
    return $.theme.set({ backdrop, ...colors })
  }

  if (takesColorScheme) {
    try {
      return await $.theme.set({ backdrop, ...colors, overrideColorScheme: wall.window })
    } catch (error) {
      if (!reasonOf(error).includes('does not know the attribute')) {
        throw error
      }

      takesColorScheme = false
    }
  }

  try {
    const inside = { ...backdrop, colorScheme: wall.window }

    return await $.theme.set({ backdrop: inside, ...colors })
  } catch {
    return $.theme.set({ backdrop, ...colors })
  }
}

/** The scene's name on a Backdrop: `scene` on newer builds, `id` on older ones. */
function sceneNameOf(props: { scene?: unknown; id?: unknown }): string | undefined {
  const name = props.scene ?? props.id

  return typeof name === 'string' ? name : undefined
}

// ---------- one choice for every open session ----------

/**
 * Every session of this mod reads and writes one small file in its folder under the home folder
 * (`~/.claude/live-wallpapers`, see ./home.ts), so a pick in any session reaches the others within a few seconds. A
 * file is read fresh each time; the store alone may be held in memory.
 */
const choicePath = ($: EngineInterface): string => `${stateDir($)}/.wallpaper-choice.json`

/**
 * A short log in the same folder, kept to its last 200 lines, so a press that changes nothing can be traced: did the
 * press arrive, which surface drew the card, what did the theme call answer.
 */
/** Log writes wait their turn: two at once would each read the file and the second would erase the first's line. */
let logQueue: Promise<void> = Promise.resolve()

function debugLog($: EngineInterface, line: string): Promise<void> {
  const stamped = `${new Date().toISOString()} ${line}`
  logQueue = logQueue.then(async () => {
    try {
      const path = `${stateDir($)}/.wallpaper-debug.log`
      const was = (await $.fs.exists(path)) ? String(await $.fs.read(path)) : ''
      const lines = [...was.split('\n').filter(one => one !== ''), stamped]
      await $.fs.write(path, `${lines.slice(-200).join('\n')}\n`)
    } catch {
      // Logging never stops the mod.
    }
  })

  return logQueue
}

/** Surfaces this load has drawn each site on, so a drawing is logged once, not on every redraw. */
const drawnOn = new Set<string>()

function logDrawn($: EngineInterface, site: string, surface: string): void {
  if (!drawnOn.has(`${site}:${surface}`)) {
    drawnOn.add(`${site}:${surface}`)
    void debugLog($, `drew ${site} on ${surface}`)
  }
}

/** When this session last saw or made a choice; an older choice in the file is not followed again. */
let seenAt = 0

async function readChoice($: EngineInterface): Promise<{ id: string; at: number } | undefined> {
  try {
    const path = choicePath($)

    if (!(await $.fs.exists(path))) {
      return undefined
    }

    const parsed = JSON.parse(await $.fs.read(path)) as { id?: unknown; at?: unknown }

    return typeof parsed.id === 'string' && typeof parsed.at === 'number' ? { id: parsed.id, at: parsed.at } : undefined
  } catch {
    return undefined
  }
}

async function shareChoice($: EngineInterface, id: string): Promise<void> {
  seenAt = Date.now()

  try {
    await $.fs.write(choicePath($), JSON.stringify({ id, at: seenAt }))
  } catch (error) {
    void $.ui.status(`Wallpaper not shared with other sessions: ${reasonOf(error)}`)
  }
}

/**
 * Puts a wallpaper behind the chat (none clears it) and keeps the choice; `share` also tells the other sessions.
 * Answers why nothing shows, when nothing does.
 */
/** A theme that comes in colours, picked by its plain id, takes the colour last picked for it. */
async function inTint($: EngineInterface, wall: Wall | undefined): Promise<Wall | undefined> {
  if (wall?.tints === undefined || wall.id !== baseIdOf(wall.id)) {
    return wall
  }

  const kept = await $.store.get(`tint:${wall.id}`)

  return typeof kept === 'string' ? variantOf(wall, kept) : wall
}

/** A colour from the box or a command: kept for the theme, then the theme is put on in it. */
async function pickTint($: EngineInterface, base: Wall, tintId: string): Promise<void> {
  await $.store.set(`tint:${base.id}`, tintId)
  await choose($, variantOf(base, tintId))
}

async function apply($: EngineInterface, chosen: Wall | undefined, share = true): Promise<string | undefined> {
  const wall = await inTint($, chosen)
  // A note from an earlier pick would be stale now; a pick from the list writes its own after this.
  await update($, note, () => '')

  if (wall === undefined) {
    await $.theme.clear()
    await $.store.set(STORE_KEY, 'off')
    await update($, applied, () => '')

    if (share) {
      await shareChoice($, 'off')
    }

    return undefined
  }

  const set = await setScene($, wall)
  await $.store.set(STORE_KEY, wall.id)
  await update($, applied, () => wall.id)

  if (share) {
    await shareChoice($, wall.id)
  }

  if (wall.id === NEON) {
    await refreshUsage($)
  }

  return set.isDrawn ? undefined : set.reason
}

/** Follows a choice another session made since this one last looked. */
async function follow($: EngineInterface): Promise<void> {
  const choice = await readChoice($)

  if (choice === undefined || choice.at <= seenAt) {
    return
  }

  seenAt = choice.at
  const want = choice.id === 'off' ? '' : choice.id

  if (want === (await read($, applied))) {
    return
  }

  await apply($, want === '' ? undefined : wallOf(want), false)
}

/**
 * Said when the app has no window drawing mods for this session: the choice is kept and shows once one attaches. The
 * usual case is a session that started before the mod was installed; a new session draws it.
 */
function notDrawn(wall: Wall, why: string): string {
  return `${wall.title} is saved, but this session has no window drawing wallpapers yet. Open a new session (or restart the app) and it will show. (${why})`
}

/** A pick from the list box or the picker: applied at once, and said in a toast either way. */
async function choose($: EngineInterface, wall: Wall | undefined): Promise<void> {
  void debugLog($, `choose ${wall?.id ?? 'off'}: started`)

  try {
    const why = await apply($, wall)
    void debugLog($, `choose ${wall?.id ?? 'off'}: ${why === undefined ? 'theme set and drawn' : `set, not drawn: ${why}`}`)
    const said =
      why !== undefined && wall !== undefined ? `${wall.title} saved. The app says: ${why}` : wall === undefined ? 'Wallpaper off.' : `${wall.title} is on.`
    await update($, note, () => said)
    void $.ui.toast(why !== undefined && wall !== undefined ? notDrawn(wall, why) : said)
  } catch (error) {
    void debugLog($, `choose ${wall?.id ?? 'off'}: failed: ${reasonOf(error)}`)
    await update($, note, () => `Could not change the wallpaper: ${reasonOf(error)}`)
    void $.ui.toast(`Could not change the wallpaper: ${reasonOf(error)}`)
  }
}

/** The wallpaper `by` places from the one showing, round the list. */
async function stepWall($: EngineInterface, by: number): Promise<Wall> {
  const current = await read($, applied)
  // None showing (-1) steps to the first or the last.
  const at = WALLS.findIndex(wall => wall.id === baseIdOf(current))
  const from = at < 0 ? (by > 0 ? -1 : 0) : at

  return WALLS[(from + by + WALLS.length) % WALLS.length] as Wall
}

async function switchTo($: EngineInterface, wall: Wall): Promise<string> {
  const why = await apply($, wall)

  return why === undefined ? `${wall.title} is on.` : notDrawn(wall, why)
}

/** What one of this mod's commands answers; undefined for any other command. */
async function answer($: EngineInterface, command: string, args: string): Promise<string | undefined> {
  if (command === MUSIC) {
    return musicCommand($, args)
  }

  if (command === HUD) {
    return (await toggleHud($)) ? 'Dashboard hidden. /hud brings it back.' : 'Dashboard shown while Neon Rain is on.'
  }

  if (command === NEXT) {
    return switchTo($, await stepWall($, 1))
  }

  if (command === OFF) {
    await apply($, undefined)

    return 'Wallpaper off.'
  }

  if (command.startsWith(PREFIX)) {
    const wall = WALLS.find(each => `${PREFIX}${each.id}` === command)
    const word = args.trim().toLowerCase()
    // /theme-dot-tide mint: a colour, where the theme has them.
    const tint = word === '' ? undefined : wall?.tints?.find(each => each.id === word || each.label.toLowerCase() === word)

    if (wall !== undefined && tint !== undefined) {
      await $.store.set(`tint:${wall.id}`, tint.id)

      return switchTo($, variantOf(wall, tint.id))
    }

    return wall === undefined ? undefined : switchTo($, wall)
  }

  if (command !== PICKER) {
    return undefined
  }

  const word = args.trim()
  const key = word.toLowerCase()

  if (word === '') {
    await openCard($)

    return 'Pick a wallpaper on the card below, or type /theme- to switch by name.'
  }

  if (key === 'list') {
    return WALLS.map(wall => `/${PREFIX}${wall.id}  ${wall.blurb}`).join('\n')
  }

  if (key === 'off') {
    return answer($, OFF, '')
  }

  if (key === 'next') {
    return answer($, NEXT, '')
  }

  const wall = wallOf(word)

  return wall === undefined ? `No wallpaper named "${word}". /${PICKER} list names all ${WALLS.length}.` : switchTo($, wall)
}

function isOurs(command: string): boolean {
  return command === PICKER || command === MUSIC || command === NEXT || command === OFF || command === HUD || WALLS.some(wall => `${PREFIX}${wall.id}` === command)
}

// ---------- what is drawn above the prompt ----------

type Elements = Pick<ReturnType<EngineInterface['ui']['resolve']>, 'Box' | 'Text' | 'Button'>

function titleOf(wall: Wall, now: WallpaperId): string {
  // Dot Tide in mint (`dot-tide__mint`) is still Dot Tide.
  return baseIdOf(now) === wall.id ? `${wall.title} ✓` : wall.title
}

/**
 * /themes: the theme card in the conversation, with pictures. Where the app will not place it (it said "no attached
 * client" in some desktop app sessions), the button list in the box above the prompt opens instead.
 */
async function openCard($: EngineInterface): Promise<void> {
  const placed = await $.ui.place({ id: CARD })
  await update($, cardAway, () => false)
  void debugLog($, `card placed: ${placed.isPlaced ? 'yes' : `no: ${placed.reason}`}`)

  if (!placed.isPlaced) {
    await update($, isOpen, () => true)
  }
}

/**
 * Above the prompt: the theme showing and the button that opens the list. Built only from Box, Text and Button, the
 * pieces the desktop app is known to draw in this box (pictures and borders here drew nothing).
 */
function themeLine(
  $: EngineInterface,
  { Box, Text, Button }: Elements,
  now: WallpaperId,
  open: boolean,
  said: string,
  tune: MusicState,
  colors: boolean,
  known: SkillsState,
) {
  const current = wallOf(now)?.title ?? 'Off'
  const word = open ? 'Hide themes' : 'Change theme'
  const musicWord = tune.isOpen ? 'Hide music' : 'Music'
  const hasTints = wallOf(baseIdOf(now))?.tints !== undefined
  const colorsWord = colors ? 'Hide colors' : 'Colors'
  const skillsWord = known.isOpen ? 'Hide skills' : 'Skills'

  return (
    <Box key="themes" flexDirection="row" flexWrap="wrap" alignItems="center" columnGap="sm" rowGap="sm">
      <Text dimColor>Theme</Text>
      <Text bold>{current}</Text>
      <Button key="previews" label={word} onPress={() => update($, isOpen, was => !was)}>
        {word}
      </Button>
      <Button key="music" label={musicWord} onPress={() => toggleMusicRow($)}>
        {musicWord}
      </Button>
      {hasTints
        ? [
            <Button key="colors" label={colorsWord} onPress={() => update($, colorsOpen, was => !was)}>
              {colorsWord}
            </Button>,
          ]
        : []}
      <Button
        key="skills"
        label={skillsWord}
        onPress={async () => {
          // A list the app will not give is said in the box and the log, never a button that does nothing.
          try {
            await toggleSkills($, line => void debugLog($, line))
          } catch (error) {
            void debugLog($, `skills: the list failed: ${reasonOf(error)}`)
            await update($, note, () => `Skills could not load: ${reasonOf(error)}`)
          }
        }}
      >
        {skillsWord}
      </Button>
      {tune.playing === '' ? [] : [<Text key="playing">♪ {trackTitle(tune.playing)}</Text>]}
      {said === '' ? [] : [<Text key="note" dimColor>{said}</Text>]}
    </Box>
  )
}

/** Opened by Colors while a theme that comes in colours is on: a swatch and a button for each colour, the one showing ticked. */
function tintRow($: EngineInterface, { Box, Text, Button }: Elements, now: WallpaperId) {
  const base = wallOf(baseIdOf(now))

  if (base?.tints === undefined) {
    return undefined
  }

  const current = tintIdOf(now, base)

  return (
    <Box key="tints" flexDirection="row" flexWrap="wrap" alignItems="center" columnGap="sm" rowGap="sm">
      <Text dimColor>Dots</Text>
      {base.tints.flatMap(tint => {
        const word = tint.id === current ? `${tint.label} ✓` : tint.label

        return [
          <Text key={`swatch-${tint.id}`} color={tint.color}>
            ●
          </Text>,
          <Button key={`tint-${tint.id}`} label={word} onPress={() => pickTint($, base, tint.id)}>
            {word}
          </Button>,
        ]
      })}
    </Box>
  )
}

/** The music row: a button per track in the music folder (the one playing ticked), Stop while one plays, Add music. */
function musicRow($: EngineInterface, { Box, Text, Button }: Elements, tune: MusicState) {
  return (
    <Box key="music-row" flexDirection="row" flexWrap="wrap" alignItems="center" columnGap="sm" rowGap="sm">
      <Text dimColor>Music</Text>
      {tune.tracks.length === 0 ? [<Text key="none" dimColor>No tracks yet: press Add music and drop audio files in.</Text>] : []}
      {tune.tracks.map(name => {
        const title = tune.playing === name ? `${trackTitle(name)} ✓` : trackTitle(name)

        return (
          <Button key={`track-${name}`} label={title} onPress={() => playTrack($, name)}>
            {title}
          </Button>
        )
      })}
      {tune.playing === '' ? [] : [
        <Button key="music-stop" label="■ Stop" onPress={() => stopMusic($)}>
          ■ Stop
        </Button>,
      ]}
      <Button
        key="music-folder"
        label="Add music"
        onPress={async () => {
          await update($, note, () => '')
          const said = await openMusicFolder($)
          await update($, note, () => said)
        }}
      >
        Add music
      </Button>
    </Box>
  )
}

/**
 * The list the button opens: every theme as its picture with its button under it (pictures only where the surface
 * draws them), then Off and Close, in rows that wrap. The pictures are small baked previews, so all of them together
 * stay far under the size at which the desktop app stopped drawing this box.
 */
function themeList($: EngineInterface, { Box, Button, Svg }: CardElements, now: WallpaperId) {
  const offWord = now === '' ? 'Off ✓' : 'Off'

  return (
    <Box key="list" flexDirection="row" flexWrap="wrap" alignItems="flex-end" columnGap="sm" rowGap="sm">
      {WALLS.map(wall =>
        Svg === undefined ? (
          <Button key={`pick-${wall.id}`} label={titleOf(wall, now)} onPress={() => choose($, wall)}>
            {titleOf(wall, now)}
          </Button>
        ) : (
          <Box key={`tile-${wall.id}`} flexDirection="column" alignItems="center" gap="xs">
            <Svg source={thumbOf(wall)} alt={`${wall.title}: ${wall.blurb}`} width={112} height={63} />
            <Button key={`pick-${wall.id}`} label={titleOf(wall, now)} onPress={() => choose($, wall)}>
              {titleOf(wall, now)}
            </Button>
          </Box>
        ),
      )}
      <Button key="off" label={offWord} onPress={() => choose($, undefined)}>
        {offWord}
      </Button>
      <Button key="close" label="Close" onPress={() => update($, isOpen, () => false)}>
        Close
      </Button>
    </Box>
  )
}

/** Splits a list into rows of `size`: a card's row does not wrap on desktop. */
function rows<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = []

  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size))
  }

  return out
}

type CardElements = Pick<ReturnType<EngineInterface['ui']['resolve']>, 'Box' | 'Text' | 'Button'> & { Svg?: ElementConstructor<SvgProps> }

/** The elements for the list in the box: with Svg where the surface draws pictures, without it in the terminal. */
function listElements($: EngineInterface, e: Parameters<EngineInterface['ui']['resolve']>[0] & { surface: string }): CardElements {
  if (e.surface === 'desktop' || e.surface === 'mobile') {
    const pictured = $.ui.resolve(e)

    return { Box: pictured.Box, Text: pictured.Text, Button: pictured.Button, Svg: pictured.Svg }
  }

  return $.ui.resolve(e)
}

/**
 * The theme card, a row in the conversation: Off, Close, then every theme as a button with its picture above it where
 * the surface draws pictures, four to a row. A pick applies at once and the card stays for another.
 */
function themeCard($: EngineInterface, { Box, Text, Button, Svg }: CardElements, now: WallpaperId) {
  const offWord = now === '' ? 'Off ✓' : 'Off'
  const tile = (wall: Wall) => (
    <Box key={`tile-${wall.id}`} flexDirection="column" alignItems="center" gap="xs" minWidth={18}>
      {Svg === undefined ? [] : [<Svg key={`thumb-${wall.id}`} source={thumbOf(wall)} alt={`${wall.title}: ${wall.blurb}`} width={120} height={68} />]}
      <Button key={`pick-${wall.id}`} label={titleOf(wall, now)} onPress={() => choose($, wall)}>
        {titleOf(wall, now)}
      </Button>
    </Box>
  )

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} paddingY="xs" gap="sm">
      <Box key="head" flexDirection="row" columnGap="md" alignItems="center">
        <Text bold>Wallpapers</Text>
        <Button key="off" label={offWord} onPress={() => choose($, undefined)}>
          {offWord}
        </Button>
        <Button key="close" label="Close" role="dismiss" onPress={() => update($, cardAway, () => true)}>
          Close
        </Button>
      </Box>
      {rows(WALLS, 4).map((row, k) => (
        <Box key={`row-${k}`} flexDirection="row" columnGap="md">
          {row.map(tile)}
        </Box>
      ))}
    </Box>
  )
}

let turnStartedAt = 0

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const specs = [
      { name: PICKER, description: 'Open the wallpaper picker', argumentHint: '[name | next | off | list]' },
      ...WALLS.map(wall => ({
        name: `${PREFIX}${wall.id}`,
        description: `Wallpaper: ${wall.title}. ${wall.blurb}`,
        ...(wall.tints !== undefined && { argumentHint: `[${wall.tints.map(tint => tint.id).join(' | ')}]` }),
      })),
      { name: NEXT, description: 'Switch to the next wallpaper' },
      { name: OFF, description: 'Turn the wallpaper off' },
      { name: HUD, description: 'Show or hide the Neon Rain dashboard' },
      { name: MUSIC, description: 'Music: pick a track in the box, or /music <name>, /music off, /music folder', argumentHint: '[name | off | folder]' },
    ]
    const refused: string[] = []

    for (const spec of specs) {
      try {
        await $.command.register({ ...spec, immediate: true })
      } catch {
        refused.push(`/${spec.name}`)
      }
    }

    if (refused.length > 0) {
      void $.ui.status(`Wallpaper commands not registered: ${refused.join(', ')}`)
    }

    await prepareStateDir($)
    void debugLog($, `session start; surface ${String(await $.session.surface().catch(() => 'unknown'))}`)

    // The newest choice of any session, else this mod's store, else the first wallpaper.
    const shared = await readChoice($)
    const stored = await $.store.get(STORE_KEY)
    const id = shared?.id ?? (typeof stored === 'string' ? stored : FIRST)
    seenAt = shared?.at ?? 0

    if (id !== 'off') {
      try {
        await apply($, wallOf(id), false)
      } catch (error) {
        void $.ui.status(`Wallpaper not applied: ${reasonOf(error)}`)
      }
    }

    // Every 3 seconds: follow a pick made in another session; every 30, move the dashboard's clock.
    let ticks = 0
    $.clock.every(3_000, () => {
      ticks += 1
      void follow($).catch(() => undefined)
      void tickMusic($).catch(() => undefined)

      if (ticks % 10 === 0) {
        void tickHud($)
      }
    })

    return next(e)
  })

  // Every press on this mod's buttons shows in the status line for a few seconds, so a press that changes nothing can
  // be told apart from one that never arrived.
  on('ui.press', ($, e, next) => {
    void debugLog($, `press ${e.element ?? '?'} on ${e.surface}`)
    void $.ui.status(`Wallpapers: ${e.element ?? 'button'} pressed`)
    $.clock.after(4_000, () => void $.ui.status(undefined))

    return next(e)
  }).catch(($, e, next) => next(e))

  // One hook answers every command of this mod; any other command goes on untouched.
  on('command.run', async ($, e, next) => {
    const text = await answer($, e.command, e.args)

    if (text !== undefined) {
      void debugLog($, `command /${e.command} ${e.args}`.trim() + ` -> ${text.slice(0, 400)}`)
    }

    return text === undefined ? next(e) : { text, isTextDisplayOnly: true as const }
  }).catch(($, e, next) =>
    isOurs(e.command) && !next.called
      ? { text: `/${e.command} could not change the wallpaper.`, isTextDisplayOnly: true as const }
      : next(e),
  )

  // The music stops with the session that plays it.
  on('session.end', async ($, e, next) => {
    await endMusic($).catch(() => undefined)

    return next(e)
  })

  // Sending a message folds the list and puts the picker away. A failure here never holds a prompt back.
  on('prompt.submit', async ($, e, next) => {
    turnStartedAt = Date.now()
    await update($, isOpen, () => false)
    await startTurn($)

    return next(e)
  }).catch(($, e, next) => next(e))

  // The dashboard's counts: every tool call and its failures; the call itself goes on untouched.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    const failed = (result as { isError?: boolean }).isError === true || 'deny' in result

    await countTool($, failed)

    return result
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const took = e.durationMs > 0 ? e.durationMs : Date.now() - turnStartedAt
      await countTurn($, took)

      if ((await read($, applied)) === NEON) {
        await refreshUsage($)
      }
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('session.measure', async ($, e, next) => {
    if ((await read($, applied)) === NEON) {
      await refreshUsage($)
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== PLUGIN || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const wall = wallOf(sceneNameOf(e.props))

    if (wall === undefined) {
      return next(e)
    }

    const { Svg, Shader } = $.ui.resolve(e)
    const still = <Svg isInteractive source={sceneOf(wall)} alt={`${wall.title}: ${wall.blurb}`} />

    // A shader plays the scene live in the desktop app; anywhere it can't, the Svg shows alone.
    if (wall.shader === 'march' && Shader !== undefined) {
      return <Shader module="./march-shader.ts">{still}</Shader>
    }

    if (wall.shader === 'topo' && Shader !== undefined) {
      return <Shader module="./topo-shader.ts">{still}</Shader>
    }

    return still
  })

  on('ui.render', { component: 'Placed' }, async ($, e, next) => {
    if (e.props.plugin !== PLUGIN || e.props.id !== CARD || (await read($, cardAway))) {
      return next(e)
    }

    const now = await read($, applied)
    logDrawn($, 'card', e.surface)

    // Pictures only where the surface draws them; the terminal gets the buttons alone.
    if (e.surface === 'desktop' || e.surface === 'mobile') {
      const pictured = $.ui.resolve(e)

      return themeCard($, { Box: pictured.Box, Text: pictured.Text, Button: pictured.Button, Svg: pictured.Svg }, now)
    }

    return themeCard($, $.ui.resolve(e), now)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const now = await read($, applied)
    const open = await read($, isOpen)
    const tune = await musicNow($)
    const colors = await read($, colorsOpen)
    const known = await skillsNow($)
    const said = await read($, note)
    logDrawn($, open ? 'band with list' : 'band', e.surface)

    const elements = $.ui.resolve(e)
    const { Box } = elements
    const hud = now === NEON ? await hudPanel($, elements) : undefined

    return (
      <Box flexDirection="column" gap="sm">
        {hud === undefined ? [] : [hud]}
        {themeLine($, elements, now, open, said, tune, colors, known)}
        {tune.isOpen ? [musicRow($, elements, tune)] : []}
        {[colors ? tintRow($, elements, now) : undefined].flatMap(row => (row === undefined ? [] : [row]))}
        {known.isOpen ? [skillsRows($, elements, known)] : []}
        {open ? [themeList($, listElements($, e), now)] : []}
      </Box>
    )
  }).catch(async ($, e, next) => {
    // If the dashboard fails, the line and the list still draw.
    if (next.called || e.props.hasSurvey) {
      return next(e)
    }

    const elements = $.ui.resolve(e)
    const now = await read($, applied)
    const open = await read($, isOpen)
    const tune = await musicNow($)
    const colors = await read($, colorsOpen)
    const known = await skillsNow($)
    const { Box } = elements

    return (
      <Box flexDirection="column" gap="sm">
        {themeLine($, elements, now, open, await read($, note), tune, colors, known)}
        {tune.isOpen ? [musicRow($, elements, tune)] : []}
        {[colors ? tintRow($, elements, now) : undefined].flatMap(row => (row === undefined ? [] : [row]))}
        {known.isOpen ? [skillsRows($, elements, known)] : []}
        {open ? [themeList($, listElements($, e), now)] : []}
      </Box>
    )
  })
}
