export function buildCsp(isDev: boolean): string {
  // In dev, allow inline/eval for Next HMR; in prod, be stricter.
  const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self'"
  const styleSrc = isDev ? "'self' 'unsafe-inline'" : "'self' 'unsafe-inline'"
  const imgSrc = "'self' data: blob:"
  const connectSrc = isDev ? "'self' ws:" : "'self'"
  const base = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `font-src 'self' data:`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ]
  return base.join('; ')
}

