import { Box, Button, Container, Flex, Link, Text } from '@radix-ui/themes'
import { NavLink, Outlet, Link as RouterLink, useNavigate } from 'react-router'
import type { Role } from '../api/types.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import './Layout.css'

interface NavItem {
  to: string
  label: string
  /** Roles that see the link; undefined = everyone, also logged-out visitors. */
  roles?: Role[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'Üritused' },
  { to: '/my-tickets', label: 'Minu piletid', roles: ['Buyer'] },
  { to: '/controller', label: 'Sissepääs', roles: ['Controller'] },
  { to: '/admin/halls', label: 'Saalid', roles: ['Admin'] },
  { to: '/admin/events', label: 'Üritused', roles: ['Admin'] },
  { to: '/admin/stats', label: 'Statistika', roles: ['Admin'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const visibleItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)))

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <Box asChild className="site-header">
        <header>
          <Container size="4" px="4">
            <Flex align="center" justify="between" gap="4" py="3" wrap="wrap">
              <Flex align="center" gap="5" wrap="wrap">
                <RouterLink to="/" className="logo-plate">
                  <span className="logo-crop">
                    <img src="/img/Sitsmart_logo.png" alt="SitSmart" />
                  </span>
                </RouterLink>

                <nav aria-label="Peamenüü">
                  <Flex asChild gap="4" wrap="wrap" m="0" p="0" style={{ listStyle: 'none' }}>
                    <ul>
                      {visibleItems.map(item => (
                        <li key={item.to}>
                          <Link asChild size="3" weight="medium" underline="hover">
                            <NavLink to={item.to} end={item.to === '/'} className="nav-link">
                              {item.label}
                            </NavLink>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Flex>
                </nav>
              </Flex>

              <Flex align="center" gap="3">
                {user ? (
                  <>
                    <Text size="2">{user.email}</Text>
                    <Button variant="outline" color="gray" highContrast onClick={handleLogout}>
                      Logi välja
                    </Button>
                  </>
                ) : (
                  <Button asChild>
                    <RouterLink to="/login">Logi sisse</RouterLink>
                  </Button>
                )}
              </Flex>
            </Flex>
          </Container>
        </header>
      </Box>

      <main>
        <Outlet />
      </main>
    </>
  )
}
