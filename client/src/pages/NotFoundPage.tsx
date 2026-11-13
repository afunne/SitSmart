import { Container, Heading, Link, Section, Text } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router'

export default function NotFoundPage() {
  return (
    <Container size="3" px="4">
      <Section size="2">
        <Heading as="h1" size="8" mb="2">Lehte ei leitud</Heading>
        <Text as="p">
          Seda lehte ei ole olemas. <Link asChild><RouterLink to="/">Tagasi üritustele</RouterLink></Link>
        </Text>
      </Section>
    </Container>
  )
}
