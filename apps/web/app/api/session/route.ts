export async function POST() {
  const sessionValue = 'demo.' + Math.random().toString(36).slice(2)
  const maxAge = 60 * 60 // 1 hour

  // Manually set cookie header to avoid relying on Next.js request context in tests.
  const cookie = [
    `session=${encodeURIComponent(sessionValue)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ')

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': cookie,
    },
  })
}
