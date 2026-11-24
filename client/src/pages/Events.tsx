import { useEffect, useState } from 'react'
import { Card, Container, Flex, Grid, Heading, Inset, Section, Skeleton, VisuallyHidden } from '@radix-ui/themes'
import { apiFetch } from '../api/client.ts'
import { errorMessage } from '../api/errorMessage.ts'
import type { EventDto } from '../api/types.ts'
import EmptyState from '../components/EmptyState.tsx'
import ErrorCallout from '../components/ErrorCallout.tsx'
import EventCard from '../components/EventCard.tsx' // also loads EventCard.css, used by the skeleton

const EVENT_GRID_COLUMNS = { initial: '1', sm: '2', md: '3' } as const

/** Placeholder with the same shape as EventCard, shown while the list loads. */
function EventCardSkeleton() {
  return (
    <Card size="2" className="event-card">
      <Inset clip="padding-box" side="top" pb="current">
        <Skeleton className="event-card-image" />
      </Inset>
      <Skeleton width="70%" height="28px" mb="3" />
      <Flex direction="column" gap="2" mb="4">
        <Skeleton width="60%" height="16px" />
        <Skeleton width="40%" height="16px" />
        <Skeleton width="30%" height="16px" />
      </Flex>
      <Skeleton width="100%" height="40px" className="event-card-action" />
    </Card>
  )
}

export default function Events() {
  const [events, setEvents] = useState<EventDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<EventDto[]>('/api/events')
      .then((data) => {
        if (cancelled) return
        // The API also returns past events (after the upcoming ones); those can't be booked.
        const now = Date.now()
        setEvents(data.filter((e) => new Date(e.startsAt).getTime() > now))
      })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  return (
    <Container size="4" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="5">Üritused</Heading>

        {error && <ErrorCallout message={error} />}

        {!error && events === null && (
          <>
            <VisuallyHidden role="status">Laen üritusi…</VisuallyHidden>
            <Grid columns={EVENT_GRID_COLUMNS} gap="4" aria-hidden="true">
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </Grid>
          </>
        )}

        {events?.length === 0 && (
          <EmptyState
            image="/img/seats/seat_red_free.gif"
            title="Üritusi pole"
            text="Praegu pole ühtegi eelseisvat üritust."
          />
        )}

        {events && events.length > 0 && (
          <Grid columns={EVENT_GRID_COLUMNS} gap="4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Grid>
        )}
      </Section>
    </Container>
  )
}
