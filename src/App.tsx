import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterVolunteerPage } from './pages/RegisterVolunteerPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { EventsPage } from './pages/EventsPage';
import { UsersPage } from './pages/UsersPage';
import { AttendancePage } from './pages/AttendancePage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { RosterManagementPage } from './pages/RosterManagementPage';
import { RosterAssignmentsPage } from './pages/RosterAssignmentPage';
import { HallManagerPage } from './pages/HallManagerPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { KoinoniaPage } from './pages/KoinoniaPage';
import { KudSermonsPage } from './pages/KudSermonsPage';
import { GroupsPage } from './pages/GroupsPage';
import { SuggestionBoxPage } from './pages/SuggestionBoxPage';
import { ReportsPage } from './pages/ReportsPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { VolunteersPage } from './pages/VolunteersPage';
import { VolunteerDashboardPage } from './pages/VolunteerDashboardPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';
import { useVolunteerAuthStore } from './stores/volunteerAuthStore';
import { useEffect } from 'react';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const updateActivity = useAuthStore((state) => state.updateActivity);
  const checkInactivity = useAuthStore((state) => state.checkInactivity);
  const isVolunteerAuthenticated = useVolunteerAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const handleActivity = () => {
      updateActivity();
      checkInactivity();
    };

    // Check inactivity on mount and periodically
    checkInactivity();
    const interval = setInterval(checkInactivity, 60 * 1000); // Check every minute

    // Listen for user interactions
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [updateActivity, checkInactivity]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes (no auth required) ── */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route path="/register-volunteer" element={<RegisterVolunteerPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* ── Volunteer routes ── */}
        <Route
          path="/volunteer-dashboard"
          element={isVolunteerAuthenticated ? <VolunteerDashboardPage /> : <Navigate to="/login" replace />}
        />

        {/* ── Protected routes (authenticated users) ── */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route
            path="/dashboard"
            element={user?.role === 'Admin' ? <DashboardPage /> : <UserDashboardPage />}
          />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/koinonia" element={<KoinoniaPage />} />
          <Route path="/kud-sermons" element={<KudSermonsPage />} />
          <Route
            path="/users"
            element={<ProtectedRoute allowedRoles={['Admin']}><UsersPage /></ProtectedRoute>}
          />
          <Route
            path="/attendance"
            element={<ProtectedRoute allowedRoles={['Admin']}><AttendancePage /></ProtectedRoute>}
          />
          <Route
            path="/profile"
            element={<SettingsPage />}
          />
          <Route
            path="/activity-logs"
            element={<ProtectedRoute allowedRoles={['Admin']}><ActivityLogsPage /></ProtectedRoute>}
          />
          <Route
            path="/roster-management"
            element={<ProtectedRoute allowedRoles={['Admin']}><RosterManagementPage /></ProtectedRoute>}
          />
          <Route
            path="/roster/:id"
            element={<ProtectedRoute allowedRoles={['Admin']}><RosterAssignmentsPage /></ProtectedRoute>}
          />
          <Route
            path="/hall-manager"
            element={<ProtectedRoute allowedRoles={['Admin', 'Leader']}><HallManagerPage /></ProtectedRoute>}
          />
          <Route
            path="/groups"
            element={<ProtectedRoute allowedRoles={['Admin', 'Leader']}><GroupsPage /></ProtectedRoute>}
          />
          <Route path="/suggestion-box" element={<SuggestionBoxPage />} />
          <Route
            path="/reports"
            element={<ProtectedRoute allowedRoles={['Admin']}><ReportsPage /></ProtectedRoute>}
          />
          <Route
            path="/volunteers"
            element={<ProtectedRoute allowedRoles={['Admin']}><VolunteersPage /></ProtectedRoute>}
          />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;