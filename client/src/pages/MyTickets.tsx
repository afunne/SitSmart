import { useEffect, useState } from 'react'
import { Box, Button, Container, Grid, Heading, Section, VisuallyHidden } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router'
import { apiFetch } from '../api/client.ts'
import { errorMessage } from '../api/errorMessage.ts'
import type { TicketDto } from '../api/types.ts'
import EmptyState from '../components/EmptyState.tsx'
import ErrorCallout from '../components/ErrorCallout.tsx'
import TicketCard, { TicketCardSkeleton } from '../components/TicketCard.tsx'

const TICKET_GRID_COLUMNS = { initial: '1', md: '2' } as const

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<TicketDto[]>('/api/tickets/my')
      .then((data) => { if (!cancelled) setTickets(data) })
      .catch((err) => { if (!cancelled) setError(errorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  return (
    <Container size="4" px="4">
      <Section size="2">
        {/* When printing, ticket.css hides everything but the tickets themselves. */}
        <Heading as="h1" size="8" mb="5" className="ticket-print-hidden">Minu piletid</Heading>

        {error && <ErrorCallout message={error} />}

        {!error && tickets === null && (
          <>
            <VisuallyHidden role="status">Laen pileteid…</VisuallyHidden>
            <Grid columns={TICKET_GRID_COLUMNS} gap="4" aria-hidden="true">
              <TicketCardSkeleton />
              <TicketCardSkeleton />
            </Grid>
          </>
        )}

        {tickets?.length === 0 && (
          <EmptyState
            image="/img/seats/seat_red_sold_white.gif"
            title="Sul pole veel pileteid"
            text="Ostetud piletid ilmuvad siia koos QR-koodiga."
            action={
              <Button asChild size="3">
                <RouterLink to="/">Vaata üritusi</RouterLink>
              </Button>
            }
          />
        )}

        {/* The API sorts them: upcoming events first, then past ones. */}
        {tickets && tickets.length > 0 && (
          <>
            <Grid columns={TICKET_GRID_COLUMNS} gap="4">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </Grid>
            <Box mt="5" className="ticket-print-hidden">
              <Button size="3" onClick={() => window.print()}>
                <i className="ti ti-printer" aria-hidden="true" /> Prindi
              </Button>
            </Box>
          </>
        )}
      </Section>
    </Container>
  )
}
