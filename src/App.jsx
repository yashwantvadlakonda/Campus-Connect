import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import Login from './pages/Auth/Login'
import SignUp from './pages/Auth/SignUp'
import LandingPage from './pages/Landing/LandingPage'
import Dashboard from './pages/Dashboard/Dashboard'
import Events from './pages/Events/Events'
import TeamFinder from './pages/TeamFinder/TeamFinder'
import Matches from './pages/Matches/Matches'
import Chat from './pages/Chat/Chat'
import Profile from './pages/Profile/Profile'
import MyRegistrations from './pages/MyRegistrations/MyRegistrations'
import Notifications from './pages/Notifications/Notifications'
import Networking from './pages/Networking/Networking'

// Admin Pages
import AdminLogin from './pages/Admin/Login'
import { AdminRouteGuard } from './components/auth/AdminRouteGuard'
import { AdminLayout } from './components/layout/AdminLayout'
import AdminDashboard from './pages/Admin/Dashboard'
import AdminProgramsList from './pages/Admin/ProgramsList'
import AdminRegistrations from './pages/Admin/Registrations'
import AdminAnnouncements from './pages/Admin/Announcements'
import AdminUsersList from './pages/Admin/UsersList'
import AdminAnalytics from './pages/Admin/Analytics'
import AdminFaculty from './pages/Admin/Faculty'
import AdminActivityLog from './pages/Admin/ActivityLog'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/hackathons" element={<Events filterType="hackathon" />} />
              <Route path="/team-finder" element={<TeamFinder />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/chat/:matchId" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-registrations" element={<MyRegistrations />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/networking" element={<Networking />} />
            </Route>
          </Route>

          {/* Admin Protected Routes with AdminRouteGuard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route element={<AdminRouteGuard />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/hackathons" element={<AdminProgramsList type="hackathon" />} />
              <Route path="/admin/events" element={<AdminProgramsList type="event" />} />
              <Route path="/admin/registrations" element={<AdminRegistrations />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/users" element={<AdminUsersList />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/faculty" element={<AdminFaculty />} />
              <Route path="/admin/activity" element={<AdminActivityLog />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
