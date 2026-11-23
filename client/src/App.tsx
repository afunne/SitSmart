import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { AuthProvider } from './auth/AuthContext.tsx'
import RequireRole from './auth/RequireRole.tsx'
import Layout from './components/Layout.tsx'
import AdminEvents from './pages/admin/AdminEvents.tsx'
import AdminHalls from './pages/admin/AdminHalls.tsx'
import Controller from './pages/Controller.tsx'
import EventDetail from './pages/EventDetail.tsx'
import Events from './pages/Events.tsx'
import Login from './pages/Login.tsx'
import MyTickets from './pages/MyTickets.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import Styleguide from './pages/Styleguide.tsx'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Events /> },
      { path: 'events/:id', element: <EventDetail /> },
      {
        path: 'my-tickets',
        element: (
          <RequireRole roles={['Buyer']}>
            <MyTickets />
          </RequireRole>
        ),
      },
      {
        path: 'controller',
        element: (
          <RequireRole roles={['Controller']}>
            <Controller />
          </RequireRole>
        ),
      },
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
      {
        path: 'admin/events',
        element: (
          <RequireRole roles={['Admin']}>
            <AdminEvents />
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
