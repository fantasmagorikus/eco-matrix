export const DEFAULT_CORS_WHITELIST = [
  'http://localhost:3000',
  'https://eco-matrix-staging.vercel.app',
  'https://lokomemo.com',
  'https://lokomemo.tv',
  'https://admin.lokomemo.com',
  'https://admin.lokomemo.tv',
]

export type CorsOptions = {
  whitelist: string[]
  allowCredentials?: boolean
}

export function createCors(opts: CorsOptions) {
  const set = new Set(opts.whitelist)
  const allowCreds = opts.allowCredentials ?? true
  return function buildCorsHeaders(origin: string | null) {
    if (!origin || !set.has(origin)) return {}
    const headers: Record<string, string> = {
      'access-control-allow-origin': origin,
      'vary': 'Origin',
    }
    if (allowCreds) headers['access-control-allow-credentials'] = 'true'
    return headers
  }
}

export function preflightHeaders(origin: string | null, reqHeaders: string | null, methods = 'GET,POST,OPTIONS') {
  if (!origin) return {}
  const h: Record<string, string> = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': methods,
    'access-control-allow-headers': reqHeaders || 'content-type, authorization',
    'access-control-max-age': '86400',
    'vary': 'Origin, Access-Control-Request-Headers, Access-Control-Request-Method',
  }
  return h
}

// Content-Type + size guard for JSON bodies (Fetch Request style)
export async function readJsonBody<T = any>(req: Request, maxBytes = 256 * 1024): Promise<T> {
  const ct = req.headers.get('content-type') || ''
  if (!/application\/json/i.test(ct)) {
    throw new Error('Unsupported Content-Type')
  }
  const len = Number(req.headers.get('content-length') || '0')
  if (len > 0 && len > maxBytes) throw new Error('Payload too large')
  const text = await req.text()
  if (text.length > maxBytes) throw new Error('Payload too large')
  return JSON.parse(text)
}

// Naive in-memory rate limiter (IP+path), fixed window
export function createRateLimiter({
  windowMs = 60_000,
  max = 60,
}: {
  windowMs?: number
  max?: number
}) {
  const buckets = new Map<string, { window: number; count: number }>()
  return function allow(ip: string, path: string) {
    const key = ip + '|' + path
    const now = Date.now()
    const w = Math.floor(now / windowMs)
    const cur = buckets.get(key)
    if (!cur || cur.window !== w) {
      buckets.set(key, { window: w, count: 1 })
      return true
    }
    if (cur.count >= max) return false
    cur.count++
    return true
  }
}
