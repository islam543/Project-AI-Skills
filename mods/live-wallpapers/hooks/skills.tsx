import { atom, read, update } from 'claude-code'
import type { CommandInfo, EngineInterface } from 'claude-code'

import type { SkillEntry, SkillsState } from '../types'

/**
 * The Skills row of the box above the prompt: your skills (and the commands that come the same way, since the app's
 * list does not tell them apart), one group at a time, and what the one you click does, in a line.
 *
 * The list is `$.command.list()`, the slash commands this session knows, less the app's built-in ones, MCP prompts and
 * the commands of mods. Every word of it is someone else's text, and one bad character can stop the whole box drawing
 * with no error shown, so each string is cleaned and cut before it reaches the box.
 */
export const skills = atom({ plugin: 'live-wallpapers', key: 'skills' } as const, {
  isOpen: false,
  list: [],
  group: '',
  picked: -1,
} as SkillsState)

/** Mods whose slash commands are not skills: this one, and two other theme mods that may be installed beside it. */
const MODS = new Set(['live-wallpapers', 'reaching', 'theme-examples'])
/** Names of those mods' commands, for when the app does not say which plugin added one. */
const MOD_COMMAND = /^(theme-.+|themes|music|hud|reaching|custom-theme|fireworks)$/
const MINE = 'Mine'
/**
 * Groups left out of the box, by their names in it (a plugin's name). Empty here: add the names of large groups you
 * do not browse from the box, such as `'engineering'`, to keep it short. Their skills still work when typed.
 */
const HIDDEN_GROUPS = new Set<string>([])

/** Text the box can draw: no control or direction characters, single spaces, at most `max` long, cut at a word. */
export function clean(text: string, max: number): string {
  const flat = text
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g, ' ')
    .replace(/^[\u0300-\u036f\u2800]+/, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (flat.length <= max) {
    return flat
  }

  const cut = flat.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')

  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.(-]+$/, '')}…`
}

/** What a skill does in a nutshell: the first sentence of its own description, cut to a line. */
export function nutshellOf(description: string): string {
  const flat = clean(description, 2_000)
  const first = flat.split(/(?<=[.!?])\s+/)[0] ?? flat

  return clean(first === '' ? 'No description.' : first, 170)
}

function groupOf(info: CommandInfo): string {
  if (info.source === 'user') {
    return MINE
  }

  return clean(info.plugin ?? (info.name.includes(':') ? info.name.split(':')[0] ?? 'Other' : 'Other'), 28)
}

/** Reads the session's slash commands again, keeps the skills, and opens on the first group. Logs what came back. */
export async function refreshSkills($: EngineInterface, log: (line: string) => void): Promise<void> {
  const all = await $.command.list()
  const kept = all.filter(
    info =>
      (info.source === 'user' || info.source === 'plugin') &&
      !MODS.has(info.plugin ?? '') &&
      !MOD_COMMAND.test(info.name) &&
      !HIDDEN_GROUPS.has(groupOf(info)),
  )
  const counts = all.reduce<Record<string, number>>((tally, info) => ({ ...tally, [info.source]: (tally[info.source] ?? 0) + 1 }), {})
  log(`skills: ${all.length} commands (${Object.entries(counts).map(([source, n]) => `${source} ${n}`).join(', ')}); kept ${kept.length}, e.g. ${kept.slice(0, 4).map(info => info.name).join(', ')}`)

  const list: SkillEntry[] = kept
    .map(info => ({ name: clean(info.name, 60), nutshell: nutshellOf(info.description), group: groupOf(info) }))
    .sort((a, b) => (a.group === b.group ? a.name.localeCompare(b.name) : a.group === MINE ? -1 : b.group === MINE ? 1 : a.group.localeCompare(b.group)))

  await update($, skills, was => ({
    ...was,
    list,
    group: list.some(entry => entry.group === was.group) ? was.group : list[0]?.group ?? '',
    picked: -1,
  }))
}

/** A skill's name on its button: without its group in front, since the group's button already says it. */
function shortOf(entry: SkillEntry): string {
  return entry.name.startsWith(`${entry.group}:`) ? entry.name.slice(entry.group.length + 1) : entry.name
}

/** Shows or hides the Skills row; opening it reads the list again. */
export async function toggleSkills($: EngineInterface, log: (line: string) => void): Promise<void> {
  const was = await read($, skills)

  if (!was.isOpen) {
    await refreshSkills($, log)
  }

  await update($, skills, now => ({ ...now, isOpen: !was.isOpen }))
}

/** This session's Skills state, for the box. */
export function skillsNow($: EngineInterface): Promise<SkillsState> {
  return read($, skills)
}

type Elements = Pick<ReturnType<EngineInterface['ui']['resolve']>, 'Box' | 'Text' | 'Button'>

/**
 * The Skills rows: a line saying what to do, a button per group with its count, the chosen group's skills as buttons
 * (named without their group), and the one clicked, by its full /name, with what it does. Wrapped rows keep a gap
 * between them, so buttons never overlap. Buttons are keyed by their place in the list, since names repeat.
 */
export function skillsRows($: EngineInterface, { Box, Text, Button }: Elements, state: SkillsState) {
  const groups = [...new Set(state.list.map(entry => entry.group))]
  const picked = state.list[state.picked]

  return (
    <Box key="skills-rows" flexDirection="column" gap="sm">
      <Text key="skills-title" dimColor>
        {state.list.length === 0 ? 'Skills and commands: none found in this session.' : 'Skills and commands: pick a group, then a skill.'}
      </Text>
      <Box key="skill-groups" flexDirection="row" flexWrap="wrap" alignItems="center" columnGap="sm" rowGap="sm">
        {groups.map((group, i) => {
          const count = state.list.filter(entry => entry.group === group).length
          const word = `${group} (${count})${group === state.group ? ' ✓' : ''}`

          return (
            <Button key={`skill-group-${i}`} label={word} onPress={() => update($, skills, was => ({ ...was, group, picked: -1 }))}>
              {word}
            </Button>
          )
        })}
      </Box>
      <Box key="skill-list" flexDirection="row" flexWrap="wrap" alignItems="center" columnGap="sm" rowGap="sm">
        {state.list.flatMap((entry, i) => {
          if (entry.group !== state.group) {
            return []
          }

          const word = `${shortOf(entry)}${i === state.picked ? ' ✓' : ''}`

          return [
            <Button key={`skill-${i}`} label={word} onPress={() => update($, skills, was => ({ ...was, picked: i }))}>
              {word}
            </Button>,
          ]
        })}
      </Box>
      {picked === undefined
        ? []
        : [
            <Box key="skill-about" flexDirection="row" flexWrap="wrap" columnGap="sm" rowGap="xs">
              <Text bold>/{picked.name}</Text>
              <Text>{picked.nutshell}</Text>
            </Box>,
          ]}
    </Box>
  )
}
