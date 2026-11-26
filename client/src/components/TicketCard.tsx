import { useEffect, useState } from 'react'
import { Card, Flex, Skeleton, Spinner } from '@radix-ui/themes'
import { apiFetchBlob } from '../api/client.ts'
import type { TicketDto } from '../api/types.ts'
import { formatDateTime, formatPrice, rowLabel } from '../utils/format.ts'
import '../styles/ticket.css'

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
        <img src={src} alt={`QR-kood, pilet ${code}`} width={174} height={174} />
      ) : failed ? (
        <span className="ticket-qr-error">QR-koodi ei õnnestunud laadida.</span>
      ) : (
        <Spinner aria-label="Laen QR-koodi" />
      )}
    </div>
  )
}

/** A printable ticket: event info, a perforated edge, and the QR stub with the code. */
export default function TicketCard({ ticket }: { ticket: TicketDto }) {
  const used = ticket.usedAt !== null
  return (
    <article className={used ? 'ticket ticket--used' : 'ticket'}>
      <div className="ticket-body">
        <div className="ticket-info">
          <span className="ticket-logo">
            <img src="/img/Sitsmart_logo.png" alt="SitSmart" />
          </span>
          <h2 className="ticket-title">{ticket.eventName}</h2>
          <span className="ticket-when tabular">{formatDateTime(ticket.startsAt)}</span>
          <dl className="ticket-details">
            <div>
              <dt>Saal</dt>
              <dd>{ticket.hallName}</dd>
            </div>
            <div>
              <dt>Rida</dt>
              <dd>{rowLabel(ticket.row)}</dd>
            </div>
            <div>
              <dt>Koht</dt>
              <dd className="tabular">{ticket.number}</dd>
            </div>
            <div>
              <dt>Hind</dt>
              <dd className="tabular">{formatPrice(ticket.price)}</dd>
            </div>
          </dl>
          {used && <span className="ticket-stamp">KASUTATUD</span>}
        </div>

        <div className="ticket-stub">
          <TicketQr code={ticket.code} />
          <span className="ticket-code">{ticket.code}</span>
        </div>
      </div>
    </article>
  )
}

/** Placeholder with the same shape as TicketCard, shown while the list loads. */
export function TicketCardSkeleton() {
  return (
    <Card size="3">
      <Flex gap="4" justify="between" wrap="wrap">
        <Flex direction="column" gap="3" flexGrow="1">
          <Skeleton width="126px" height="41px" />
          <Skeleton width="70%" height="26px" />
          <Skeleton width="45%" height="16px" />
          <Skeleton width="80%" height="40px" />
        </Flex>
        <Skeleton width="174px" height="174px" />
      </Flex>
    </Card>
  )
}
