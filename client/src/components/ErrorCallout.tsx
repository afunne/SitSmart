import { Callout } from '@radix-ui/themes'

/** Red alert box for an error message, e.g. a page that failed to load. */
export default function ErrorCallout({ message }: { message: string }) {
  return (
    <Callout.Root color="red" role="alert" mb="4">
      <Callout.Icon><i className="ti ti-alert-circle" aria-hidden="true" /></Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
    </Callout.Root>
  )
}
