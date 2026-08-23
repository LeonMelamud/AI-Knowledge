// Token counting, shared by the calculator page and the WebMCP tool of the same
// name so an agent and a human always get the same number.
//
// The encoder is lazy-loaded (the rank table is large) and cached after first use.
let encodePromise: Promise<(text: string) => number> | null = null

export function loadEncoder() {
  encodePromise ??= Promise.all([import('js-tiktoken/lite'), import('js-tiktoken/ranks/gpt2')])
    .then(([{ Tiktoken }, ranks]) => {
      const encoding = new Tiktoken(ranks.default)
      return (text: string) => encoding.encode(text).length
    })
    // Don't cache a rejection; each click should get a real attempt rather than
    // an instantly-resolved failure. (A 404'd chunk stays dead in the browser's
    // module map until reload — recovery there is the preloadError listener.)
    .catch((error) => {
      encodePromise = null
      throw error
    })
  return encodePromise
}
