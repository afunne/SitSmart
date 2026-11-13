import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './auth/AuthContext.tsx'
import Layout from './components/Layout.tsx'
import EventsPage from './pages/EventsPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import Styleguide from './pages/Styleguide.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <EventsPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'styleguide', element: <Styleguide /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
