import { useEffect, useState } from 'react'
import { Container, Flex, Grid, Heading, Section, Spinner, Text } from '@radix-ui/themes'
import { apiFetch, getErrorMessage } from '../api/client.ts'
import type { EventDto } from '../api/types.ts'
import ErrorCallout from '../components/ErrorCallout.tsx'
import EventCard from '../components/EventCard.tsx'

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
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  return (
    <Container size="4" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="5">Üritused</Heading>

        {error && <ErrorCallout message={error} />}

        {!error && events === null && (
          <Flex align="center" gap="2">
            <Spinner /> <Text color="gray">Laen üritusi…</Text>
          </Flex>
        )}

        {events?.length === 0 && (
          <Text as="p" color="gray">Praegu pole ühtegi eelseisvat üritust.</Text>
        )}

        {events && events.length > 0 && (
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </Grid>
        )}
      </Section>
    </Container>
  )
}
