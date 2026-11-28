# Live Wallpapers

A mod for the Claude desktop app (the Code tab): live wallpapers behind the chat, and a box above the message box to pick them, play music and browse your skills.

## What you get

**Sixteen wallpapers**, each animated, most of them reacting to the pointer:

- ASCII scenes: Ember, Cloud Drift, Honu Lagoon, Koi Pond, Jellyfish, Paper Boats, Fireflies, Moonlit
- Illustrated scenes: Giant March (a wanderer on a cliff watching hundreds of giants march through steam), Aurora Cabin
- Dot and line art: Topographic, Dot Wave, Dither Gallery, Neon Rain, Pixel Nebula, Dot Tide (a dot field under a rolling surface, with Claude's spark in the corner)

**The box above the message box:**

- **Change theme** opens every wallpaper as a small preview with a button under it.
- **Colors** (while Dot Tide is on) picks the dot colour: Ash, Claude, Sand, Mint, Ice, Rose or Violet.
- **Music** plays an audio file from the mod's `music` folder on a loop, with a Stop button. It ships with one short loop, Soft Rain, made for this mod. **Add music** opens the folder in Finder.
- **Skills** lists your skills and commands by group, and shows what the one you click does in one line.
- With Neon Rain on, a small dashboard shows the context window, plan limits and session counts.

Dither Gallery, Pixel Nebula, Topographic and Dot Tide also recolour the app itself, the side panel included, to match.

A pick in one session reaches your other open sessions within a few seconds.

## Commands

| Command | What it does |
|---|---|
| `/themes` | Opens the picker; `/themes list` names every wallpaper |
| `/theme-<name>` | Switches to one, such as `/theme-moonlit` |
| `/theme-dot-tide <colour>` | Dot Tide in one colour, such as `mint` |
| `/theme-next`, `/theme-off` | The next wallpaper; none |
| `/music`, `/music off`, `/music folder` | Opens the music row; stops; opens the folder |
| `/hud` | Hides or shows the Neon Rain dashboard |

## Install

Needs the Claude desktop app, or Claude Code with a window that draws themes. The terminal shows the commands and the box, but no wallpaper.

```bash
git clone https://github.com/islam543/Project-AI-Skills.git
claude plugin marketplace add ./Project-AI-Skills/mods
claude plugin install live-wallpapers@project-ai-mods
```

Then open a new session and **send one message**: the app starts drawing a session's wallpaper after its first message. To update later, `git pull` in the clone and run `/reload-plugins`.

## Good to know

- **Music files** live in the mod's own `music` folder, so long tracks (an hour or more) play whole. Keep your own copies: reinstalling the mod can replace that folder. Use audio you have the rights to.
- **Shared files** (the current choice, which session plays music, and a short debug log) are kept in `~/.claude/live-wallpapers`.
- **Skills:** the app's list does not tell skills from slash commands, so built-in commands, MCP prompts and theme mods' commands are left out and the rest is shown. To hide large groups, add their names to `HIDDEN_GROUPS` in `hooks/skills.tsx`.
- **Reduced motion:** with your system's Reduce Motion on, the scenes rest.

## What it runs

The mod is TypeScript that Claude Code runs; it reaches your computer only through Claude Code's own calls. It draws with the app's theme and UI calls, reads and writes only the files above, runs `mkdir` and `open` (to make and show its folders), plays audio through Claude Code, and reads the list of slash commands for the Skills row. It sends nothing over the network.

## Credits and license

Original work under the [MIT License](../../LICENSE). `hooks/make-colors.js` and `make-colors.d.ts` are the colour helper from Claude Code's mod authoring guide, which asks mods to include them unchanged.
