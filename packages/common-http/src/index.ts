export type RetryOptions = {
  retries?: number
  factor?: number
  minTimeoutMs?: number
  maxTimeoutMs?: number
}

export type HttpOptions = RequestInit & {
  requestId?: string
  timeoutMs?: number
  retry?: RetryOptions
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function computeDelay(attempt: number, { factor = 2, minTimeoutMs = 200, maxTimeoutMs = 5000 }: RetryOptions) {
  const backoff = Math.min(maxTimeoutMs, minTimeoutMs * Math.pow(factor, attempt))
  const jitter = Math.random() * 0.2 * backoff
  return Math.round(backoff + jitter)
}

function shouldRetry(err: unknown, res?: Response) {
  if (res) return res.status >= 500 || res.status === 429
  return true // network errors
}

export async function httpFetch(input: RequestInfo | URL, init: HttpOptions = {}): Promise<Response> {
  const { timeoutMs = 8000, retry = {}, requestId, headers, ...rest } = init

  const mergedHeaders = new Headers(headers || {})
  if (requestId && !mergedHeaders.has('x-request-id')) mergedHeaders.set('x-request-id', requestId)

  let controller: AbortController | undefined
  let timeout: any
  if (timeoutMs > 0) {
    controller = new AbortController()
    timeout = setTimeout(() => controller!.abort(), timeoutMs)
  }

  const maxRetries = retry.retries ?? 2
  let attempt = 0
  while (true) {
    let res: Response | undefined
    try {
      res = await fetch(input, { ...rest, headers: mergedHeaders, signal: controller?.signal })
      if (!shouldRetry(undefined, res) || attempt >= maxRetries) {
        if (timeout) clearTimeout(timeout)
        return res
      }
      attempt++
      await sleep(computeDelay(attempt, retry))
    } catch (err) {
      if (attempt >= maxRetries || !shouldRetry(err)) {
        if (timeout) clearTimeout(timeout)
        throw err
      }
      attempt++
      await sleep(computeDelay(attempt, retry))
    }
  }
}

