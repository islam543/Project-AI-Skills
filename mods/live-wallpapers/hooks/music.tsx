import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { MusicState } from '../types'
import { stateDir } from './home'

/**
 * Music under the wallpapers: the audio files in this mod's own `music` folder, one looped at a time, started and
 * stopped from the box above the prompt or with /music. The Mac plays them (the engine runs `afplay`), so they keep
 * playing while another app is in front. A file of the mod's own is played from disk, so a long one (a two-hour
 * ambience) plays whole; a file from elsewhere would be read into memory and is capped at 4 MB.
 *
 * Only one session plays: a shared file says which, and the others stop within a few seconds of another taking over.
 */
export const music = atom({ plugin: 'live-wallpapers', key: 'music' } as const, {
  isOpen: false,
  tracks: [],
  playing: '',
} as MusicState)

/** What afplay plays. */
const KINDS = new Set(['m4a', 'mp3', 'aac', 'wav', 'aif', 'aiff', 'caf', 'flac'])
/** Linear gain: quieter than full, since it plays under work for hours. */
const GAIN = 0.6
/** This load of the mod, to tell its own play from another session's in the shared file. */
const ME = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** The track this session plays now, and how to stop it. */
let player: { name: string; stop: AbortController } | undefined

type Shared = { track: string; by: string; at: number }

function folderOf($: EngineInterface): string {
  return `${$.plugin.root}/music`
}

function sharedPath($: EngineInterface): string {
  return `${stateDir($)}/.music.json`
}

/** A file's name as the box shows it: "soft-rain.m4a" is "Soft Rain". */
export function trackTitle(name: string): string {
  const bare = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()

  return bare.replace(/\b\w/g, letter => letter.toUpperCase())
}

async function readShared($: EngineInterface): Promise<Shared | undefined> {
  try {
    if (!(await $.fs.exists(sharedPath($)))) {
      return undefined
    }

    const value = JSON.parse(await $.fs.read(sharedPath($))) as Partial<Shared>

    return typeof value.track === 'string' && typeof value.by === 'string' ? { track: value.track, by: value.by, at: Number(value.at) || 0 } : undefined
  } catch {
    return undefined
  }
}

async function writeShared($: EngineInterface, track: string): Promise<void> {
  await $.fs.write(sharedPath($), JSON.stringify({ track, by: ME, at: Date.now() })).catch(() => undefined)
}

/** Reads the music folder: its audio files by name, in name order. None, where the folder is missing. */
export async function refreshTracks($: EngineInterface): Promise<readonly string[]> {
  const tracks = await $.fs
    .list(folderOf($))
    .then(entries =>
      entries
        .filter(entry => entry.kind === 'file' && entry.size > 0 && KINDS.has(entry.name.split('.').pop()?.toLowerCase() ?? ''))
        .map(entry => entry.name)
        .sort((a, b) => a.localeCompare(b)),
    )
    .catch(() => [] as string[])

  await update($, music, was => ({ ...was, tracks }))

  return tracks
}

/** Stops this session's track at once; `share` also tells the other sessions that the music is off. */
export async function stopMusic($: EngineInterface, share = true): Promise<void> {
  player?.stop.abort()
  player = undefined

  if (share) {
    await writeShared($, '')
  }

  await update($, music, was => ({ ...was, playing: '' }))
}

/** Plays one track of the folder on a loop, here, and stops any other session's. Answers what happened, in a line. */
export async function playTrack($: EngineInterface, name: string): Promise<string> {
  player?.stop.abort()
  const stop = new AbortController()
  player = { name, stop }
  await writeShared($, name)
  await update($, music, was => ({ ...was, playing: name }))

  // Not awaited: it resolves only when the track is stopped.
  void $.audio.play({ asset: `music/${name}` }, { shouldLoop: true, gain: GAIN, signal: stop.signal }).catch(async (error: unknown) => {
    if (player?.stop === stop) {
      player = undefined
      await update($, music, was => ({ ...was, playing: '' }))
      await writeShared($, '')
    }

    void $.ui.toast(`${trackTitle(name)} could not play: ${error instanceof Error ? error.message : String(error)}`)
  })

  return `♪ ${trackTitle(name)} is playing. /music off stops it.`
}

/** Every few seconds: stops this session's track when another session took over or stopped the music. */
export async function tickMusic($: EngineInterface): Promise<void> {
  const shared = await readShared($)

  if (player !== undefined && shared !== undefined && shared.by !== ME) {
    player.stop.abort()
    player = undefined
  }

  const playing = shared?.track ?? ''

  if ((await read($, music)).playing !== playing) {
    await update($, music, was => ({ ...was, playing }))
  }
}

/** Makes the music folder and opens it in Finder, so files can be dragged in. */
export async function openMusicFolder($: EngineInterface): Promise<string> {
  const folder = folderOf($)
  await $.process.run(['mkdir', '-p', folder])
  const opened = await $.process.run(['open', folder])

  return opened.exitCode === 0
    ? `Opened ${folder}: drag audio files in (m4a, mp3, wav, aiff, flac), then press Music again.`
    : `Put audio files (m4a, mp3, wav, aiff, flac) in ${folder}.`
}

/** /music: no word toggles the row in the box; "off" stops; "folder" opens the folder; anything else is a track. */
export async function musicCommand($: EngineInterface, args: string): Promise<string> {
  const word = args.trim().toLowerCase()

  if (word === '') {
    const tracks = await refreshTracks($)
    await update($, music, was => ({ ...was, isOpen: true }))

    return tracks.length === 0 ? await openMusicFolder($) : 'Pick a track in the box above the prompt.'
  }

  if (word === 'off' || word === 'stop') {
    await stopMusic($)

    return 'Music off.'
  }

  if (word === 'folder') {
    return openMusicFolder($)
  }

  const tracks = await refreshTracks($)
  const key = word.replace(/[\s_-]+/g, '')
  const found = tracks.find(name => trackTitle(name).toLowerCase().replace(/\s+/g, '').startsWith(key))

  return found === undefined ? `No track named "${args.trim()}". ${tracks.length} in the folder: ${tracks.map(trackTitle).join(', ') || 'none'}.` : playTrack($, found)
}

/** Shows or hides the music row; opening it reads the folder again, so files dropped in since show up. */
export async function toggleMusicRow($: EngineInterface): Promise<void> {
  const was = await read($, music)

  if (!was.isOpen) {
    await refreshTracks($)
  }

  await update($, music, now => ({ ...now, isOpen: !was.isOpen }))
}

/** This session's music state, for the box. */
export function musicNow($: EngineInterface): Promise<MusicState> {
  return read($, music)
}

/** Stops this session's player, where it has one, as the session ends: the music should not outlive it. */
export async function endMusic($: EngineInterface): Promise<void> {
  if (player !== undefined) {
    await stopMusic($)
  }
}
