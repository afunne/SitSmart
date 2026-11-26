import { useEffect, useEffectEvent } from 'react'
import { useAuth } from '../auth/AuthContext.tsx'

/** What the API's SeatNotifier sends when a seat of the watched event changes. */
export interface SeatMessage {
  type: 'SeatReserved' | 'SeatReleased' | 'SeatSold'
  eventId: number
  seatId: number
}

const SEAT_MESSAGE_TYPES: ReadonlySet<string> = new Set<SeatMessage['type']>(['SeatReserved', 'SeatReleased', 'SeatSold'])

/** The message, or null if it isn't valid JSON in the SeatMessage shape. */
function parseSeatMessage(data: unknown): SeatMessage | null {
  if (typeof data !== 'string') return null
  let value: unknown
  try {
    value = JSON.parse(data)
  } catch {
    return null
  }
  if (typeof value !== 'object' || value === null) return null
  const { type, eventId, seatId } = value as Record<string, unknown>
  if (typeof type !== 'string' || !SEAT_MESSAGE_TYPES.has(type)) return null
  if (typeof eventId !== 'number' || typeof seatId !== 'number') return null
  return { type: type as SeatMessage['type'], eventId, seatId }
}

/**
 * Live seat updates for one event over /ws/seats (in dev the Vite proxy forwards /ws to the API).
 * Connects only when logged in, because the endpoint needs the token. Browsers can't set headers
 * on a WebSocket, so the token goes in ?access_token=. A new eventId or token opens a new socket.
 */
export function useSeatSocket(eventId: number, onMessage: (message: SeatMessage) => void) {
  const { token } = useAuth()
  // Always calls the latest onMessage, without reconnecting when it changes.
  const handleMessage = useEffectEvent(onMessage)

  useEffect(() => {
    if (!token || !Number.isInteger(eventId) || eventId <= 0) return

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const socket = new WebSocket(`${protocol}://${location.host}/ws/seats?access_token=${encodeURIComponent(token)}`)

    socket.onopen = () => socket.send(JSON.stringify({ type: 'join', eventId }))
    socket.onmessage = (e: MessageEvent) => {
      const message = parseSeatMessage(e.data)
      if (message && message.eventId === eventId) handleMessage(message)
    }

    return () => socket.close()
  }, [eventId, token])
}
