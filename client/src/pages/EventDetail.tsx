import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  IconButton,
  Link,
  Section,
  Spinner,
  Text,
} from '@radix-ui/themes'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, apiFetch, getErrorMessage } from '../api/client.ts'
import type {
  CreateReservationRequest,
  EventDto,
  ReservationDto,
  SeatDto,
  SeatMapDto,
  SeatState,
  TicketDto,
} from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import ErrorCallout from '../components/ErrorCallout.tsx'
import SeatMap from '../components/SeatMap.tsx'
import { formatDateTime, formatPrice, formatTime, rowLabel } from '../utils/format.ts'
import './EventDetail.css'

/** Same as ReservationService.MaxActiveReservationsPerUser in the API (counted across all events). */
const MAX_ACTIVE_RESERVATIONS = 6

const SEAT_TAKEN = 'Koht on juba võetud - vali mõni teine'

/** How long "Pilet ostetud!" stays visible before going to /my-tickets. */
const PURCHASED_NOTICE_MS = 1500

/** 272_000 → "04:32". Rounds up, so the display reaches 00:00 exactly when the hold expires. */
function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`
}

interface EventData {
  /** Which event this is, so data from the previous /events/:id isn't shown for a new one. */
  eventId: number
  event: EventDto
  seatMap: SeatMapDto
}

/** Loads the event and its seat map, and keeps the seats in state. */
function useEventData(eventId: number) {
  const valid = Number.isInteger(eventId) && eventId > 0
  const [data, setData] = useState<EventData | null>(null)
  const [error, setError] = useState<{ eventId: number; message: string } | null>(null)

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    Promise.all([
      apiFetch<EventDto>(`/api/events/${eventId}`),
      apiFetch<SeatMapDto>(`/api/events/${eventId}/seats`),
    ])
      .then(([event, seatMap]) => { if (!cancelled) setData({ eventId, event, seatMap }) })
      .catch((err) => { if (!cancelled) setError({ eventId, message: getErrorMessage(err) }) })
    return () => { cancelled = true }
  }, [eventId, valid])

  /**
   * Sets one seat's state, e.g. after reserving it or when the WebSocket reports that another
   * buyer took it. Stable between renders, so it can be passed to hooks and effects.
   */
  const updateSeat = useCallback((seatId: number, state: SeatState) => {
    setData((prev) => {
      if (!prev) return prev
      const seats = prev.seatMap.seats
      if (!seats.some((s) => s.seatId === seatId && s.state !== state)) return prev
      return {
        ...prev,
        seatMap: { ...prev.seatMap, seats: seats.map((s) => (s.seatId === seatId ? { ...s, state } : s)) },
      }
    })
  }, [])

  /** Fetches the seat map again, e.g. after a 409 showed that ours was out of date. Throws on failure. */
  const reloadSeats = useCallback(async () => {
    const seatMap = await apiFetch<SeatMapDto>(`/api/events/${eventId}/seats`)
    setData((prev) => (prev && prev.eventId === eventId ? { ...prev, seatMap } : prev))
  }, [eventId])

  return {
    data: data?.eventId === eventId ? data : null,
    error: !valid ? 'Üritust ei leitud.' : error?.eventId === eventId ? error.message : null,
    updateSeat,
    reloadSeats,
  }
}

const bySeat = (a: ReservationDto, b: ReservationDto) => a.row - b.row || a.number - b.number

export default function EventDetail() {
  const { id } = useParams()
  const eventId = Number(id)
  const { data, error, updateSeat, reloadSeats } = useEventData(eventId)
  const { user } = useAuth()
  const isBuyer = user?.role === 'Buyer'
  const navigate = useNavigate()
  const location = useLocation()

  /** The buyer's active holds in all events; the limit counts all of them. */
  const [reservations, setReservations] = useState<ReservationDto[]>([])
  /** Error or notice from the last seat click. */
  const [message, setMessage] = useState<string | null>(null)
  /** Seats with a request in flight; a second click on them is ignored. */
  const pending = useRef(new Set<number>())

  const loadReservations = useCallback(async () => {
    setReservations(await apiFetch<ReservationDto[]>('/api/reservations/my'))
  }, [])

  useEffect(() => {
    if (!isBuyer) return
    let cancelled = false
    apiFetch<ReservationDto[]>('/api/reservations/my')
      .then((list) => { if (!cancelled) setReservations(list) })
      .catch((err) => { if (!cancelled) setMessage(getErrorMessage(err)) })
    return () => { cancelled = true }
  }, [isBuyer])

  /** Brings seats and holds back in line with the server. */
  const resync = useCallback(async () => {
    try {
      await Promise.all([reloadSeats(), loadReservations()])
    } catch (err) {
      setMessage(getErrorMessage(err))
    }
  }, [reloadSeats, loadReservations])

  const selected = isBuyer ? reservations.filter((r) => r.eventId === eventId).sort(bySeat) : []

  // ---- Hold countdown: to the earliest expiresAt among this event's selected seats ----

  const earliestExpiry = selected.length > 0 ? Math.min(...selected.map((r) => Date.parse(r.expiresAt))) : null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (earliestExpiry === null) return
    const tick = () => {
      const current = Date.now()
      setNow(current)
      // At 0: drop the expired holds and reload. Seats held later stay selected (the server
      // still holds them), and the countdown moves on to the next one. If the server's clock
      // is a bit behind and still returns the hold, the next tick simply tries again.
      if (current >= earliestExpiry) {
        setReservations((prev) => prev.filter((r) => Date.parse(r.expiresAt) > current))
        setMessage('Broneeringu aeg sai läbi ja kohad vabastati. Vali kohad uuesti.')
        void resync()
      }
    }
    tick() // `now` may be stale if no countdown was running
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [earliestExpiry, resync])

  const remainingMs = earliestExpiry === null ? null : Math.max(0, earliestExpiry - now)

  // ---- Purchase ----

  const [purchasing, setPurchasing] = useState(false)
  /** Success notice; set means we're about to go to /my-tickets. */
  const [purchased, setPurchased] = useState<string | null>(null)

  useEffect(() => {
    if (!purchased) return
    const timer = window.setTimeout(() => navigate('/my-tickets'), PURCHASED_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [purchased, navigate])

  /** Buys the selected seats one by one; stops at the first failure. */
  const purchase = async () => {
    if (purchasing || selected.length === 0) return
    setPurchasing(true)
    setMessage(null)
    let bought = 0
    try {
      for (const reservation of selected) {
        await apiFetch<TicketDto>(`/api/reservations/${reservation.id}/purchase`, { method: 'POST' })
        bought++
        updateSeat(reservation.seatId, 'Sold')
        setReservations((prev) => prev.filter((r) => r.id !== reservation.id))
      }
      setPurchased(bought === 1 ? 'Pilet ostetud!' : 'Piletid ostetud!')
    } catch (err) {
      const reason = getErrorMessage(err)
      setMessage(bought > 0
        ? `${reason} ${bought} piletit jõuti osta, need on lehel „Minu piletid”.`
        : reason)
      await resync()
    } finally {
      setPurchasing(false)
    }
  }

  const reserve = async (seat: SeatDto) => {
    if (reservations.length >= MAX_ACTIVE_RESERVATIONS) {
      setMessage(`Korraga saab broneerida kuni ${MAX_ACTIVE_RESERVATIONS} kohta. Osta või tühista olemasolevad broneeringud.`)
      return
    }

    try {
      const body: CreateReservationRequest = { seatId: seat.seatId }
      const reservation = await apiFetch<ReservationDto>(`/api/events/${eventId}/reservations`, {
        method: 'POST',
        body,
      })
      updateSeat(seat.seatId, 'Mine')
      setReservations((prev) => [...prev, reservation])
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setMessage(SEAT_TAKEN)
        await resync()
      } else {
        setMessage(getErrorMessage(err))
      }
    }
  }

  const cancel = async (seatId: number) => {
    const reservation = reservations.find((r) => r.eventId === eventId && r.seatId === seatId)
    if (!reservation) {
      // Shown as ours but we don't know the hold (e.g. made in another tab): fetch it and retry.
      await resync()
      return
    }

    try {
      await apiFetch<void>(`/api/reservations/${reservation.id}`, { method: 'DELETE' })
      updateSeat(seatId, 'Free')
      setReservations((prev) => prev.filter((r) => r.id !== reservation.id))
    } catch (err) {
      setMessage(getErrorMessage(err))
      // 404: the hold is already gone; show the seat as it really is.
      if (err instanceof ApiError && err.status === 404) await resync()
    }
  }

  /** Runs one seat request at a time per seat, so a double click doesn't send two. */
  const withPending = async (seatId: number, action: () => Promise<void>) => {
    if (pending.current.has(seatId)) return
    pending.current.add(seatId)
    setMessage(null)
    try {
      await action()
    } finally {
      pending.current.delete(seatId)
    }
  }

  const goToLogin = () => navigate('/login', { state: { from: location } })

  const handleSeatClick = (seat: SeatDto) => {
    if (!isBuyer) {
      goToLogin()
      return
    }
    if (purchasing || purchased) return
    if (seat.state === 'Free') void withPending(seat.seatId, () => reserve(seat))
    else if (seat.state === 'Mine') void withPending(seat.seatId, () => cancel(seat.seatId))
  }

  return (
    <Container size="4" px="4">
      <Section size="2">
        <Box mb="4">
          <Link asChild size="2">
            <RouterLink to="/"><i className="ti ti-arrow-left" aria-hidden="true" /> Kõik üritused</RouterLink>
          </Link>
        </Box>

        {error && <ErrorCallout message={error} />}

        {!error && !data && (
          <Flex align="center" gap="2">
            <Spinner /> <Text color="gray">Laen üritust…</Text>
          </Flex>
        )}

        {data && (
          <>
            <Heading as="h1" size="8" mb="3">{data.event.name}</Heading>
            <Flex gap="5" wrap="wrap" mb="4">
              <Text className="tabular">
                <i className="ti ti-calendar-event" aria-hidden="true" /> {formatDateTime(data.event.startsAt)}
              </Text>
              <Text>
                <i className="ti ti-map-pin" aria-hidden="true" /> {data.event.hallName}
              </Text>
              <Text className="tabular">
                <i className="ti ti-ticket" aria-hidden="true" /> {formatPrice(data.event.price)}
              </Text>
            </Flex>
            {data.event.description && (
              <Text as="p" color="gray" mb="6" style={{ whiteSpace: 'pre-line' }}>{data.event.description}</Text>
            )}

            <Heading as="h2" size="6" mb="3">Vali koht</Heading>
            {message && <ErrorCallout message={message} />}

            <Grid columns={{ initial: '1', md: '1fr 300px' }} gap="4" align="start">
              {/* minWidth 0 lets a wide hall scroll inside the card instead of stretching the grid. */}
              <Card size="3" style={{ minWidth: 0 }}>
                <SeatMap
                  rows={data.seatMap.rows}
                  seatsPerRow={data.seatMap.seatsPerRow}
                  seats={data.seatMap.seats}
                  onSeatClick={handleSeatClick}
                />
              </Card>

              <Card size="3" asChild>
                <aside aria-labelledby="selection-heading">
                  <Heading as="h3" size="5" mb="3" id="selection-heading">Sinu valik</Heading>
                  {purchased && (
                    <Callout.Root color="green" role="status" mb="3">
                      <Callout.Icon><i className="ti ti-circle-check" aria-hidden="true" /></Callout.Icon>
                      <Callout.Text>{purchased}</Callout.Text>
                    </Callout.Root>
                  )}
                  {remainingMs !== null && (
                    <Flex align="center" justify="between" gap="2" mb="3">
                      <Text size="2" id="hold-timer-label">Aega jäänud</Text>
                      <span
                        role="timer"
                        aria-labelledby="hold-timer-label"
                        className={remainingMs <= 60_000 ? 'hold-timer hold-timer--urgent' : 'hold-timer'}
                      >
                        <i className="ti ti-clock" aria-hidden="true" />
                        {formatCountdown(remainingMs)}
                      </span>
                    </Flex>
                  )}
                  {purchased ? null : !isBuyer ? (
                    <>
                      <Text as="p" size="2" color="gray" mb="3">Kohtade valimiseks logi sisse.</Text>
                      <Button onClick={goToLogin}>Logi sisse</Button>
                    </>
                  ) : selected.length === 0 ? (
                    <Text as="p" size="2" color="gray">Vali saaliplaanilt vaba koht.</Text>
                  ) : (
                    <>
                      <Flex asChild direction="column" gap="2" mb="3">
                        <ul className="selection-list">
                          {selected.map((r) => (
                            <li key={r.id}>
                              <Flex align="center" justify="between" gap="2">
                                <Box>
                                  <Text as="div" weight="medium" className="tabular">
                                    Rida {rowLabel(r.row)}, koht {r.number}
                                  </Text>
                                  <Text as="div" size="1" color="gray" className="tabular">
                                    Hoitud kuni {formatTime(r.expiresAt)}
                                  </Text>
                                </Box>
                                <IconButton
                                  variant="ghost"
                                  color="gray"
                                  disabled={purchasing}
                                  aria-label={`Tühista rida ${rowLabel(r.row)}, koht ${r.number}`}
                                  onClick={() => void withPending(r.seatId, () => cancel(r.seatId))}
                                >
                                  <i className="ti ti-x" aria-hidden="true" />
                                </IconButton>
                              </Flex>
                            </li>
                          ))}
                        </ul>
                      </Flex>
                      <Flex justify="between" pt="3" mb="4" className="selection-total">
                        <Text weight="medium">Kokku</Text>
                        <Text weight="medium" className="tabular">{formatPrice(selected.length * data.event.price)}</Text>
                      </Flex>
                      <Button size="3" style={{ width: '100%' }} loading={purchasing} onClick={() => void purchase()}>
                        Osta
                      </Button>
                    </>
                  )}
                </aside>
              </Card>
            </Grid>
          </>
        )}
      </Section>
    </Container>
  )
}
