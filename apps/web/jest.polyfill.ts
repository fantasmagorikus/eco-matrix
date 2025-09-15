try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetch, Request, Response, Headers } = require('undici')
  if (!globalThis.fetch) globalThis.fetch = fetch
  if (!globalThis.Request) globalThis.Request = Request
  if (!globalThis.Response) globalThis.Response = Response
  if (!globalThis.Headers) globalThis.Headers = Headers
} catch {}

