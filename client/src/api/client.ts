import { clearSession, getSession } from '../auth/session.ts'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Sent as JSON. */
  body?: unknown
  /** Don't send the saved token (used by login). */
  anonymous?: boolean
}

/**
 * Calls the API and returns the parsed JSON response.
 * Adds JSON headers and the saved Bearer token. Throws ApiError for non-2xx responses.
 * A 401 on a request that carried a token means the session is no longer valid:
 * the session is cleared and the browser goes to /login.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await send(path, options, 'application/json')
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/**
 * Like apiFetch, but returns the response body as a Blob. For files that need the token,
 * e.g. ticket QR codes: an <img src> can't send an Authorization header.
 */
export async function apiFetchBlob(path: string, options: ApiFetchOptions = {}): Promise<Blob> {
  const response = await send(path, options, '*/*')
  return response.blob()
}

/** Sends the request with the token; handles 401 and other errors as described on apiFetch. */
async function send(path: string, options: ApiFetchOptions, accept: string): Promise<Response> {
  const { body, headers, anonymous, ...init } = options
  const session = anonymous ? null : getSession()

  const requestHeaders = new Headers(headers)
  requestHeaders.set('Accept', accept)
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json')
  if (session) requestHeaders.set('Authorization', `Bearer ${session.token}`)

  const response = await fetch(path, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // Without a token (e.g. a failed login) a 401 is a normal error for the caller to show.
  if (response.status === 401 && session) {
    clearSession()
    if (window.location.pathname !== '/login') window.location.assign('/login')
    throw new ApiError(401, 'Sessioon on aegunud. Logi uuesti sisse.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  return response
}

/** Uses ASP.NET ProblemDetails (detail / title) when present, otherwise a generic message. */
async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Päring ebaõnnestus (${response.status})`
  try {
    const text = await response.text()
    if (!text) return fallback
    try {
      const problem = JSON.parse(text) as { detail?: string; title?: string; message?: string }
      return problem.detail ?? problem.message ?? problem.title ?? fallback
    } catch {
      return text
    }
  } catch {
    return fallback
  }
}

/** Message to show for a failed apiFetch: the server's (Estonian) message, or a network error text. */
export function getErrorMessage(err: unknown): string {
  return err instanceof ApiError
    ? err.message
    : 'Serveriga ei saanud ühendust. Kontrolli internetiühendust ja proovi uuesti.'
}
