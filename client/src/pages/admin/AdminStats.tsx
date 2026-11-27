import { useEffect, useEffectEvent, useState, type ReactNode } from 'react'
import {
  Card,
  Container,
  DataList,
  Grid,
  Heading,
  Link,
  Section,
  Skeleton,
  Table,
  Text,
  VisuallyHidden,
} from '@radix-ui/themes'
import { apiFetch } from '../../api/client.ts'
import { errorMessage } from '../../api/errorMessage.ts'
import type { EventStatsDto } from '../../api/types.ts'
import EmptyState from '../../components/EmptyState.tsx'
import ErrorCallout from '../../components/ErrorCallout.tsx'
import { formatPrice } from '../../utils/format.ts'

const percentFormat = new Intl.NumberFormat('et-EE', { style: 'percent', maximumFractionDigits: 1 })

/** 33.3 → "33,3%" */
const formatPercent = (fillPercent: number) => percentFormat.format(fillPercent / 100)

const SKELETON_ROWS = 4

/** All events with their sales figures; picking a row shows that event's figures in a card. */
export default function AdminStats() {
  const [stats, setStats] = useState<EventStatsDto[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<EventStatsDto[]>('/api/stats/events')
      .then(data => { if (!cancelled) setStats(data) })
      .catch(err => { if (!cancelled) setLoadError(errorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  /** The card fetched newer figures, so the table row shows them too. */
  const handleDetailLoaded = (fresh: EventStatsDto) => {
    setStats(prev => prev?.map(s => (s.eventId === fresh.eventId ? fresh : s)) ?? prev)
  }

  return (
    <Container size="4" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="5">Statistika</Heading>

        {loadError ? (
          <ErrorCallout message={loadError} />
        ) : stats === null ? (
          <>
            <VisuallyHidden role="status">Laen statistikat…</VisuallyHidden>
            <Grid columns={{ initial: '1', lg: '1fr 320px' }} gap="4" align="start" aria-hidden="true">
              <StatsTable>
                {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                  <Table.Row key={i}>
                    <Table.RowHeaderCell><Skeleton width="10rem" height="20px" /></Table.RowHeaderCell>
                    {Array.from({ length: 6 }, (_, j) => (
                      <Table.Cell key={j} justify="end"><Skeleton width="3rem" height="20px" /></Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </StatsTable>
              <Card size="3">
                <Skeleton width="60%" height="24px" mb="3" />
                <Skeleton width="80%" height="16px" />
              </Card>
            </Grid>
          </>
        ) : stats.length === 0 ? (
          <EmptyState
            image="/img/seats/seat_red_free.gif"
            title="Üritusi pole"
            text="Statistika ilmub siia, kui oled lisanud mõne ürituse."
          />
        ) : (
          <Grid columns={{ initial: '1', lg: '1fr 320px' }} gap="4" align="start">
            <StatsTable>
              {stats.map(s => {
                const selected = s.eventId === selectedId
                return (
                  <Table.Row
                    key={s.eventId}
                    align="center"
                    onClick={() => setSelectedId(s.eventId)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selected ? 'var(--accent-a4)' : undefined,
                    }}
                  >
                    <Table.RowHeaderCell>
                      {/* The button makes the row usable with the keyboard; its click reaches the row's onClick. */}
                      <Link asChild weight={selected ? 'bold' : 'medium'} highContrast={selected}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          style={{ background: 'none', border: 0, padding: 0, font: 'inherit', textAlign: 'left', cursor: 'pointer' }}
                        >
                          {s.name}
                        </button>
                      </Link>
                    </Table.RowHeaderCell>
                    <Table.Cell justify="end" className="tabular">{s.sold}</Table.Cell>
                    <Table.Cell justify="end" className="tabular">{s.reserved}</Table.Cell>
                    <Table.Cell justify="end" className="tabular">{s.free}</Table.Cell>
                    <Table.Cell justify="end" className="tabular">{s.checkedIn}</Table.Cell>
                    <Table.Cell justify="end" className="tabular">{formatPercent(s.fillPercent)}</Table.Cell>
                    <Table.Cell justify="end" className="tabular">{formatPrice(s.revenue)}</Table.Cell>
                  </Table.Row>
                )
              })}
            </StatsTable>

            {selectedId === null ? (
              <Card size="3">
                <Text as="p" color="gray">Vali tabelist üritus, et näha selle statistikat.</Text>
              </Card>
            ) : (
              <EventStatsCard eventId={selectedId} onLoaded={handleDetailLoaded} />
            )}
          </Grid>
        )}
      </Section>
    </Container>
  )
}

/** The table with its header; the rows come from the caller (real ones or skeletons). */
function StatsTable({ children }: { children: ReactNode }) {
  return (
    // minWidth 0 lets the table scroll sideways inside the grid on narrow screens.
    <Table.Root variant="surface" style={{ minWidth: 0 }}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Üritus</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Müüdud</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Broneeritud</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Vabu</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Kasutatud</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Täituvus</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Tulu</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{children}</Table.Body>
    </Table.Root>
  )
}

interface EventStatsCardProps {
  eventId: number
  onLoaded: (stats: EventStatsDto) => void
}

/** Fresh figures of one event from GET /api/events/{id}/stats. */
function EventStatsCard({ eventId, onLoaded }: EventStatsCardProps) {
  // Each keyed by eventId, so a quick switch to another event never shows the previous one's data.
  const [stats, setStats] = useState<EventStatsDto | null>(null)
  const [error, setError] = useState<{ eventId: number; message: string } | null>(null)
  // Always calls the latest onLoaded, without refetching when it changes.
  const handleLoaded = useEffectEvent(onLoaded)

  useEffect(() => {
    let cancelled = false
    apiFetch<EventStatsDto>(`/api/events/${eventId}/stats`)
      .then(data => {
        if (cancelled) return
        setStats(data)
        handleLoaded(data)
      })
      .catch(err => { if (!cancelled) setError({ eventId, message: errorMessage(err) }) })
    return () => { cancelled = true }
  }, [eventId])

  const current = stats?.eventId === eventId ? stats : null
  const currentError = error?.eventId === eventId ? error.message : null

  return (
    <Card size="3" asChild>
      <section aria-labelledby="event-stats-heading" aria-busy={!current && !currentError}>
        {currentError ? (
          <ErrorCallout message={currentError} />
        ) : !current ? (
          <>
            <VisuallyHidden role="status">Laen ürituse statistikat…</VisuallyHidden>
            <Heading as="h2" size="5" mb="4" id="event-stats-heading">
              <Skeleton width="70%" height="28px" />
            </Heading>
            <DataList.Root aria-hidden="true">
              {Array.from({ length: 7 }, (_, i) => (
                <DataList.Item key={i}>
                  <DataList.Label><Skeleton width="6rem" height="16px" /></DataList.Label>
                  <DataList.Value><Skeleton width="4rem" height="16px" /></DataList.Value>
                </DataList.Item>
              ))}
            </DataList.Root>
          </>
        ) : (
          <>
            <Heading as="h2" size="5" mb="4" id="event-stats-heading">{current.name}</Heading>
            <DataList.Root>
              <StatItem label="Kohti kokku" value={current.totalSeats} />
              <StatItem label="Müüdud" value={current.sold} />
              <StatItem label="Broneeritud" value={current.reserved} />
              <StatItem label="Vabu" value={current.free} />
              <StatItem label="Kasutatud" value={`${current.checkedIn} / ${current.sold}`} />
              <StatItem label="Täituvus" value={formatPercent(current.fillPercent)} />
              <StatItem label="Tulu" value={formatPrice(current.revenue)} />
            </DataList.Root>
          </>
        )}
      </section>
    </Card>
  )
}

function StatItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <DataList.Item>
      <DataList.Label minWidth="8rem">{label}</DataList.Label>
      <DataList.Value className="tabular">{value}</DataList.Value>
    </DataList.Item>
  )
}
