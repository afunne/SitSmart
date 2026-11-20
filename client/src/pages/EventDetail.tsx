import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
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
} from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import ErrorCallout from '../components/ErrorCallout.tsx'
import SeatMap from '../components/SeatMap.tsx'
import { formatDateTime, formatPrice, formatTime, rowLabel } from '../utils/format.ts'

/** Same as ReservationService.MaxActiveReservationsPerUser in the API (counted across all events). */
const MAX_ACTIVE_RESERVATIONS = 6

const SEAT_TAKEN = 'Koht on juba võetud - vali mõni teine'

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
  const resync = async () => {
    try {
      await Promise.all([reloadSeats(), loadReservations()])
    } catch (err) {
      setMessage(getErrorMessage(err))
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
    if (seat.state === 'Free') void withPending(seat.seatId, () => reserve(seat))
    else if (seat.state === 'Mine') void withPending(seat.seatId, () => cancel(seat.seatId))
  }

  const selected = isBuyer ? reservations.filter((r) => r.eventId === eventId).sort(bySeat) : []

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
                  {!isBuyer ? (
                    <>
                      <Text as="p" size="2" color="gray" mb="3">Kohtade valimiseks logi sisse.</Text>
                      <Button onClick={goToLogin}>Logi sisse</Button>
                    </>
                  ) : selected.length === 0 ? (
                    <Text as="p" size="2" color="gray">Vali saaliplaanilt vaba koht.</Text>
                  ) : (
                    <>
                      <Flex asChild direction="column" gap="2" mb="3">
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
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
                      <Flex justify="between" pt="3" style={{ borderTop: '1px solid var(--royal)' }}>
                        <Text weight="medium">Kokku</Text>
                        <Text weight="medium" className="tabular">{formatPrice(selected.length * data.event.price)}</Text>
                      </Flex>
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
