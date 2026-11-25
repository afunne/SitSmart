import { useState } from 'react'
import { Badge, Box, Button, Card, Flex, Heading, Inset, Text } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router'
import type { EventDto } from '../api/types.ts'
import { defaultEventImage } from '../utils/defaultEventImage.ts'
import { formatDateTime, formatDay, formatMonthShort, formatPrice } from '../utils/format.ts'
import './EventCard.css'

export default function EventCard({ event }: { event: EventDto }) {
  // Fall back to the default picture when there is no URL or it fails to load.
  const [imageFailed, setImageFailed] = useState(false)
  const useDefault = !event.imageUrl || imageFailed

  return (
    <Card size="2" className="event-card">
      <Inset clip="padding-box" side="top" pb="current" className="event-card-media">
        <img
          className="event-card-image"
          // TODO(#40): pass event.hallType once the API returns it.
          src={useDefault ? defaultEventImage() : event.imageUrl!}
          alt=""
          width={384}
          height={216}
          onError={() => setImageFailed(true)}
        />
        {/* Hidden from screen readers: the full date is in the text below. */}
        <Badge color="ruby" variant="solid" size="2" className="event-card-date" aria-hidden="true">
          <span className="event-card-date-day tabular">{formatDay(event.startsAt)}</span>
          <span className="event-card-date-month">{formatMonthShort(event.startsAt)}</span>
        </Badge>
      </Inset>

      <Heading as="h2" size="5" mb="2">{event.name}</Heading>
      <Flex direction="column" gap="1" mb="4">
        <Text as="p" size="2" className="tabular">
          <i className="ti ti-calendar-event" aria-hidden="true" /> {formatDateTime(event.startsAt)}
        </Text>
        <Text as="p" size="2">
          <i className="ti ti-map-pin" aria-hidden="true" /> {event.hallName}
        </Text>
        <Text as="p" size="2" className="tabular">
          <i className="ti ti-ticket" aria-hidden="true" /> {formatPrice(event.price)}
        </Text>
      </Flex>

      <Box className="event-card-action">
        <Button asChild size="3">
          <RouterLink to={`/events/${event.id}`} aria-label={`Vali koht: ${event.name}`}>
            Vali koht
          </RouterLink>
        </Button>
      </Box>
    </Card>
  )
}
