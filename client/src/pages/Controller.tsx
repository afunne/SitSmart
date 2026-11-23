import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import { Button, Container, Flex, Heading, Section, Text, TextField } from '@radix-ui/themes'
import { ApiError, apiFetch, getErrorMessage } from '../api/client.ts'
import type { CheckInConflict, CheckInResultDto } from '../api/types.ts'
import ErrorCallout from '../components/ErrorCallout.tsx'
import { formatDateTime, rowLabel } from '../utils/format.ts'
import './Controller.css'

type CheckResult =
  | { kind: 'allowed'; ticket: CheckInResultDto }
  | { kind: 'used'; code: string; usedAt?: string }
  | { kind: 'unknown'; code: string }

/** html5-qrcode finds its container by id. */
const SCANNER_ID = 'checkin-qr-reader'

/** The camera sees the same QR code many times a second; ignore repeats for this long. */
const SAME_CODE_PAUSE_MS = 3000

export default function Controller() {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  // Refs: read synchronously by check() and the scanner callback, between renders.
  const busyRef = useRef(false)
  const scanningRef = useRef(false)
  const lastScanRef = useRef<{ code: string; at: number } | null>(null)

  const check = async (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase()
    if (!normalized || busyRef.current) return

    busyRef.current = true
    setChecking(true)
    setError(null)
    try {
      const ticket = await apiFetch<CheckInResultDto>(
        `/api/tickets/${encodeURIComponent(normalized)}/check-in`,
        { method: 'POST' },
      )
      setResult({ kind: 'allowed', ticket })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setResult({ kind: 'used', code: normalized, usedAt: (err.body as CheckInConflict | undefined)?.usedAt })
      } else if (err instanceof ApiError && err.status === 404) {
        setResult({ kind: 'unknown', code: normalized })
      } else {
        setResult(null)
        setError(getErrorMessage(err))
      }
    } finally {
      busyRef.current = false
      setChecking(false)
      // Ready for the next ticket. Not while the camera is on: on a phone, focusing the field
      // would open the keyboard over the camera view.
      setCode('')
      if (!scanningRef.current) inputRef.current?.focus()
    }
  }

  // Called from the scanner, which keeps the callback it was started with.
  const onScan = useEffectEvent((text: string) => {
    const scanned = text.trim().toUpperCase()
    const last = lastScanRef.current
    const now = Date.now()
    if (busyRef.current || (last && last.code === scanned && now - last.at < SAME_CODE_PAUSE_MS)) return
    lastScanRef.current = { code: scanned, at: now }
    void check(scanned)
  })

  useEffect(() => {
    scanningRef.current = scanning
    if (!scanning) return

    let cancelled = false
    let scanner: import('html5-qrcode').Html5Qrcode | null = null

    // Loaded only when needed: the library is large and most visits never open the camera.
    const started = import('html5-qrcode')
      .then(async ({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
        if (cancelled) return
        scanner = new Html5Qrcode(SCANNER_ID, {
          verbose: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        })
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: (width, height) => {
            const side = Math.floor(Math.min(width, height) * 0.7)
            return { width: side, height: side }
          } },
          (decodedText) => onScan(decodedText),
          undefined,
        )
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setScanError(cameraErrorMessage(err))
        setScanning(false)
      })

    return () => {
      cancelled = true
      // start() may still be running; stop once it has settled.
      void started.finally(() => {
        if (scanner?.isScanning) {
          scanner.stop().then(() => scanner?.clear()).catch(() => {})
        }
      })
    }
  }, [scanning])

  const toggleScanning = () => {
    setScanError(null)
    if (scanning) {
      setScanning(false)
      inputRef.current?.focus()
      return
    }
    if (!window.isSecureContext || !navigator.mediaDevices) {
      setScanError('Kaamera töötab ainult turvalise (HTTPS) ühendusega lehel.')
      return
    }
    lastScanRef.current = null
    setScanning(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      inputRef.current?.focus()
      return
    }
    void check(code)
  }

  return (
    <Container size="1" px="4">
      <Section size="1">
        <Heading as="h1" size="7" mb="4">Piletikontroll</Heading>

        <form onSubmit={handleSubmit} className="checkin-form">
          <Flex gap="2">
            <TextField.Root
              ref={inputRef}
              size="3"
              className="checkin-code"
              aria-label="Pileti kood"
              placeholder="Pileti kood"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="go"
            />
            <Button type="submit" size="3" loading={checking}>Kontrolli</Button>
          </Flex>
        </form>

        <Button
          type="button"
          size="3"
          variant="soft"
          className="checkin-scan-button"
          aria-pressed={scanning}
          onClick={toggleScanning}
        >
          <i className={`ti ${scanning ? 'ti-camera-off' : 'ti-camera'}`} aria-hidden="true" />
          {scanning ? 'Lõpeta skaneerimine' : 'Skaneeri'}
        </Button>

        {scanError && <ErrorCallout message={scanError} />}
        {scanning && <div id={SCANNER_ID} className="checkin-scanner" />}

        {error && <ErrorCallout message={error} />}

        {/* Always rendered, so screen readers announce each new result in it. */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {result && <ResultCard result={result} />}
        </div>
      </Section>
    </Container>
  )
}

function ResultCard({ result }: { result: CheckResult }) {
  switch (result.kind) {
    case 'allowed':
      return (
        <div className="checkin-result checkin-result--allowed">
          <p className="checkin-result-title">
            <i className="ti ti-circle-check" aria-hidden="true" /> Lubatud
          </p>
          <Text as="p" size="5" weight="bold">{result.ticket.eventName}</Text>
          <Text as="p" size="5" className="tabular">
            Rida {rowLabel(result.ticket.row)}, koht {result.ticket.number}
          </Text>
          <Text as="p" size="2" className="checkin-result-code">{result.ticket.code}</Text>
        </div>
      )
    case 'used':
      return (
        <div className="checkin-result checkin-result--used">
          <p className="checkin-result-title">
            <i className="ti ti-circle-x" aria-hidden="true" /> Juba kasutatud
          </p>
          {result.usedAt && (
            <Text as="p" size="5" className="tabular">Kasutati {formatDateTime(result.usedAt)}</Text>
          )}
          <Text as="p" size="2" className="checkin-result-code">{result.code}</Text>
        </div>
      )
    case 'unknown':
      return (
        <div className="checkin-result checkin-result--unknown">
          <p className="checkin-result-title">
            <i className="ti ti-help-circle" aria-hidden="true" /> Tundmatu pilet
          </p>
          <Text as="p" size="2" className="checkin-result-code">{result.code}</Text>
        </div>
      )
  }
}

/** html5-qrcode rejects with a DOMException or a plain string, depending on where it failed. */
function cameraErrorMessage(err: unknown): string {
  const text = err instanceof Error ? `${err.name} ${err.message}` : String(err)
  if (/NotAllowed|Permission/i.test(text)) {
    return 'Kaamera kasutamiseks luba brauseris ligipääs kaamerale.'
  }
  if (/NotFound|Overconstrained|no camera/i.test(text)) {
    return 'Kaamerat ei leitud.'
  }
  return 'Kaamerat ei õnnestunud käivitada.'
}
