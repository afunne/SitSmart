import { useEffect, useState, type FormEvent } from 'react'
import {
  AlertDialog,
  Button,
  Callout,
  Container,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Section,
  Spinner,
  Table,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes'
import { ApiError, apiFetch } from '../../api/client.ts'
import type { CreateHallRequest, HallDto, UpdateHallRequest } from '../../api/types.ts'

// Same limits as HallService in the API.
const MAX_NAME_LENGTH = 100
const MAX_ROWS = 50
const MAX_SEATS_PER_ROW = 50

type ErrorHandler = (message: string | null) => void

/** API errors carry the server's Estonian message; anything else is a network problem. */
function errorMessage(err: unknown): string {
  return err instanceof ApiError
    ? err.message
    : 'Serveriga ei saanud ühendust. Kontrolli internetiühendust ja proovi uuesti.'
}

const byName = (a: HallDto, b: HallDto) => a.name.localeCompare(b.name, 'et')

export default function AdminHalls() {
  const [halls, setHalls] = useState<HallDto[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Error from renaming or deleting, shown above the table. */
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetch<HallDto[]>('/api/halls')
      .then(data => { if (!cancelled) setHalls(data) })
      .catch(err => { if (!cancelled) setLoadError(errorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  const handleCreated = (hall: HallDto) => {
    setError(null)
    setHalls(prev => [...(prev ?? []), hall].sort(byName))
  }

  const handleRenamed = (hall: HallDto) => {
    setHalls(prev => (prev ?? []).map(h => (h.id === hall.id ? hall : h)).sort(byName))
  }

  const handleDeleted = (id: number) => {
    setHalls(prev => (prev ?? []).filter(h => h.id !== id))
  }

  return (
    <Container size="3" px="4">
      <Section size="2">
        <Flex align="center" justify="between" gap="3" wrap="wrap" mb="5">
          <Heading as="h1" size="8">Saalid</Heading>
          <CreateHallDialog onCreated={handleCreated} />
        </Flex>

        {error && <ErrorCallout message={error} />}

        {loadError ? (
          <ErrorCallout message={loadError} />
        ) : halls === null ? (
          <Flex align="center" gap="2">
            <Spinner />
            <Text color="gray">Laen saale…</Text>
          </Flex>
        ) : halls.length === 0 ? (
          <Text as="p" color="gray">Saale veel pole. Lisa esimene saal nupuga „Lisa saal“.</Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                {/* Fixed share, so the columns don't jump when a row switches to the rename field. */}
                <Table.ColumnHeaderCell width="40%">Nimi</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Ridu</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Kohti reas</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Kohti kokku</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Tegevused</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {halls.map(hall => (
                <HallRow
                  key={hall.id}
                  hall={hall}
                  onRenamed={handleRenamed}
                  onDeleted={handleDeleted}
                  onError={setError}
                />
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Section>
    </Container>
  )
}

function ErrorCallout({ message }: { message: string }) {
  return (
    <Callout.Root color="red" role="alert" mb="4">
      <Callout.Icon><i className="ti ti-alert-circle" aria-hidden="true" /></Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  )
}

interface HallRowProps {
  hall: HallDto
  onRenamed: (hall: HallDto) => void
  onDeleted: (id: number) => void
  onError: ErrorHandler
}

/** One table row; the name turns into a text field while renaming. */
function HallRow({ hall, onRenamed, onDeleted, onError }: HallRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(hall.name)
  const [saving, setSaving] = useState(false)

  const startEditing = () => {
    onError(null)
    setName(hall.name)
    setEditing(true)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === hall.name) {
      setEditing(false)
      return
    }

    onError(null)
    setSaving(true)
    try {
      const body: UpdateHallRequest = { name: trimmed }
      onRenamed(await apiFetch<HallDto>(`/api/halls/${hall.id}`, { method: 'PUT', body }))
      setEditing(false)
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Table.Row align="center">
      <Table.RowHeaderCell>
        {editing ? (
          <form onSubmit={handleSave}>
            <Flex align="center" gap="2">
              <TextField.Root
                aria-label="Saali nimi"
                value={name}
                onChange={event => setName(event.target.value)}
                onKeyDown={event => { if (event.key === 'Escape') setEditing(false) }}
                maxLength={MAX_NAME_LENGTH}
                required
                autoFocus
                disabled={saving}
                style={{ minWidth: '12rem' }}
              />
              <Tooltip content="Salvesta">
                <IconButton type="submit" aria-label="Salvesta" loading={saving}>
                  <i className="ti ti-check" aria-hidden="true" />
                </IconButton>
              </Tooltip>
              <Tooltip content="Loobu">
                <IconButton
                  type="button"
                  variant="soft"
                  color="gray"
                  aria-label="Loobu"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </IconButton>
              </Tooltip>
            </Flex>
          </form>
        ) : (
          hall.name
        )}
      </Table.RowHeaderCell>
      <Table.Cell justify="end" className="tabular">{hall.rows}</Table.Cell>
      <Table.Cell justify="end" className="tabular">{hall.seatsPerRow}</Table.Cell>
      <Table.Cell justify="end" className="tabular">{hall.seatCount}</Table.Cell>
      <Table.Cell justify="end">
        <Flex gap="2" justify="end">
          <Tooltip content="Nimeta ümber">
            <IconButton
              variant="soft"
              color="gray"
              aria-label={`Nimeta ümber: ${hall.name}`}
              disabled={editing}
              onClick={startEditing}
            >
              <i className="ti ti-pencil" aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <DeleteHallDialog hall={hall} onDeleted={onDeleted} onError={onError} />
        </Flex>
      </Table.Cell>
    </Table.Row>
  )
}

interface DeleteHallDialogProps {
  hall: HallDto
  onDeleted: (id: number) => void
  onError: ErrorHandler
}

/** Trash button + confirmation. A 409 (hall has events) is shown above the table. */
function DeleteHallDialog({ hall, onDeleted, onError }: DeleteHallDialogProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    onError(null)
    setDeleting(true)
    try {
      await apiFetch<void>(`/api/halls/${hall.id}`, { method: 'DELETE' })
      setOpen(false)
      onDeleted(hall.id)
    } catch (err) {
      setOpen(false)
      onError(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={next => { if (!deleting) setOpen(next) }}>
      <Tooltip content="Kustuta">
        <AlertDialog.Trigger>
          <IconButton variant="soft" color="red" aria-label={`Kustuta: ${hall.name}`}>
            <i className="ti ti-trash" aria-hidden="true" />
          </IconButton>
        </AlertDialog.Trigger>
      </Tooltip>

      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Kustuta saal</AlertDialog.Title>
        <AlertDialog.Description size="2">
          Kas kustutada saal „{hall.name}“ koos kõigi selle {hall.seatCount} kohaga? Seda ei saa tagasi võtta.
        </AlertDialog.Description>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={deleting}>Loobu</Button>
          </AlertDialog.Cancel>
          {/* A plain Button, not AlertDialog.Action, so the dialog stays open while deleting. */}
          <Button color="red" loading={deleting} onClick={handleDelete}>Kustuta</Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  )
}

/** "Lisa saal" button + form dialog. Validation errors (400) are shown inside the dialog. */
function CreateHallDialog({ onCreated }: { onCreated: (hall: HallDto) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rows, setRows] = useState('')
  const [seatsPerRow, setSeatsPerRow] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const total = Number(rows) * Number(seatsPerRow)

  const handleOpenChange = (next: boolean) => {
    if (saving) return
    if (next) {
      setName('')
      setRows('')
      setSeatsPerRow('')
      setError(null)
    }
    setOpen(next)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const body: CreateHallRequest = {
        name: name.trim(),
        rows: Number(rows),
        seatsPerRow: Number(seatsPerRow),
      }
      onCreated(await apiFetch<HallDto>('/api/halls', { method: 'POST', body }))
      setOpen(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger>
        <Button>
          <i className="ti ti-plus" aria-hidden="true" /> Lisa saal
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Lisa saal</Dialog.Title>
        <Dialog.Description size="2" mb="4" color="gray">
          Kohad luuakse automaatselt ridade ja kohtade arvu järgi. Hiljem saab muuta ainult nime.
        </Dialog.Description>

        {error && <ErrorCallout message={error} />}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Text as="label" htmlFor="hall-name" size="2" weight="medium">Nimi</Text>
              <TextField.Root
                id="hall-name"
                value={name}
                onChange={event => setName(event.target.value)}
                maxLength={MAX_NAME_LENGTH}
                required
                autoFocus
              />
            </Flex>

            <Flex gap="3">
              <Flex direction="column" gap="1" flexGrow="1">
                <Text as="label" htmlFor="hall-rows" size="2" weight="medium">Ridu</Text>
                <TextField.Root
                  id="hall-rows"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_ROWS}
                  step={1}
                  value={rows}
                  onChange={event => setRows(event.target.value)}
                  required
                />
              </Flex>
              <Flex direction="column" gap="1" flexGrow="1">
                <Text as="label" htmlFor="hall-seats-per-row" size="2" weight="medium">Kohti reas</Text>
                <TextField.Root
                  id="hall-seats-per-row"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_SEATS_PER_ROW}
                  step={1}
                  value={seatsPerRow}
                  onChange={event => setSeatsPerRow(event.target.value)}
                  required
                />
              </Flex>
            </Flex>

            <Text size="2" color="gray" className="tabular">
              {total > 0 ? `Kokku ${total} kohta` : `Kuni ${MAX_ROWS} rida ja ${MAX_SEATS_PER_ROW} kohta reas`}
            </Text>

            <Flex gap="3" justify="end">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray" disabled={saving}>Loobu</Button>
              </Dialog.Close>
              <Button type="submit" loading={saving}>Lisa saal</Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
