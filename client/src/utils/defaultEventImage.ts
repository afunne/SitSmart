// Pixel-art picture for an event that has no image of its own, chosen by the hall type.

const IMAGES: Record<string, string> = {
  Theatre: '/img/events/event_default_theatre.gif',
  Cinema: '/img/events/event_default_cinema.gif',
  Concert: '/img/events/event_default_concert.gif',
  StandUp: '/img/events/event_default_standup.gif',
}

/** The default picture for a hall type (Theatre, Cinema, Concert, StandUp); theatre when it is missing or unknown. */
export function defaultEventImage(hallType?: string): string {
  return (hallType && IMAGES[hallType]) || IMAGES.Theatre
}
