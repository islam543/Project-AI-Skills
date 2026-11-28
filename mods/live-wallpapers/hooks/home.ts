import type { EngineInterface } from 'claude-code'

/**
 * Where the mod keeps the files every session shares (the choice, the music state and a short debug log):
 * `~/.claude/live-wallpapers`, outside the plugin's own folder, which an update replaces. Found at session start;
 * until then, or where the home folder is unknown, the folder above the plugin's.
 */
let dir: string | undefined

export async function prepareStateDir($: EngineInterface): Promise<string> {
  // Never in the way of the session's start: a home folder the engine will not give is the fallback folder.
  const home = await $.env.get('HOME').catch(() => undefined)
  dir = home === undefined || home === '' ? `${$.plugin.root}/..` : `${home}/.claude/live-wallpapers`
  await $.process.run(['mkdir', '-p', dir]).catch(() => undefined)

  return dir
}

export function stateDir($: EngineInterface): string {
  return dir ?? `${$.plugin.root}/..`
}
