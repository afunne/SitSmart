import { useCallback, useEffect, useState } from 'react'
import { Box, Card, Container, Flex, Heading, Link, Section, Spinner, Text } from '@radix-ui/themes'
import { Link as RouterLink, useParams } from 'react-router'
import { apiFetch, getErrorMessage } from '../api/client.ts'
import type { EventDto, SeatMapDto, SeatState } from '../api/types.ts'
import ErrorCallout from '../components/ErrorCallout.tsx'
import SeatMap from '../components/SeatMap.tsx'
import { formatDateTime, formatPrice } from '../utils/format.ts'

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

  return {
    data: data?.eventId === eventId ? data : null,
    error: !valid ? 'Üritust ei leitud.' : error?.eventId === eventId ? error.message : null,
    updateSeat,
  }
}

export default function EventDetail() {
  const { id } = useParams()
  const { data, error } = useEventData(Number(id))

  // Reserving and releasing seats comes in the next step.
  const handleSeatClick = () => {}

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
            <Card size="3">
              <SeatMap
                rows={data.seatMap.rows}
                seatsPerRow={data.seatMap.seatsPerRow}
                seats={data.seatMap.seats}
                onSeatClick={handleSeatClick}
              />
            </Card>
          </>
        )}
      </Section>
    </Container>
  )
}
