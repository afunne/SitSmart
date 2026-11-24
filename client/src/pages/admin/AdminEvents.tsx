import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  AlertDialog,
  Badge,
  Button,
  Container,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Link,
  Section,
  Select,
  Spinner,
  Table,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router'
import { toast } from 'sonner'
import { apiFetch } from '../../api/client.ts'
import { errorMessage } from '../../api/errorMessage.ts'
import type { CreateEventRequest, EventDto, HallDto } from '../../api/types.ts'
import ErrorCallout from '../../components/ErrorCallout.tsx'
import { formatDateTime, formatPrice, fromDateTimeLocal, toDateTimeLocal } from '../../utils/format.ts'

// Same limits as EventService in the API.
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 1000
const MAX_IMAGE_URL_LENGTH = 500

/** null = closed; event null = adding a new event. */
type FormState = { event: EventDto | null } | null

export default function AdminEvents() {
  const [events, setEvents] = useState<EventDto[] | null>(null)
  /** When the list was loaded; "past" is decided against this, not the clock during render. */
  const [loadedAt, setLoadedAt] = useState(0)
  const [halls, setHalls] = useState<HallDto[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(null)

  // The API decides the order (upcoming first), so reload the list after every change.
  const loadEvents = useCallback(async () => {
    setEvents(await apiFetch<EventDto[]>('/api/events'))
    setLoadedAt(Date.now())
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([apiFetch<EventDto[]>('/api/events'), apiFetch<HallDto[]>('/api/halls')])
      .then(([eventData, hallData]) => {
        if (cancelled) return
        setEvents(eventData)
        setLoadedAt(Date.now())
        setHalls(hallData)
      })
      .catch(err => { if (!cancelled) setLoadError(errorMessage(err)) })
    return () => { cancelled = true }
  }, [])

  const handleSaved = async () => {
    setForm(null)
    try {
      await loadEvents()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleDeleted = (id: number) => {
    setEvents(prev => (prev ?? []).filter(e => e.id !== id))
  }

  return (
    <Container size="4" px="4">
      <Section size="2">
        <Flex align="center" justify="between" gap="3" wrap="wrap" mb="5">
          <Heading as="h1" size="8">Üritused</Heading>
          <Button disabled={events === null} onClick={() => setForm({ event: null })}>
            <i className="ti ti-plus" aria-hidden="true" /> Lisa üritus
          </Button>
        </Flex>

        {loadError ? (
          <ErrorCallout message={loadError} />
        ) : events === null ? (
          <Flex align="center" gap="2">
            <Spinner />
            <Text color="gray">Laen üritusi…</Text>
          </Flex>
        ) : events.length === 0 ? (
          <Text as="p" color="gray">Üritusi veel pole. Lisa esimene üritus nupuga „Lisa üritus“.</Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Nimi</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Algus</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Saal</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Hind</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Kohti</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell justify="end">Tegevused</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {events.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  isPast={Date.parse(event.startsAt) <= loadedAt}
                  onEdit={() => setForm({ event })}
                  onDeleted={handleDeleted}
                />
              ))}
            </Table.Body>
          </Table.Root>
        )}

        <Dialog.Root open={form !== null} onOpenChange={open => { if (!open) setForm(null) }}>
          {form && <EventForm event={form.event} halls={halls} onSaved={handleSaved} />}
        </Dialog.Root>
      </Section>
    </Container>
  )
}

interface EventRowProps {
  event: EventDto
  /** Already started; shown greyed out with a "Toimunud" badge. */
  isPast: boolean
  onEdit: () => void
  onDeleted: (id: number) => void
}

function EventRow({ event, isPast, onEdit, onDeleted }: EventRowProps) {
  return (
    <Table.Row align="center">
      <Table.RowHeaderCell>
        <Flex align="center" gap="2" wrap="wrap">
          <Text color={isPast ? 'gray' : undefined}>{event.name}</Text>
          {isPast && <Badge color="gray">Toimunud</Badge>}
        </Flex>
      </Table.RowHeaderCell>
      <Table.Cell className="tabular">{formatDateTime(event.startsAt)}</Table.Cell>
      <Table.Cell>{event.hallName}</Table.Cell>
      <Table.Cell justify="end" className="tabular">{formatPrice(event.price)}</Table.Cell>
      <Table.Cell justify="end" className="tabular">{event.totalSeats}</Table.Cell>
      <Table.Cell justify="end">
        <Flex gap="2" justify="end">
          <Tooltip content="Muuda">
            <IconButton variant="soft" color="gray" aria-label={`Muuda: ${event.name}`} onClick={onEdit}>
              <i className="ti ti-pencil" aria-hidden="true" />
            </IconButton>
          </Tooltip>
          <DeleteEventDialog event={event} onDeleted={onDeleted} />
        </Flex>
      </Table.Cell>
    </Table.Row>
  )
}

interface DeleteEventDialogProps {
  event: EventDto
  onDeleted: (id: number) => void
}

/** Trash button + confirmation. A 409 (tickets sold) is shown as a toast with the API's message. */
function DeleteEventDialog({ event, onDeleted }: DeleteEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiFetch<void>(`/api/events/${event.id}`, { method: 'DELETE' })
      setOpen(false)
      onDeleted(event.id)
      toast.success('Üritus kustutatud')
    } catch (err) {
      setOpen(false)
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={next => { if (!deleting) setOpen(next) }}>
      <Tooltip content="Kustuta">
        <AlertDialog.Trigger>
          <IconButton variant="soft" color="red" aria-label={`Kustuta: ${event.name}`}>
            <i className="ti ti-trash" aria-hidden="true" />
          </IconButton>
        </AlertDialog.Trigger>
      </Tooltip>

      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Kustuta üritus</AlertDialog.Title>
        <AlertDialog.Description size="2">
          Kas kustutada üritus „{event.name}“ ({formatDateTime(event.startsAt)})? Seda ei saa tagasi võtta.
          Üritust, millele on pileteid müüdud, kustutada ei saa.
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

interface EventFormProps {
  /** null = new event. */
  event: EventDto | null
  halls: HallDto[]
  onSaved: () => void
}

/**
 * Dialog content with the add/edit form. It is mounted only while the dialog is open,
 * so the fields start from `event` every time. Errors (400/409) are shown as toasts; the dialog stays open.
 */
function EventForm({ event, halls, onSaved }: EventFormProps) {
  const isEdit = event !== null
  const initialStartsAt = event ? toDateTimeLocal(event.startsAt) : ''

  const [name, setName] = useState(event?.name ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? '')
  const [startsAt, setStartsAt] = useState(initialStartsAt)
  const [hallId, setHallId] = useState(event ? String(event.hallId) : halls.length === 1 ? String(halls[0].id) : '')
  const [price, setPrice] = useState(event ? String(event.price) : '')
  const [saving, setSaving] = useState(false)
  // Browser-side hint only; the API checks the time as well.
  const [minStartsAt] = useState(() => toDateTimeLocal(new Date().toISOString()))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!hallId) {
      toast.error('Vali saal.')
      return
    }

    setSaving(true)
    try {
      const body: CreateEventRequest = {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
        // The input only has minutes. If the time wasn't touched, send the original value,
        // so editing e.g. the description doesn't move the start by a few seconds (the API
        // would then also require the time to be in the future again).
        startsAt: event && startsAt === initialStartsAt ? event.startsAt : fromDateTimeLocal(startsAt),
        hallId: Number(hallId),
        price: Number(price),
      }

      await apiFetch<EventDto>(isEdit ? `/api/events/${event.id}` : '/api/events', {
        method: isEdit ? 'PUT' : 'POST',
        body,
      })
      toast.success(isEdit ? 'Muudatused salvestatud' : 'Üritus lisatud')
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err))
      setSaving(false)
    }
  }

  // Keep the dialog open while saving.
  const preventCloseWhileSaving = (e: Event) => { if (saving) e.preventDefault() }

  return (
    <Dialog.Content
      maxWidth="560px"
      onEscapeKeyDown={preventCloseWhileSaving}
      onPointerDownOutside={preventCloseWhileSaving}
    >
      <Dialog.Title>{isEdit ? 'Muuda üritust' : 'Lisa üritus'}</Dialog.Title>
      <Dialog.Description size="2" mb="4" color="gray">
        {isEdit
          ? 'Saali saab vahetada ainult siis, kui üritusele pole veel kohti müüdud ega broneeritud.'
          : 'Algusaeg peab olema tulevikus.'}
      </Dialog.Description>

      {halls.length === 0 ? (
        <Text as="p" size="2">
          Saale pole veel lisatud. <Link asChild><RouterLink to="/admin/halls">Lisa enne saal</RouterLink></Link>.
        </Text>
      ) : (
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Field label="Nimi" htmlFor="event-name">
              <TextField.Root
                id="event-name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                required
                autoFocus
              />
            </Field>

            <Field label="Kirjeldus" htmlFor="event-description">
              <TextArea
                id="event-description"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
            </Field>

            <Field label="Pildi URL (valikuline)" htmlFor="event-image-url">
              <TextField.Root
                id="event-image-url"
                type="url"
                placeholder="https://…"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                maxLength={MAX_IMAGE_URL_LENGTH}
              />
            </Field>

            <Flex gap="3" wrap="wrap">
              <Field label="Algus" htmlFor="event-starts-at" grow>
                <TextField.Root
                  id="event-starts-at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  // No min when editing: an event that has already started must stay editable.
                  min={isEdit ? undefined : minStartsAt}
                  required
                />
              </Field>

              <Field label="Hind (€)" htmlFor="event-price" grow>
                <TextField.Root
                  id="event-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                />
              </Field>
            </Flex>

            <Field label="Saal" htmlFor="event-hall">
              <Select.Root value={hallId} onValueChange={setHallId} required>
                <Select.Trigger id="event-hall" placeholder="Vali saal" />
                <Select.Content>
                  {halls.map(hall => (
                    <Select.Item key={hall.id} value={String(hall.id)}>
                      {hall.name} ({hall.seatCount} kohta)
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Field>

            <Flex gap="3" justify="end" mt="2">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray" disabled={saving}>Loobu</Button>
              </Dialog.Close>
              <Button type="submit" loading={saving}>{isEdit ? 'Salvesta' : 'Lisa üritus'}</Button>
            </Flex>
          </Flex>
        </form>
      )}
    </Dialog.Content>
  )
}

interface FieldProps {
  label: string
  htmlFor: string
  /** Share the row with other fields. */
  grow?: boolean
  children: ReactNode
}

function Field({ label, htmlFor, grow, children }: FieldProps) {
  return (
    <Flex direction="column" gap="1" flexGrow={grow ? '1' : undefined}>
      <Text as="label" htmlFor={htmlFor} size="2" weight="medium">{label}</Text>
      {children}
    </Flex>
  )
}
