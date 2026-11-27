import { useEffect, useEffectEvent, useState } from 'react'
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

/** Wait before each reconnect attempt; after the last one it keeps retrying every 10 s. */
const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10_000]

/**
 * Live seat updates for one event over /ws/seats (in dev the Vite proxy forwards /ws to the API).
 * Connects only when logged in, because the endpoint needs the token. Browsers can't set headers
 * on a WebSocket, so the token goes in ?access_token=. A new eventId or token opens a new socket.
 *
 * When the socket closes or fails to open, it reconnects with backoff (1, 2, 5, 10 s, then every
 * 10 s) until it is back, the user logs out or the component unmounts. Every new socket joins the
 * event again; onReconnect runs once it is back, so the caller can reload what it missed.
 *
 * connected is false only while the connection is lost and being retried. It stays true while the
 * first connection is opening and when there is no socket (not logged in).
 */
export function useSeatSocket(
  eventId: number,
  onMessage: (message: SeatMessage) => void,
  onReconnect?: () => void,
): { connected: boolean } {
  const { token } = useAuth()
  // Always call the latest callbacks, without reconnecting when they change.
  const handleMessage = useEffectEvent(onMessage)
  const handleReconnect = useEffectEvent(() => onReconnect?.())

  // Which connection is lost, so a new eventId or token starts out connected again.
  const [lost, setLost] = useState<{ eventId: number; token: string } | null>(null)

  useEffect(() => {
    if (!token || !Number.isInteger(eventId) || eventId <= 0) return

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${location.host}/ws/seats?access_token=${encodeURIComponent(token)}`
    let socket: WebSocket
    let retryTimer: number | undefined
    let attempt = 0
    let wasLost = false
    // Set by the cleanup, so the close it causes doesn't start a reconnect.
    let disposed = false

    const connect = () => {
      socket = new WebSocket(url)
      socket.onopen = () => {
        attempt = 0
        socket.send(JSON.stringify({ type: 'join', eventId }))
        // Always cleared: a lost state can be left over from an earlier visit to the same event.
        setLost(null)
        if (wasLost) {
          wasLost = false
          handleReconnect()
        }
      }
      socket.onmessage = (e: MessageEvent) => {
        const message = parseSeatMessage(e.data)
        if (message && message.eventId === eventId) handleMessage(message)
      }
      // Also runs after onerror and when the connection never opened.
      socket.onclose = () => {
        if (disposed) return
        if (!wasLost) {
          wasLost = true
          setLost({ eventId, token })
        }
        const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)]
        attempt++
        retryTimer = window.setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      socket.close()
    }
  }, [eventId, token])

  const connected = !(lost && lost.eventId === eventId && lost.token === token)
  return { connected }
}
