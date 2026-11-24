// TEMPORARY: preview of the themed Radix components. Delete once real pages exist.
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Link,
  Section,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useState } from 'react'
import { toast } from 'sonner'
import type { SeatDto, SeatState } from '../api/types.ts'
import SeatMap from '../components/SeatMap.tsx'

const Icon = ({ name }: { name: string }) => <i className={`ti ti-${name}`} aria-hidden="true" />

const DEMO_ROWS = 6
const DEMO_SEATS_PER_ROW = 10

/** Fake hall: a few sold and held seats, and one of "mine". */
function demoSeats(): SeatDto[] {
  const taken: Record<string, SeatState> = {
    '1-4': 'Sold', '1-5': 'Sold', '1-6': 'Sold',
    '2-2': 'Reserved', '2-7': 'Mine',
    '3-1': 'Sold', '3-9': 'Sold', '3-10': 'Sold',
    '4-5': 'Reserved', '4-6': 'Reserved',
    '5-3': 'Sold', '5-8': 'Sold',
    '6-4': 'Sold', '6-5': 'Sold', '6-6': 'Sold', '6-7': 'Sold',
  }
  const seats: SeatDto[] = []
  for (let row = 1; row <= DEMO_ROWS; row++) {
    for (let number = 1; number <= DEMO_SEATS_PER_ROW; number++) {
      seats.push({
        seatId: (row - 1) * DEMO_SEATS_PER_ROW + number,
        row,
        number,
        state: taken[`${row}-${number}`] ?? 'Free',
      })
    }
  }
  return seats
}

function SeatMapDemo() {
  const [seats, setSeats] = useState(demoSeats)
  const [changed, setChanged] = useState<Set<number>>(new Set())

  const setState = (seatId: number, state: SeatState) =>
    setSeats((current) => current.map((s) => (s.seatId === seatId ? { ...s, state } : s)))

  // Clicking toggles a seat between free and "mine", like choosing seats would.
  const handleSeatClick = (seat: SeatDto) => setState(seat.seatId, seat.state === 'Mine' ? 'Free' : 'Mine')

  // Pretend another buyer just held a random free seat, as a live update would.
  const simulateOtherBuyer = () => {
    const free = seats.filter((s) => s.state === 'Free')
    if (free.length === 0) return
    const seat = free[Math.floor(Math.random() * free.length)]
    setState(seat.seatId, 'Reserved')
    setChanged(new Set([seat.seatId]))
  }

  return (
    <>
      <SeatMap
        rows={DEMO_ROWS}
        seatsPerRow={DEMO_SEATS_PER_ROW}
        seats={seats}
        onSeatClick={handleSeatClick}
        changedSeatIds={changed}
      />
      <Flex justify="center" gap="3" mt="4">
        <Button variant="outline" color="gray" highContrast onClick={simulateOtherBuyer}>
          Simulate another buyer
        </Button>
        <Button variant="outline" color="gray" highContrast onClick={() => { setSeats(demoSeats()); setChanged(new Set()) }}>
          Reset
        </Button>
      </Flex>
    </>
  )
}

export default function Styleguide() {
  return (
    <Container size="3" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="2">SitSmart style guide</Heading>
        <Text as="p" color="gray">Temporary preview of the Radix Themes components with SitSmart colors.</Text>
      </Section>

      <Heading as="h2" size="6" mb="3">Typography</Heading>
      <Flex direction="column" gap="2" mb="6">
        <Heading as="h1" size="8">Heading 1</Heading>
        <Heading as="h2" size="7">Heading 2</Heading>
        <Heading as="h3" size="6">Heading 3</Heading>
        <Heading as="h4" size="5">Heading 4</Heading>
        <Text as="p">
          Body text in Inter. <Link href="#">This is a link</Link>. <Text weight="bold">Bold text.</Text>
        </Text>
        <Text as="p" size="2" color="gray">Small muted text</Text>
      </Flex>

      <Heading as="h2" size="6" mb="3">Buttons</Heading>
      <Flex gap="3" wrap="wrap" mb="3">
        <Button size="3"><Icon name="ticket" />Reserve seats</Button>
        <Button size="3" variant="outline" color="gray" highContrast>Back</Button>
        <Button size="3" color="red"><Icon name="trash" />Cancel reservation</Button>
      </Flex>
      <Flex gap="3" wrap="wrap" mb="6">
        <Button size="3" disabled>Reserve seats</Button>
        <Button size="3" variant="outline" color="gray" highContrast disabled>Back</Button>
        <Button size="3" color="red" disabled>Cancel reservation</Button>
      </Flex>

      <Heading as="h2" size="6" mb="3">Form fields</Heading>
      <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="6">
        <Flex direction="column" gap="1">
          <Text as="label" htmlFor="sg-name" size="2" weight="medium">Name</Text>
          <TextField.Root id="sg-name" size="3" placeholder="Mari Maasikas" />
        </Flex>
        <Flex direction="column" gap="1">
          <Text as="label" htmlFor="sg-email" size="2" weight="medium">Email</Text>
          <TextField.Root id="sg-email" size="3" defaultValue="mari@"
                          aria-invalid="true" aria-describedby="sg-email-error" />
          <Text id="sg-email-error" size="2" color="red">
            <Icon name="alert-circle" /> Enter an email address, e.g. name@example.com
          </Text>
        </Flex>
        <Flex direction="column" gap="1">
          <Text as="label" htmlFor="sg-disabled" size="2" weight="medium">Disabled</Text>
          <TextField.Root id="sg-disabled" size="3" defaultValue="Not editable" disabled />
        </Flex>
      </Grid>

      <Heading as="h2" size="6" mb="3">Cards</Heading>
      <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="6">
        <Card size="3" asChild>
          <a href="#">
            <Heading as="h3" size="5" mb="2">Autumn Gala Concert</Heading>
            <Text as="p" size="2"><Icon name="calendar-event" /> 14.12.2026 19:00</Text>
            <Text as="p" size="2"><Icon name="map-pin" /> Main Hall</Text>
          </a>
        </Card>
        <Card size="3">
          <Heading as="h3" size="5" mb="2">Jazz Night</Heading>
          <Badge size="2" color="amber" variant="solid" mb="3"><Icon name="alert-triangle" />Few seats left</Badge>
          <Box><Button>Choose seats</Button></Box>
        </Card>
        <Card size="3">
          <Heading as="h3" size="5" mb="2">Theatre Premiere</Heading>
          <Badge size="2" color="red" variant="solid"><Icon name="alert-circle" />Sold out</Badge>
        </Card>
      </Grid>

      <Heading as="h2" size="6" mb="3">Badges</Heading>
      <Flex gap="2" wrap="wrap" mb="6">
        <Badge size="2" color="gray">Neutral</Badge>
        <Badge size="2" color="green" variant="solid"><Icon name="circle-check" />Paid</Badge>
        <Badge size="2" color="amber" variant="solid"><Icon name="alert-triangle" />Expires soon</Badge>
        <Badge size="2" color="red" variant="solid"><Icon name="alert-circle" />Cancelled</Badge>
        <Badge size="2" color="blue" variant="solid"><Icon name="info-circle" />Info</Badge>
      </Flex>

      <Heading as="h2" size="6" mb="3">Table</Heading>
      <Table.Root variant="surface" mb="6">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Event</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Seats</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell justify="end">Price</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell><Link href="#">Autumn Gala Concert</Link></Table.RowHeaderCell>
            <Table.Cell>Row 4, seats 9–10</Table.Cell>
            <Table.Cell justify="end" className="tabular">48.00 €</Table.Cell>
            <Table.Cell><Badge color="green" variant="solid">Paid</Badge></Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell><Link href="#">Jazz Night</Link></Table.RowHeaderCell>
            <Table.Cell>Row 12, seat 3</Table.Cell>
            <Table.Cell justify="end" className="tabular">15.50 €</Table.Cell>
            <Table.Cell><Badge color="amber" variant="solid">Held</Badge></Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>

      <Heading as="h2" size="6" mb="3">Seat map</Heading>
      <Text as="p" size="2" color="gray" mb="3">
        Fake data. Click a free seat to select it; "Simulate another buyer" holds a random seat with the pulse.
      </Text>
      <Box mb="6">
        <SeatMapDemo />
      </Box>

      <Heading as="h2" size="6" mb="3">Notices</Heading>
      <Text as="p" size="2" color="gray" mb="3">
        Results of an action are toasts (sonner, styles/toast.css). Callout is for a page that failed to load.
      </Text>
      <Flex gap="3" mb="3">
        <Button variant="soft" onClick={() => toast.success('Pilet ostetud!')}>Success toast</Button>
        <Button variant="soft" color="red" onClick={() => toast.error('Koht on juba võetud - vali mõni teine')}>
          Error toast
        </Button>
      </Flex>
      <Flex direction="column" gap="3" mb="9">
        <Callout.Root color="green">
          <Callout.Icon><Icon name="circle-check" /></Callout.Icon>
          <Callout.Text>Seats reserved. Row 4, seats 9–10 are held for 10 minutes.</Callout.Text>
        </Callout.Root>
        <Callout.Root color="red">
          <Callout.Icon><Icon name="alert-circle" /></Callout.Icon>
          <Callout.Text>Payment failed. Try another card.</Callout.Text>
        </Callout.Root>
      </Flex>
    </Container>
  )
}
