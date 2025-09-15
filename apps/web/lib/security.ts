export function buildCsp(isDev: boolean): string {
  // In dev, allow HMR needs; in prod, be strict.
  const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self'"
  const styleSrc = "'self' 'unsafe-inline'"
  const imgSrc = "'self' data: blob:"
  const connectSrc = isDev ? "'self' ws:" : "'self'"
  const fontSrc = "'self' data:"
  const frameSrc = "'none'"
  const mediaSrc = "'self'"
  const workerSrc = "'self' blob:"
  const manifestSrc = "'self'"

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `font-src ${fontSrc}`,
    `form-action 'self'`,
    `frame-src ${frameSrc}`,
    `media-src ${mediaSrc}`,
    `worker-src ${workerSrc}`,
    `manifest-src ${manifestSrc}`,
    `upgrade-insecure-requests`,
  ]
  return directives.join('; ')
}
