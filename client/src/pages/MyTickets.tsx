import { useEffect, useState } from 'react'
import { Badge, Box, Button, Card, Code, Container, Flex, Grid, Heading, Section, Spinner, Text } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router'
import { apiFetch, apiFetchBlob, getErrorMessage } from '../api/client.ts'
import type { TicketDto } from '../api/types.ts'
import ErrorCallout from '../components/ErrorCallout.tsx'
import { formatDateTime, rowLabel } from '../utils/format.ts'
import './MyTickets.css'

/**
 * The ticket's QR code. Loaded with fetch because the endpoint needs the token, which an
 * <img src> can't send; the blob URL is revoked when the component unmounts.
 */
function TicketQr({ code }: { code: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let url: string | null = null

    apiFetchBlob(`/api/tickets/${encodeURIComponent(code)}/qr`, { signal: controller.signal })
      .then((blob) => {
        if (controller.signal.aborted) return // unmounted while the body was still loading
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true) })

    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [code])

  return (
    <div className="ticket-qr">
      {src ? (
        <img src={src} alt={`QR-kood, pilet ${code}`} width={145} height={145} />
      ) : failed ? (
        <Text size="1" align="center" className="ticket-qr-error">QR-koodi ei õnnestunud laadida.</Text>
      ) : (
        <Spinner aria-label="Laen QR-koodi" />
      )}
    </div>
  )
}

function TicketCard({ ticket }: { ticket: TicketDto }) {
  return (
    <Card size="3">
      <Flex gap="4" justify="between" wrap="wrap">
        <Box>
          <Flex align="center" gap="2" wrap="wrap" mb="2">
            <Heading as="h2" size="5">{ticket.eventName}</Heading>
            {ticket.usedAt && (
              <Badge size="2" color="gray"><i className="ti ti-circle-check" aria-hidden="true" />Kasutatud</Badge>
            )}
          </Flex>
          <Flex direction="column" gap="1" mb="3">
            <Text size="2" className="tabular">
              <i className="ti ti-calendar-event" aria-hidden="true" /> {formatDateTime(ticket.startsAt)}
            </Text>
            <Text size="2">
              <i className="ti ti-map-pin" aria-hidden="true" /> {ticket.hallName}
            </Text>
            <Text size="2" className="tabular">
              <i className="ti ti-armchair" aria-hidden="true" /> Rida {rowLabel(ticket.row)}, koht {ticket.number}
            </Text>
          </Flex>
          <Text as="div" size="1" color="gray">Pileti kood</Text>
          <Code size="4" variant="ghost" className="ticket-code">{ticket.code}</Code>
        </Box>
        <TicketQr code={ticket.code} />
      </Flex>
    </Card>
  )
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<TicketDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<TicketDto[]>('/api/tickets/my')
      .then((data) => { if (!cancelled) setTickets(data) })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  return (
    <Container size="4" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="5">Minu piletid</Heading>

        {error && <ErrorCallout message={error} />}

        {!error && tickets === null && (
          <Flex align="center" gap="2">
            <Spinner /> <Text color="gray">Laen pileteid…</Text>
          </Flex>
        )}

        {tickets?.length === 0 && (
          <Flex direction="column" align="start" gap="3">
            <Text as="p" color="gray">Sul pole veel pileteid</Text>
            <Button asChild size="3">
              <RouterLink to="/">Vaata üritusi</RouterLink>
            </Button>
          </Flex>
        )}

        {/* The API sorts them: upcoming events first, then past ones. */}
        {tickets && tickets.length > 0 && (
          <Grid columns={{ initial: '1', md: '2' }} gap="4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </Grid>
        )}
      </Section>
    </Container>
  )
}
