import { ApiError } from './client.ts'

/**
 * Estonian message to show (usually in a toast) for an error thrown by apiFetch.
 * 409 is a business rule (seat taken, event has tickets…), so the API's own message is shown.
 * Anything that isn't an ApiError means the request never got an answer.
 */
export function errorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Ühendus serveriga katkes'

  switch (err.status) {
    case 400: return 'Kontrolli andmeid'
    case 403: return 'Sul pole selle tegevuse jaoks õigusi'
    case 404: return 'Ei leitud'
    case 409: return err.message
  }

  // ASP.NET's own 5xx titles are in English.
  if (err.status >= 500) return 'Serveris tekkis viga. Proovi hiljem uuesti.'

  // E.g. 401 "Sessioon on aegunud. Logi uuesti sisse." from apiFetch.
  return err.message
}
