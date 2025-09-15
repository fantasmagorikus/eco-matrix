type Base = {
  service: string
  env: string
}

type LogMeta = Record<string, unknown> & { requestId?: string; err?: unknown }

export type Logger = {
  child(extra: Partial<Base> & { requestId?: string }): Logger
  debug(msg: string, meta?: LogMeta): void
  info(msg: string, meta?: LogMeta): void
  warn(msg: string, meta?: LogMeta): void
  error(msg: string, meta?: LogMeta): void
}

function nowIso() {
  return new Date().toISOString()
}

function toError(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack }
  return { message: String(err) }
}

export function createLogger(base: Base & { requestId?: string }): Logger {
  const baseFields = { service: base.service, env: base.env, requestId: base.requestId }
  function log(level: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: LogMeta) {
    const payload: Record<string, unknown> = {
      time: nowIso(),
      level,
      msg,
      ...baseFields,
    }
    if (meta) {
      const { err, ...rest } = meta
      Object.assign(payload, rest)
      if (err) payload.err = toError(err)
    }
    try {
      // eslint-disable-next-line no-console
      console[level === 'debug' ? 'log' : level](JSON.stringify(payload))
    } catch {}
  }
  const api: Logger = {
    child(extra) {
      return createLogger({
        service: extra.service ?? base.service,
        env: extra.env ?? base.env,
        requestId: extra.requestId ?? base.requestId,
      })
    },
    debug: (m, meta) => log('debug', m, meta),
    info: (m, meta) => log('info', m, meta),
    warn: (m, meta) => log('warn', m, meta),
    error: (m, meta) => log('error', m, meta),
  }
  return api
}

