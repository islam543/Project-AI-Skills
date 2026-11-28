import { makeColors } from './make-colors.js'

/**
 * The app's own colours for four dark wallpapers, so the side panel (browser, files, terminal), the cards and the
 * menus take the wallpaper's ground instead of the app's grey. Dark only: each scene is made for a dark window. Each
 * surface steps a little lighter than the one before, from the scene's own ground, and `surface-3` stays close to
 * `surface-0`, as the guide asks, so muted text still reads on menus. `problems` is checked by a test: no line may start
 * "Desktop won't paint this theme", since the app then ignores the whole theme.
 */

/** Dither Gallery: black paper, white dither, fire in the corners. */
export const { theme: DITHER_COLORS, problems: DITHER_PROBLEMS } = makeColors({
  label: 'Dither Gallery',
  only: 'dark',
  roles: { accent: '#ff7a3d', danger: '#e5484d', success: '#5bb98c', warning: '#e0a33a', pro: '#b48cff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b0b0b',
        'surface-1': '#131313',
        'surface-2': '#191919',
        'surface-3': '#1d1d1d',
        'text-primary': '#f2f2f2',
        'text-secondary': '#c9c9c9',
        'text-muted': '#a3a3a3',
      },
    },
  },
})

/** Pixel Nebula: deep blue-violet space, a violet band, pink and teal stars. */
export const { theme: NEBULA_COLORS, problems: NEBULA_PROBLEMS } = makeColors({
  label: 'Pixel Nebula',
  only: 'dark',
  roles: { accent: '#9b7bff', danger: '#ff6b8a', success: '#5fd0c0', warning: '#f0b45a', pro: '#e07bff' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#08070f',
        'surface-1': '#0f0d19',
        'surface-2': '#141220',
        'surface-3': '#181526',
        'text-primary': '#eeeaff',
        'text-secondary': '#cbc4e8',
        'text-muted': '#a69ec9',
      },
    },
  },
})

/** Topographic: black ground, white contour lines; a cool silver for the accent. */
export const { theme: TOPO_COLORS, problems: TOPO_PROBLEMS } = makeColors({
  label: 'Topographic',
  only: 'dark',
  roles: { accent: '#9fb4c9', danger: '#e5484d', success: '#6cc28e', warning: '#d8a94a', pro: '#b9a3e3' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#060606',
        'surface-1': '#0e0e0e',
        'surface-2': '#141414',
        'surface-3': '#181818',
        'text-primary': '#f5f5f5',
        'text-secondary': '#cfcfcf',
        'text-muted': '#a8a8a8',
      },
    },
  },
})

/** Dot Tide: the warm charcoal ground of the picture it came from, with Claude's orange for the accent. */
export const { theme: TIDE_COLORS, problems: TIDE_PROBLEMS } = makeColors({
  label: 'Dot Tide',
  only: 'dark',
  roles: { accent: '#d97757', danger: '#e5584d', success: '#6fbf8c', warning: '#e0a648', pro: '#b597e8' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1a1714',
        'surface-1': '#211d19',
        'surface-2': '#27221d',
        'surface-3': '#2b2620',
        'text-primary': '#f1ebe2',
        'text-secondary': '#cdc4b7',
        'text-muted': '#aaa092',
      },
    },
  },
})

/** Every palette's contrast notes, by wallpaper, for the test. */
export const LOOK_PROBLEMS: Readonly<Record<string, readonly string[]>> = {
  'dither-gallery': DITHER_PROBLEMS,
  'pixel-nebula': NEBULA_PROBLEMS,
  topographic: TOPO_PROBLEMS,
  'dot-tide': TIDE_PROBLEMS,
}
