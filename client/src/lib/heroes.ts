/**
 * Route → hero image map.
 *
 * `subject` and `hue` are the generation brief for each route (spec §6.3): every
 * image is produced from one shared style anchor, varying only the physical
 * structure depicted and its dominant hue, so the sixteen read as one family
 * rather than sixteen stock photographs.
 *
 * `available` gates rendering. Until an image has actually been generated and
 * encoded, the hero falls back to a typographic-only treatment — the layout is
 * complete and verifiable before any credits are spent.
 */
export interface Hero {
  subject: string
  hue: string
  available: boolean
}

export const HEROES: Record<string, Hero> = {
  'ai-basics': { subject: 'interlocking glass cubes', hue: 'cool neutral', available: false },
  advanced_concepts: { subject: 'deep crystalline lattice', hue: 'indigo', available: false },
  techniques: { subject: 'braided fibre-optic bundle', hue: 'teal', available: false },
  evaluation_metrics: { subject: 'precision measurement gauges', hue: 'steel', available: false },
  tools_and_libraries: { subject: 'modular stacked components', hue: 'amber', available: false },
  applications: { subject: 'radiating conduit network', hue: 'green', available: false },
  future_trends: { subject: 'dissolving particulate form', hue: 'violet', available: false },
  'chat-tools': { subject: 'overlapping sound-wave membranes', hue: 'sky', available: false },
  'coding-tools': { subject: 'machined interlocking gears', hue: 'graphite', available: false },
  libraries: { subject: 'dense stacked strata', hue: 'sand', available: false },
  graphics: { subject: 'refracting prism array', hue: 'spectral', available: false },
  articles: { subject: 'layered translucent sheets', hue: 'bone', available: false },
  'educational-resources': { subject: 'nested concentric rings', hue: 'olive', available: false },
  productivity: { subject: 'aligned parallel rails', hue: 'slate', available: false },
  'hot-news': { subject: 'rippling liquid surface', hue: 'copper', available: false },
  calculator: { subject: 'abacus-like ordered spheres', hue: 'cool grey', available: false },
}

export const heroFor = (routeId: string): Hero | undefined => HEROES[routeId]

/** Public path for a route's hero at a given width. */
export const heroSrc = (routeId: string, width: 640 | 1280 | 1920, ext: 'avif' | 'webp') =>
  `${import.meta.env.BASE_URL}images/heroes/${routeId}-${width}.${ext}`
