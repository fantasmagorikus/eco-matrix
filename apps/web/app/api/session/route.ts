import { cookies } from 'next/headers'

export async function POST() {
  const sessionValue = 'demo.' + Math.random().toString(36).slice(2)
  const maxAge = 60 * 60 // 1 hour
  cookies().set({
    name: 'session',
    value: sessionValue,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

