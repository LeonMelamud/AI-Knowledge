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
  'ai-basics': { subject: 'interlocking glass cubes', hue: 'cool neutral', available: true },
  advanced_concepts: { subject: 'deep crystalline lattice', hue: 'indigo', available: true },
  techniques: { subject: 'braided fibre-optic bundle', hue: 'teal', available: true },
  evaluation_metrics: { subject: 'precision measurement gauges', hue: 'steel', available: true },
  tools_and_libraries: { subject: 'modular stacked components', hue: 'amber', available: true },
  applications: { subject: 'radiating conduit network', hue: 'green', available: true },
  future_trends: { subject: 'dissolving particulate form', hue: 'violet', available: true },
  'chat-tools': { subject: 'overlapping sound-wave membranes', hue: 'sky', available: true },
  'coding-tools': { subject: 'machined interlocking gears', hue: 'graphite', available: true },
  libraries: { subject: 'dense stacked strata', hue: 'sand', available: true },
  graphics: { subject: 'refracting prism array', hue: 'spectral', available: true },
  articles: { subject: 'layered translucent sheets', hue: 'bone', available: true },
  'educational-resources': { subject: 'nested concentric rings', hue: 'olive', available: true },
  productivity: { subject: 'aligned parallel rails', hue: 'slate', available: true },
  'hot-news': { subject: 'rippling liquid surface', hue: 'copper', available: true },
  calculator: { subject: 'abacus-like ordered spheres', hue: 'cool grey', available: true },
}

export const heroFor = (routeId: string): Hero | undefined => HEROES[routeId]

/** Public path for a route's hero at a given width. */
export const heroSrc = (routeId: string, width: 640 | 1280 | 1920, ext: 'avif' | 'webp') =>
  `${import.meta.env.BASE_URL}images/heroes/${routeId}-${width}.${ext}`
