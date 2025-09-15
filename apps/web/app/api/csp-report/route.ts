export async function POST(request: Request) {
  try {
    const bodyText = await request.text()
    // Some browsers send application/csp-report with {"csp-report":{...}}
    // Others may use application/reports+json. Log raw to avoid parse errors.
    console.warn('[CSP-REPORT]', bodyText)
  } catch (err) {
    console.warn('[CSP-REPORT] failed to read body', err)
  }
  return new Response(null, { status: 204 })
}

