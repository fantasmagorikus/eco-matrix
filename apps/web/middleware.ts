import { NextResponse, type NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { buildCsp } from './lib/security'

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Request ID: preserve incoming header if provided; otherwise generate
  const incomingId = req.headers.get('x-request-id') || req.headers.get('x-amzn-trace-id')
  const requestId = incomingId || nanoid()
  res.headers.set('x-request-id', requestId)

  // Security headers
  const isProd = process.env.NODE_ENV === 'production'
  const csp = buildCsp(!isProd)
  res.headers.set('content-security-policy', csp)
  res.headers.set('strict-transport-security', 'max-age=63072000; includeSubDomains; preload')
  res.headers.set('referrer-policy', 'no-referrer')
  res.headers.set('x-content-type-options', 'nosniff')
  res.headers.set('x-frame-options', 'DENY')
  res.headers.set('permissions-policy', 'geolocation=(), microphone=(), camera=()')
  // Cross-origin protections (safe defaults)
  res.headers.set('cross-origin-opener-policy', 'same-origin')
  res.headers.set('cross-origin-resource-policy', 'same-origin')
  // Misc hardening
  res.headers.set('x-dns-prefetch-control', 'off')
  res.headers.set('x-permitted-cross-domain-policies', 'none')

  // Basic structured log to stdout (edge/runtime). Avoid logging bodies.
  try {
    // minimal log; in real app route this to your logger
    console.log(JSON.stringify({ level: 'info', msg: 'request', requestId, path: req.nextUrl.pathname, method: req.method }))
  } catch {}

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
