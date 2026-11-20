import { useState } from 'react'
import { Box, Button, Card, Flex, Heading, Inset, Text } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router'
import type { EventDto } from '../api/types.ts'
import { formatDateTime, formatPrice } from '../utils/format.ts'
import './EventCard.css'

const DEFAULT_IMAGE = '/img/events/event_default_theatre.gif'

export default function EventCard({ event }: { event: EventDto }) {
  // Fall back to the default picture when there is no URL or it fails to load.
  const [imageFailed, setImageFailed] = useState(false)
  const useDefault = !event.imageUrl || imageFailed

  return (
    <Card size="2" className="event-card">
      <Inset clip="padding-box" side="top" pb="current">
        <img
          className={useDefault ? 'event-card-image event-card-image--pixel' : 'event-card-image'}
          src={useDefault ? DEFAULT_IMAGE : event.imageUrl!}
          alt=""
          width={384}
          height={216}
          onError={() => setImageFailed(true)}
        />
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
