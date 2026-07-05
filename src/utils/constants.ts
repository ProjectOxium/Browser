export const SEARCH_ENGINES: Record<string, string> = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
}

export const DEFAULT_SEARCH_ENGINE = 'duckduckgo'

export const PRIVACY_LEVELS = {
  strict: { label: 'Strict', description: 'Block all trackers and ads' },
  balanced: { label: 'Balanced', description: 'Block known trackers, allow non-intrusive ads' },
  relaxed: { label: 'Relaxed', description: 'Block only malicious domains' },
} as const

export function normalizeUrl(input: string, searchEngine?: string): string {
  const trimmed = input.trim()
  if (!trimmed) return 'about:blank'

  if (trimmed === 'about:blank' || trimmed === 'about:newtab') return trimmed

  const hasProtocol = /^[a-zA-Z]+:\/\//.test(trimmed)
  const hasDot = /[\w-]+\.[\w-]+/.test(trimmed)
  const noSpaces = !trimmed.includes(' ')

  if (hasProtocol) return trimmed
  if (hasDot && noSpaces) return `https://${trimmed}`

  const engineUrl = SEARCH_ENGINES[searchEngine || DEFAULT_SEARCH_ENGINE] || SEARCH_ENGINES.duckduckgo
  return `${engineUrl}${encodeURIComponent(trimmed)}`
}
