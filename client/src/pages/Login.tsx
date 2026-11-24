import { useState, type FormEvent } from 'react'
import { Box, Button, Card, Container, Flex, Heading, Section, Text, TextField } from '@radix-ui/themes'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '../api/client.ts'
import { errorMessage } from '../api/errorMessage.ts'
import type { Role } from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'

const homeByRole: Partial<Record<Role, string>> = {
  Admin: '/admin/events',
  Controller: '/controller',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const user = await login(email.trim(), password)
      // Back to the page that sent us here (RequireRole, seat map), otherwise the role's home.
      const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from
      navigate(from ? from.pathname + from.search : (homeByRole[user.role] ?? '/'), { replace: true })
    } catch (err) {
      // Login sends no token, so a 401 here means wrong credentials, not an expired session.
      toast.error(err instanceof ApiError && err.status === 401 ? 'Vale e-post või parool' : errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Container size="1" px="4">
      <Section size="2">
        <Card size="4">
          <Heading as="h1" size="7" mb="5">Logi sisse</Heading>

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
