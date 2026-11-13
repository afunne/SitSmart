import { Container, Heading, Section, Text } from '@radix-ui/themes'

// Placeholder: the login form comes in a later step (use useAuth().login()).
export default function LoginPage() {
  return (
    <Container size="1" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="2">Logi sisse</Heading>
        <Text as="p" color="gray">Sisselogimise vorm tuleb siia.</Text>
      </Section>
    </Container>
  )
}
