import { useState, type FormEvent } from 'react'
import { Box, Button, Callout, Card, Container, Flex, Heading, Section, Text, TextField } from '@radix-ui/themes'
import { useNavigate } from 'react-router'
import { ApiError } from '../api/client.ts'
import type { Role } from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'

const homeByRole: Partial<Record<Role, string>> = {
  Admin: '/admin/events',
  Controller: '/controller',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const user = await login(email.trim(), password)
      navigate(homeByRole[user.role] ?? '/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Vale e-post või parool')
      } else if (err instanceof ApiError) {
        setError('Sisselogimine ebaõnnestus. Proovi hiljem uuesti.')
      } else {
        setError('Serveriga ei saanud ühendust. Kontrolli internetiühendust ja proovi uuesti.')
      }
      setSubmitting(false)
    }
  }

  return (
    <Container size="1" px="4">
      <Section size="2">
        <Card size="4">
          <Heading as="h1" size="7" mb="5">Logi sisse</Heading>

          {error && (
            <Callout.Root color="red" role="alert" mb="4">
              <Callout.Icon><i className="ti ti-alert-circle" aria-hidden="true" /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="1">
                <Text as="label" htmlFor="login-email" size="2" weight="medium">E-post</Text>
                <TextField.Root
                  id="login-email"
                  type="email"
                  size="3"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </Flex>

              <Flex direction="column" gap="1">
                <Text as="label" htmlFor="login-password" size="2" weight="medium">Parool</Text>
                <TextField.Root
                  id="login-password"
                  type="password"
                  size="3"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
              </Flex>

              <Box mt="2">
                <Button type="submit" size="3" loading={submitting} style={{ width: '100%' }}>
                  Logi sisse
                </Button>
              </Box>
            </Flex>
          </form>
        </Card>
      </Section>
    </Container>
  )
}
