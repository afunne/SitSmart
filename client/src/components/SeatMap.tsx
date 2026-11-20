import type { SeatDto, SeatState } from '../api/types.ts'
import { rowLabel } from '../utils/format.ts'
import '../styles/seatmap.css'

const SEAT_IMG = '/img/seats'
const DEFAULT_STAGE_SRC = '/img/stage/front_theatre_480px.gif'

/** Sold seats get a cat; which one depends only on the seat's position (see soldCat). */
const CATS = ['white', 'siamese', 'grey', 'ginger', 'black', 'tabby'] as const

/** Rows 1–2 (A and B) are the royal seats. */
const ROYAL_ROWS = 2

const STATE_TEXT: Record<SeatState, string> = {
  Free: 'vaba',
  Mine: 'sinu valik',
  Reserved: 'broneeritud',
  Sold: 'müüdud',
}

interface SeatMapProps {
  rows: number
  seatsPerRow: number
  seats: SeatDto[]
  onSeatClick: (seat: SeatDto) => void
  /** Stage picture under the seats. */
  stageSrc?: string
  /** Seats that just changed (e.g. another buyer took them); they pulse briefly. */
  changedSeatIds?: Set<number>
}

/**
 * The same seat always shows the same cat. rowCharCode is the code of the row letter
 * ("A" = 65); past Z it simply keeps counting, which is all the formula needs.
 */
function soldCat(row: number, number: number): (typeof CATS)[number] {
  const rowCharCode = 64 + row
  return CATS[(number * 7 + rowCharCode) % CATS.length]
}

function seatImage(seat: SeatDto): string {
  const style = seat.row <= ROYAL_ROWS ? 'royal' : 'red'
  switch (seat.state) {
    case 'Free':
      return `${SEAT_IMG}/seat_${style}_free.gif`
    case 'Mine':
      return `${SEAT_IMG}/seat_${style}_mine.gif`
    case 'Reserved':
      return `${SEAT_IMG}/seat_${style}_reserved.gif`
    case 'Sold':
      return `${SEAT_IMG}/seat_${style}_sold_${soldCat(seat.row, seat.number)}.gif`
  }
}

const LEGEND: { src: string; label: string }[] = [
  { src: `${SEAT_IMG}/seat_red_free.gif`, label: 'Vaba' },
  { src: `${SEAT_IMG}/seat_red_mine.gif`, label: 'Sinu valik' },
  { src: `${SEAT_IMG}/seat_red_reserved.gif`, label: 'Broneeritud' },
  { src: `${SEAT_IMG}/seat_red_sold_ginger.gif`, label: 'Müüdud' },
]

export default function SeatMap({
  rows,
  seatsPerRow,
  seats,
  onSeatClick,
  stageSrc = DEFAULT_STAGE_SRC,
  changedSeatIds,
}: SeatMapProps) {
  const byPosition = new Map(seats.map((seat) => [`${seat.row}-${seat.number}`, seat]))

  // Row A is closest to the stage, which is at the bottom, so rows are drawn last to first.
  const rowNumbers = Array.from({ length: rows }, (_, i) => rows - i)
  const seatNumbers = Array.from({ length: seatsPerRow }, (_, i) => i + 1)

  return (
    <div className="seatmap">
      <div className="seatmap-scroll">
        <div className="seatmap-hall" role="group" aria-label="Saaliplaan">
          {rowNumbers.map((row) => {
            const label = rowLabel(row)
            return (
              <div key={row} className="seatmap-row">
                {/* Hidden from screen readers: every seat's own label already names the row. */}
                <span className="seatmap-row-label" aria-hidden="true">{label}</span>
                {seatNumbers.map((number) => {
                  const seat = byPosition.get(`${row}-${number}`)
                  if (!seat) {
                    return <span key={number} className="seat seat--empty" />
                  }

                  const taken = seat.state === 'Reserved' || seat.state === 'Sold'
                  const changed = changedSeatIds?.has(seat.seatId) ?? false
                  return (
                    <button
                      key={number}
                      type="button"
                      className={changed ? 'seat seat--changed' : 'seat'}
                      disabled={taken}
                      aria-label={`Rida ${label}, koht ${number}, ${STATE_TEXT[seat.state]}`}
                      onClick={() => onSeatClick(seat)}
                    >
                      <img src={seatImage(seat)} alt="" width={48} height={48} draggable={false} />
                    </button>
                  )
                })}
                <span className="seatmap-row-label" aria-hidden="true">{label}</span>
              </div>
            )
          })}

          <div className="seatmap-stage">
            <img src={stageSrc} alt="Lava" />
          </div>
        </div>
      </div>

      <ul className="seatmap-legend">
        {LEGEND.map(({ src, label }) => (
          <li key={label}>
            <img src={src} alt="" width={32} height={32} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
