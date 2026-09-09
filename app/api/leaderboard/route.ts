const SOURCE_URL = 'https://script.google.com/a/macros/urios.edu.ph/s/AKfycbwSVxdnKXFYbXG91ViCH-XxQqYnDHVmhdC7z1Euo9vScJhkWKKFdm3E4GdpCcwxg_4lxw/exec?userType=Visitor'
const CACHE_TTL = 12_000
const UPSTREAM_TIMEOUT = 8_000

type SourcePayload = { tally: unknown[]; results: unknown[] }
let cached: { payload: SourcePayload; expiresAt: number } | null = null
let inFlight: Promise<SourcePayload> | null = null

function decodePage(source: string) {
  let decoded = source
  for (let pass = 0; pass < 4; pass += 1) {
    decoded = decoded
      .replace(/\\x([0-9a-f]{2})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
      .replace(/\\\//g, '/')
      .replace(/\\\"/g, '\"')
  }
  return decoded
}

function extractArray(source: string, key: 'tally' | 'results') {
  const decoded = decodePage(source)
  const marker = decoded.search(new RegExp(`[\\\"']${key}[\\\"']\\s*:`, 'i'))
  if (marker < 0) throw new Error(`${key} data not found`)
  const start = decoded.indexOf('[', marker)
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < decoded.length; index += 1) {
    const character = decoded[index]
    if (inString) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === '"') inString = false
      continue
    }
    if (character === '"') inString = true
    else if (character === '[') depth += 1
    else if (character === ']') {
      depth -= 1
      if (depth === 0) return JSON.parse(decoded.slice(start, index + 1)) as unknown[]
    }
  }
  throw new Error(`${key} data not found`)
}

async function readSource(): Promise<SourcePayload> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT)
  try {
    const response = await fetch(SOURCE_URL, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'text/html, application/json' },
    })
    if (!response.ok) throw new Error('Source unavailable')
    const source = await response.text()
    return { tally: extractArray(source, 'tally'), results: extractArray(source, 'results') }
  } finally {
    clearTimeout(timeout)
  }
}

async function getPayload() {
  if (cached && cached.expiresAt > Date.now()) return cached.payload
  if (!inFlight) {
    inFlight = readSource()
      .then((payload) => {
        cached = { payload, expiresAt: Date.now() + CACHE_TTL }
        return payload
      })
      .finally(() => { inFlight = null })
  }
  try {
    return await inFlight
  } catch (error) {
    if (cached) return cached.payload
    throw error
  }
}

export async function GET() {
  try {
    const payload = await getPayload()
    return Response.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=12, stale-while-revalidate=60' },
    })
  } catch {
    return Response.json({ error: 'Could not read scoreboard source' }, { status: 502 })
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
