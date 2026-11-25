import type { MouseEvent } from 'react'
import { Button, Container, Heading, Text } from '@radix-ui/themes'
import './EventsHero.css'

/** The pixel seat map's layout, back row first: F free, R reserved, M mine, S sold. */
const SEAT_ROWS = ['FFRRFFF', 'FSSFMMF', 'FFFFFSF', 'SFFRFFF']

const SEAT_IMAGES: Record<string, string> = {
  F: '/img/seats/seat_red_free.gif',
  R: '/img/seats/seat_red_reserved.gif',
  M: '/img/seats/seat_red_mine.gif',
}

/** A sold seat shows the cat sitting in it; these take turns so the map looks varied. */
const SOLD_CATS = ['black', 'ginger', 'grey', 'siamese', 'tabby', 'white']

function seatImage(code: string, row: number, seat: number): string {
  if (code === 'S') return `/img/seats/seat_red_sold_${SOLD_CATS[(seat * 5 + row * 3) % SOLD_CATS.length]}.gif`
  return SEAT_IMAGES[code]
}

interface EventsHeroProps {
  /** id of the element "Vaata üritusi" scrolls to; it should be focusable (tabIndex={-1}). */
  listId: string
}

/** Intro at the top of the Events page: heading, one sentence, a button down to the list, and a decorative seat map. */
export default function EventsHero({ listId }: EventsHeroProps) {
  // Scroll smoothly (unless the user asked for less motion) and move focus to the list,
  // so keyboard and screen reader users continue from there.
  const scrollToList = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(listId)
    if (!target) return
    e.preventDefault()
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    target.focus({ preventScroll: true })
  }

  return (
    <section className="events-hero" aria-labelledby="events-hero-title">
      <Container size="4" px="4">
        <div className="events-hero-inner">
          <div className="events-hero-text">
            <Heading as="h1" size={{ initial: '8', sm: '9' }} id="events-hero-title" className="events-hero-title">
              Leia oma koht
            </Heading>
            <Text as="p" size="4" className="events-hero-lead">
              Vali saali skeemilt vaba koht, me hoiame seda sulle 10 minutit.
            </Text>
            <Button asChild size="4">
              <a href={`#${listId}`} onClick={scrollToList}>Vaata üritusi</a>
            </Button>
          </div>

          {/* Decorative: the pictures say nothing the text doesn't. */}
          <div className="events-hero-map" aria-hidden="true">
            {SEAT_ROWS.map((row, r) => (
              <div key={r} className="events-hero-row">
                {[...row].map((code, s) => (
                  <img key={s} src={seatImage(code, r, s)} alt="" width={48} height={48} className="events-hero-seat" />
                ))}
              </div>
            ))}
            <img src="/img/stage/front_theatre_240px.gif" alt="" width={240} height={60} className="events-hero-stage" />
          </div>
        </div>
      </Container>
    </section>
  )
}
