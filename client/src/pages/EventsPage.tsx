import { Container, Heading, Section, Text } from '@radix-ui/themes'

// Placeholder: the event list comes in a later step.
export default function EventsPage() {
  return (
    <Container size="3" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="2">Üritused</Heading>
        <Text as="p" color="gray">Ürituste nimekiri tuleb siia.</Text>
      </Section>
    </Container>
  )
}
