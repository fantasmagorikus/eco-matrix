export async function POST(request: Request) {
  try {
    /* istanbul ignore next - defensive fallback for missing header */
    const ct = request.headers.get('content-type') || ''
    const isLegacy = /application\/csp-report/i.test(ct)
    const isReports = /application\/reports\+json/i.test(ct)
    if (!isLegacy && !isReports) {
      return new Response('Unsupported Content-Type', { status: 400 })
    }
    const bodyText = await request.text()
    // Log raw to avoid parse errors leaking
    // eslint-disable-next-line no-console
    console.warn('[CSP-REPORT]', bodyText)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[CSP-REPORT] failed to read body', err)
    return new Response('Bad Request', { status: 400 })
  }
  return new Response(null, { status: 204 })
}
