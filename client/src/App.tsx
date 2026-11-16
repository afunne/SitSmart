import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './auth/AuthContext.tsx'
import RequireRole from './auth/RequireRole.tsx'
import Layout from './components/Layout.tsx'
import AdminHalls from './pages/admin/AdminHalls.tsx'
import EventsPage from './pages/EventsPage.tsx'
import Login from './pages/Login.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import Styleguide from './pages/Styleguide.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <EventsPage /> },
      { path: 'login', element: <Login /> },
      { path: 'styleguide', element: <Styleguide /> },
      {
        path: 'admin/halls',
        element: (
          <RequireRole roles={['Admin']}>
            <AdminHalls />
          </RequireRole>
        ),
      },
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
