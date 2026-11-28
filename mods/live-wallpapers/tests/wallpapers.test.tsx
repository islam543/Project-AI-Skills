import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import { LOOK_PROBLEMS } from '../hooks/looks'
import { WALLS, wallOf } from '../hooks/scenes'

const PLUGIN = 'live-wallpapers'
/** The scenes the stand-in engine was asked to set with the app's colours. */
const colored: string[] = []
/** The slash commands the stand-in session knows: built-in, your own, plugins' (two skills and a long one), a mod's,
 *  an MCP prompt. One description hides a line separator, as text from elsewhere can. */
const COMMANDS = [
  { name: 'clear', description: 'Clear the conversation', source: 'builtin' as const },
  { name: 'brief', description: 'Turn a task into a short brief (objective, why, constraints, scope, check) before any code', source: 'user' as const },
  { name: 'design:critique', description: 'Review a design for usability, hierarchy, and consistency. Trigger with a screen or a flow.', source: 'plugin' as const, plugin: 'design' },
  { name: 'design:debug', description: 'Structured debugging session\u2028 reproduce, isolate, diagnose, and fix.', source: 'plugin' as const, plugin: 'design' },
  { name: 'design:zlong', description: 'word '.repeat(80), source: 'plugin' as const, plugin: 'design' },
  { name: 'theme-moonlit', description: 'Wallpaper: Moonlit.', source: 'plugin' as const, plugin: 'live-wallpapers' },
  { name: 'fireworks', description: 'A show over the theme.', source: 'plugin' as const },
  { name: 'github:pr', description: 'An MCP prompt.', source: 'mcp' as const },
]

/** The clips the stand-in engine was asked to play, and the programs it was asked to run. */
const played: string[] = []
const ran: string[] = []

/** Stands for the engine beneath the mod: a store, commands, and a window that draws themes. */
function engine(
  on: On,
  sets: string[],
  registered: string[] = [],
  files = new Map<string, string>(),
  refuse: { draw?: string; place?: string; list?: string } = {},
): void {
  mock.store(on)
  // Files are kept by name, so a test can write the shared choice file as another session would.
  const name = (path: string): string => path.split('/').pop() ?? path
  on('fs.exists', (_, e) => ({ value: files.has(name(e.path)) }))
  on('fs.read', (_, e) => ({ value: files.get(name(e.path)) ?? '' }))
  on('fs.write', (_, e) => {
    files.set(name(e.path), e.text)

    return { value: undefined }
  })
  on('session.usage', () => ({
    value: {
      startedAt: Date.now() - 14 * 60_000,
      context: { window: 1_000_000, tokens: 109_000, percent: 11 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 96, resetsAt: new Date(Date.now() + 130 * 60_000).toISOString() }],
      cost: { usd: 1.25 },
    },
  }))
  on('command.register', (_, e) => {
    registered.push(e.name)

    return { value: { command: e.name } }
  })
  on('theme.set', (_, e) => {
    const backdrop = (e.backdrop ?? {}) as { scene?: unknown; id?: unknown }
    sets.push(String(backdrop.scene ?? backdrop.id ?? ''))

    if ((e as { colors?: unknown }).colors !== undefined) {
      colored.push(String(backdrop.scene ?? backdrop.id ?? ''))
    }

    return { value: refuse.draw === undefined ? { isDrawn: true, requestId: 'theme' } : { isDrawn: false, reason: refuse.draw } }
  })
  on('theme.clear', () => {
    sets.push('cleared')

    return { value: { isDrawn: false, reason: 'cleared' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  // The mod's music folder holds one track and a note that is not audio.
  on('fs.list', () => ({
    value: [
      { name: 'soft-rain.m4a', kind: 'file' as const, size: 366_022, mtimeMs: 0, isLink: false },
      { name: 'notes.txt', kind: 'file' as const, size: 10, mtimeMs: 0, isLink: false },
    ],
  }))
  on('audio.play', (_, e) => {
    played.push(String((e.clip as { asset?: string }).asset))

    return { value: undefined }
  })
  on('process.run', (_, e) => {
    ran.push(e.argv.join(' '))

    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  // A home folder, so the shared files go under it and not beside the plugin's own folder.
  on('env.get', (_, e) => ({ value: e.name === 'HOME' ? '/home/tester' : undefined }))
  on('command.list', () => {
    // A hook's deny makes the call itself fail, as the app's list would.
    return refuse.list === undefined ? { value: COMMANDS } : { deny: refuse.list }
  })
  on('ui.place', () => ({ value: refuse.place === undefined ? { isPlaced: true, requestId: 'card' } : { isPlaced: false, reason: refuse.place } }))
}

/** A slash command as the person types it at the prompt. */
function typed(command: string, args = '') {
  return { command, args, origin: { kind: 'composer' as const }, presentation: { isFullscreen: false, columns: 100 } }
}

/** The theme card /themes places in the conversation. */
const CARD = { plugin: PLUGIN, component: 'Placed', props: { id: 'theme-card', plugin: PLUGIN } } as const

const BAND = {
  plugin: PLUGIN,
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 40,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('every scene and thumbnail is markup the backdrop accepts', async () => {
  for (const wall of WALLS) {
    for (const svg of [wall.scene(), wall.thumb()]) {
      expect(svg.startsWith('<svg')).toBe(true)
      expect(svg.length < 131072).toBe(true)
      // No backslash, comment, CDATA, image or outside link; href only to a shape in the same scene.
      expect(/[\\]|<!--|CDATA|<image|@import|@font-face|data:/.test(svg)).toBe(false)
      expect(/href="(?!#)/.test(svg)).toBe(false)
      expect(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(svg)).toBe(false)
      expect(/url\((?!#)/.test(svg)).toBe(false)
    }
  }
})

test('the preview pictures stay small enough for the box to draw them all', async () => {
  // The desktop app drew nothing for the box once its pictures passed roughly 200,000 characters in all.
  const sizes = WALLS.map(wall => wall.thumb().length)
  expect(sizes.reduce((sum, size) => sum + size, 0) < 100_000).toBe(true)
  expect(sizes.every(size => size > 300 && size < 10_000)).toBe(true)
})

test('every wallpaper draws behind the chat on desktop', async $ => {
  for (const wall of WALLS) {
    const ui = await $.ui.mount({
      plugin: PLUGIN,
      surface: 'desktop',
      component: 'Backdrop',
      props: { scene: wall.id, plugin: PLUGIN, glass: false },
    })

    expect(await ui.find({ type: 'Svg' })).toBeDefined()
    await ui.unmount()
  }
})

test('the first session shows Fireflies, and the picker applies and keeps a pick', async ($, on) => {
  const sets: string[] = []
  engine(on, sets)
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets).toEqual(['fireflies'])

  await $.command.run(typed('themes'))

  // The card in the conversation has a button for every theme, with pictures on desktop and buttons alone in the terminal.
  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...CARD, surface })

    for (const wall of WALLS) {
      expect(await ui.find({ key: `pick-${wall.id}` })).toBeDefined()
    }

    expect((await ui.find({ type: 'Svg' })) !== undefined).toBe(surface === 'desktop')
    await ui.unmount()
  }

  const ui = await $.ui.mount({ ...CARD, surface: 'desktop' })
  await ui.press({ key: 'pick-koi-pond' })
  expect(sets.at(-1)).toBe('koi-pond')
  // The card stays for another pick until Close.
  await ui.press({ key: 'pick-moonlit' })
  expect(sets.at(-1)).toBe('moonlit')
  await ui.press({ key: 'close' })
  expect(await ui.find({ key: 'pick-moonlit' })).toBeUndefined()
  await ui.unmount()

  // The next session starts on the kept pick, not on Fireflies.
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)).toBe('moonlit')
})

test('every wallpaper has its own command, and the switch commands change it', async ($, on) => {
  const sets: string[] = []
  const registered: string[] = []
  engine(on, sets, registered)
  mock.clock(on)
  on('command.run', () => ({ text: 'another command' }))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const wall of WALLS) {
    expect(registered).toContain(`theme-${wall.id}`)
  }

  expect(registered).toContain('themes')
  expect((await $.command.run(typed('theme-moonlit'))).text).toBe('Moonlit is on.')
  expect(sets.at(-1)).toBe('moonlit')
  const after = WALLS[(WALLS.findIndex(wall => wall.id === 'moonlit') + 1) % WALLS.length]
  expect((await $.command.run(typed('theme-next'))).text).toBe(`${after?.title} is on.`)
  expect((await $.command.run(typed('themes', 'jellyfish'))).text).toBe('Jellyfish is on.')
  expect((await $.command.run(typed('theme-off'))).text).toBe('Wallpaper off.')
  expect(sets.at(-1)).toBe('cleared')
  // Commands that are not the mod's, the built-in /theme included, pass through.
  expect((await $.command.run(typed('theme'))).text).toBe('another command')
  expect((await $.command.run(typed('theme-unknown'))).text).toBe('another command')
})

test('the box above the prompt opens a list of theme buttons, applies a pick, says so, and closes', async ($, on) => {
  const sets: string[] = []
  engine(on, sets)
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.command.run(typed('theme-giant-march'))

  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /Giant March/ })).toBeDefined()
    expect(await ui.find({ key: 'pick-moonlit' })).toBeUndefined()

    await ui.press({ key: 'previews' })
    // A picture above each button on desktop; the terminal draws no pictures.
    expect((await ui.find({ type: 'Svg' })) !== undefined).toBe(surface === 'desktop')

    for (const wall of WALLS) {
      expect(await ui.find({ key: `pick-${wall.id}` })).toBeDefined()
    }

    await ui.press({ key: 'pick-moonlit' })
    expect(sets.at(-1)).toBe('moonlit')
    expect(await ui.find({ type: 'Text', text: /Moonlit is on/ })).toBeDefined()

    await ui.press({ key: 'close' })
    expect(await ui.find({ key: 'pick-moonlit' })).toBeUndefined()
    await ui.unmount()
    await $.command.run(typed('theme-giant-march'))
  }
})

test('the box plays a track from the music folder on a loop, stops it, and opens the folder', async ($, on) => {
  const sets: string[] = []
  const files = new Map<string, string>()
  engine(on, sets, [], files)
  const clock = mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'music' })
  // Audio files only: the note in the folder is no track.
  expect(await ui.find({ key: 'track-soft-rain.m4a' })).toBeDefined()
  expect(await ui.find({ key: 'track-notes.txt' })).toBeUndefined()

  await ui.press({ key: 'track-soft-rain.m4a' })
  expect(played.at(-1)).toBe('music/soft-rain.m4a')
  expect(await ui.find({ type: 'Text', text: /♪ Soft Rain/ })).toBeDefined()
  expect(JSON.parse(files.get('.music.json') ?? '{}').track).toBe('soft-rain.m4a')

  await ui.press({ key: 'music-stop' })
  expect(await ui.find({ type: 'Text', text: /♪/ })).toBeUndefined()
  expect(JSON.parse(files.get('.music.json') ?? '{}').track).toBe('')

  await ui.press({ key: 'music-folder' })
  expect(ran.some(line => line.startsWith('open ') && line.endsWith('/music'))).toBe(true)

  // By name too; and another session taking over shows here within a few seconds.
  expect((await $.command.run(typed('music', 'soft'))).text).toBe('♪ Soft Rain is playing. /music off stops it.')
  files.set('.music.json', JSON.stringify({ track: '', by: 'another-session', at: Date.now() }))
  await clock.advance(3_100)
  expect(await ui.find({ type: 'Text', text: /♪/ })).toBeUndefined()
  expect((await $.command.run(typed('music', 'off'))).text).toBe('Music off.')
  await ui.unmount()
})

test('Dot Tide offers its dot colours behind Colors in the box, keeps the colour, and draws in it', async ($, on) => {
  const sets: string[] = []
  engine(on, sets)
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  // No Colors button for a theme without colours.
  let ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ key: 'colors' })).toBeUndefined()
  expect(await ui.find({ key: 'tint-mint' })).toBeUndefined()
  await ui.unmount()

  expect((await $.command.run(typed('theme-dot-tide'))).text).toBe('Dot Tide is on.')
  expect(sets.at(-1)).toBe('dot-tide')
  ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const label = async (key: string): Promise<unknown> => ((await ui.find({ key })) as { props?: { label?: unknown } } | undefined)?.props?.label
  // The colours stay folded until Colors, beside Music, opens them.
  expect(await label('colors')).toBe('Colors')
  expect(await ui.find({ key: 'tint-ash' })).toBeUndefined()
  await ui.press({ key: 'colors' })
  expect(await label('colors')).toBe('Hide colors')
  expect(await label('tint-ash')).toBe('Ash ✓')
  await ui.press({ key: 'tint-mint' })
  expect(sets.at(-1)).toBe('dot-tide__mint')
  // The palette goes to the app with the scene, so the side panel takes it too.
  expect(colored).toContain('dot-tide__mint')
  expect(await label('tint-mint')).toBe('Mint ✓')
  expect(await label('tint-ash')).toBe('Ash')
  // Still Dot Tide in the list, ticked.
  await ui.press({ key: 'previews' })
  expect(await label('pick-dot-tide')).toBe('Dot Tide ✓')
  await ui.press({ key: 'colors' })
  expect(await ui.find({ key: 'tint-mint' })).toBeUndefined()
  await ui.unmount()

  // The coloured scene draws, in its colour, behind the chat.
  const back = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Backdrop', props: { scene: 'dot-tide__mint', plugin: PLUGIN, glass: false } })
  const svg = (await back.find({ type: 'Svg' })) as { props?: { source?: string } } | undefined
  expect(svg?.props?.source?.includes('#78d3ad')).toBe(true)
  await back.unmount()

  // Away and back: Dot Tide comes back in mint; a command names another colour; Ash is the plain theme again.
  await $.command.run(typed('theme-moonlit'))
  await $.command.run(typed('theme-dot-tide'))
  expect(sets.at(-1)).toBe('dot-tide__mint')
  await $.command.run(typed('theme-dot-tide', 'rose'))
  expect(sets.at(-1)).toBe('dot-tide__rose')
  await $.command.run(typed('theme-dot-tide', 'ash'))
  expect(sets.at(-1)).toBe('dot-tide')

  // The next session starts on the kept colour.
  await $.command.run(typed('theme-dot-tide', 'violet'))
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)).toBe('dot-tide__violet')
})

test('four themes bring the app colours too, and no palette is one the desktop app refuses to paint', async () => {
  for (const [id, problems] of Object.entries(LOOK_PROBLEMS)) {
    expect(problems.filter(line => line.startsWith("Desktop won't paint this theme"))).toEqual([])
    expect(wallOf(id)?.colors).toBeDefined()
  }

  // Every dot colour of Dot Tide keeps its palette.
  expect(wallOf('dot-tide__mint')?.colors).toBe(wallOf('dot-tide')?.colors)
})

test('Skills in the box lists your skills by group, and says what the one you click does', async ($, on) => {
  const sets: string[] = []
  const files = new Map<string, string>()
  engine(on, sets, [], files)
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  const label = async (key: string): Promise<unknown> => ((await ui.find({ key })) as { props?: { label?: unknown } } | undefined)?.props?.label
  expect(await label('skills')).toBe('Skills')
  expect(await ui.find({ key: 'skill-group-0' })).toBeUndefined()

  await ui.press({ key: 'skills' })
  expect(await label('skills')).toBe('Hide skills')
  // Your own first, then each plugin; no built-in command, MCP prompt or mod command.
  expect(await label('skill-group-0')).toBe('Mine (1) ✓')
  expect(await label('skill-group-1')).toBe('design (3)')
  expect(await ui.find({ key: 'skill-group-2' })).toBeUndefined()
  expect(await label('skill-0')).toBe('brief')
  expect(await ui.find({ key: 'skill-1' })).toBeUndefined()

  await ui.press({ key: 'skill-0' })
  expect(await ui.find({ type: 'Text', text: /^Turn a task into a short brief/ })).toBeDefined()

  await ui.press({ key: 'skill-group-1' })
  expect(await ui.find({ key: 'skill-0' })).toBeUndefined()
  // Named without the group on its button; the line under it gives the full /name to type.
  expect(await label('skill-1')).toBe('critique')
  await ui.press({ key: 'skill-1' })
  expect(await label('skill-1')).toBe('critique ✓')
  // The first sentence, not the rest.
  expect(await ui.find({ type: 'Text', text: /^Review a design for usability, hierarchy, and consistency\.$/ })).toBeDefined()

  // Text from elsewhere is cleaned: the hidden line separator became one plain space, and a long one is cut to a line.
  await ui.press({ key: 'skill-2' })
  expect(await ui.find({ type: 'Text', text: /^Structured debugging session reproduce, isolate/ })).toBeDefined()
  await ui.press({ key: 'skill-3' })
  expect(await ui.find({ type: 'Text', text: /^(word ){20,}.*…$/ })).toBeDefined()

  await ui.press({ key: 'skills' })
  expect(await ui.find({ key: 'skill-group-0' })).toBeUndefined()
  await ui.unmount()
  expect((files.get('.wallpaper-debug.log') ?? '').includes('skills: 8 commands (builtin 1, user 1, plugin 5, mcp 1); kept 4')).toBe(true)
})

test('Skills says why in the box when the app will not give the list', async ($, on) => {
  const sets: string[] = []
  engine(on, sets, [], new Map(), { list: 'command.list is not available' })
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'skills' })
  expect(await ui.find({ type: 'Text', text: /^Skills could not load: .*command\.list is not available/ })).toBeDefined()
  await ui.unmount()
})

test('a pick the app saves but does not draw says why in the box', async ($, on) => {
  const sets: string[] = []
  engine(on, sets, [], new Map(), { draw: 'no attached desktop or mobile client draws themes yet' })
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await ui.press({ key: 'previews' })
  await ui.press({ key: 'pick-ember' })
  expect(await ui.find({ type: 'Text', text: /Ember saved\. The app says: no attached/ })).toBeDefined()
  await ui.unmount()
})

test('/themes opens the list in the box when the app will not place the card', async ($, on) => {
  const sets: string[] = []
  engine(on, sets, [], new Map(), { place: 'no attached client' })
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  await $.command.run(typed('themes'))
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ key: 'pick-koi-pond' })).toBeDefined()
  await ui.press({ key: 'pick-koi-pond' })
  expect(sets.at(-1)).toBe('koi-pond')
  await ui.unmount()
})

test('a pick made in another session is followed within a few seconds', async ($, on) => {
  const sets: string[] = []
  const files = new Map<string, string>()
  engine(on, sets, [], files)
  const clock = mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  // The shared files live in their own folder under the home folder, which an update of the plugin leaves alone.
  expect(ran).toContain('mkdir -p /home/tester/.claude/live-wallpapers')
  // A pick here is written to the shared file.
  await $.command.run(typed('theme-moonlit'))
  expect(JSON.parse(files.get('.wallpaper-choice.json') ?? '{}').id).toBe('moonlit')

  // Another session writes its choice to the shared file; this one follows on its next check.
  files.set('.wallpaper-choice.json', JSON.stringify({ id: 'jellyfish', at: Date.now() + 60_000 }))
  await clock.advance(3_100)
  expect(sets.at(-1)).toBe('jellyfish')
})

test('the dashboard shows only with Neon Rain', async ($, on) => {
  const sets: string[] = []
  engine(on, sets)
  mock.clock(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.command.run(typed('theme-fireflies'))
  let ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /CONTEXT/ })).toBeUndefined()
  await ui.unmount()

  await $.command.run(typed('theme-neon-rain'))
  ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /11% used/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /96%/ })).toBeDefined()
  expect(await ui.find({ key: 'previews' })).toBeDefined()
  await ui.unmount()
})

// The test host keeps no Shader in the drawn tree (even a do-nothing one), so only the still scene, which every
// surface falls back to, can be checked here; the shader is checked by eye in the app.
test('Giant March draws its still scene with hover targets on desktop', async $ => {
  const ui = await $.ui.mount({
    plugin: PLUGIN,
    surface: 'desktop',
    component: 'Backdrop',
    props: { scene: 'giant-march', plugin: PLUGIN, glass: false },
  })

  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
  const scene = WALLS.find(wall => wall.id === 'giant-march')?.scene() ?? ''
  expect(scene.includes('.gi:hover')).toBe(true)
  expect(scene.includes('class="wd"')).toBe(true)
})
