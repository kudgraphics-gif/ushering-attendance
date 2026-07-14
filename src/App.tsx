import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterVolunteerPage } from './pages/RegisterVolunteerPage';
import { VolunteerOnboardPage } from './pages/VolunteerOnboardPage';
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
import { VolunteerEventsPage } from './pages/VolunteerEventsPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, SharedProtectedRoute } from './components/ProtectedRoute';
import { VolunteerSuccessPage } from './pages/VolunteerSuccessPage';
import { useAuthStore } from './stores/authStore';
import { useVolunteerAuthStore } from './stores/volunteerAuthStore';
import { useEffect } from 'react';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isVolunteerAuthenticated = useVolunteerAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isAdminView = useAuthStore((state) => state.isAdminView);
  const updateActivity = useAuthStore((state) => state.updateActivity);
  const checkInactivity = useAuthStore((state) => state.checkInactivity);
  const accentColor = useAuthStore((state) => state.accentColor);

  useEffect(() => {
    const accentPalettes = {
      gold: {
        primary: '#D4AF37',
        secondary: 'rgba(212, 175, 55, 0.15)',
        glow: 'rgba(212, 175, 55, 0.3)',
        gradient: 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)'
      },
      blue: {
        primary: '#0A84FF',
        secondary: 'rgba(10, 132, 255, 0.15)',
        glow: 'rgba(10, 132, 255, 0.3)',
        gradient: 'linear-gradient(135deg, #0A84FF 0%, #0070E0 100%)'
      },
      green: {
        primary: '#34C759',
        secondary: 'rgba(52, 199, 89, 0.15)',
        glow: 'rgba(52, 199, 89, 0.3)',
        gradient: 'linear-gradient(135deg, #34C759 0%, #30B452 100%)'
      },
      purple: {
        primary: '#AF52DE',
        secondary: 'rgba(175, 82, 222, 0.15)',
        glow: 'rgba(175, 82, 222, 0.3)',
        gradient: 'linear-gradient(135deg, #AF52DE 0%, #963EBD 100%)'
      }
    };

    const colors = accentPalettes[accentColor as keyof typeof accentPalettes] || accentPalettes.gold;
    const root = document.documentElement;

    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-brand-gold', colors.primary);
    root.style.setProperty('--color-accent-blue', colors.primary);
    root.style.setProperty('--color-accent-purple', colors.primary);
    root.style.setProperty('--gradient-primary', colors.gradient);
    root.style.setProperty('--gradient-gold', colors.gradient);
    root.style.setProperty('--glow-gold', colors.glow);
    root.style.setProperty('--glow-blue', colors.glow);
    root.style.setProperty('--glow-purple', colors.glow);
    root.style.setProperty('--accent-primary', colors.primary);
    root.style.setProperty('--accent-secondary', colors.secondary);
    root.style.setProperty('--accent-glow', colors.glow);
    root.style.setProperty('--color-bg-input', colors.secondary);
  }, [accentColor]);

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
          element={
            isAuthenticated 
              ? <Navigate to="/dashboard" replace /> 
              : isVolunteerAuthenticated 
                ? <Navigate to="/volunteer-dashboard" replace /> 
                : <LoginPage />
          }
        />
        <Route path="/register-volunteer" element={<RegisterVolunteerPage />} />
        <Route path="/onboard/:token" element={<VolunteerOnboardPage />} />
        <Route path="/volunteer-onboard" element={<VolunteerOnboardPage />} />
        <Route path="/volunteer-success" element={<VolunteerSuccessPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* ── Shared layout (Admins, Leaders, Members, and Volunteers) ── */}
        <Route element={<SharedProtectedRoute><MainLayout /></SharedProtectedRoute>}>
          <Route
            path="/dashboard"
            element={
              isVolunteerAuthenticated 
                ? <Navigate to="/volunteer-dashboard" replace /> 
                : (user?.role === 'Admin' && isAdminView)
                  ? <DashboardPage /> 
                  : <UserDashboardPage />
            }
          />
          <Route
            path="/volunteer-dashboard"
            element={isVolunteerAuthenticated ? <VolunteerDashboardPage /> : <Navigate to="/login" replace />}
          />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/koinonia" element={<KoinoniaPage />} />
          <Route path="/kud-sermons" element={<KudSermonsPage />} />
          <Route path="/profile" element={<SettingsPage />} />

          {/* Admin / Leader specific routes inside the main layout */}
          <Route
            path="/users"
            element={<ProtectedRoute allowedRoles={['Admin', 'Technical']}><UsersPage /></ProtectedRoute>}
          />
          <Route
            path="/attendance"
            element={<ProtectedRoute allowedRoles={['Admin', 'Technical']}><AttendancePage /></ProtectedRoute>}
          />
          <Route
            path="/activity-logs"
            element={<ProtectedRoute allowedRoles={['Admin', 'Technical']}><ActivityLogsPage /></ProtectedRoute>}
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
          <Route path="/permissions" element={<PermissionsPage />} />
          <Route
            path="/reports"
            element={<ProtectedRoute allowedRoles={['Admin']}><ReportsPage /></ProtectedRoute>}
          />
           <Route
            path="/volunteers"
            element={<ProtectedRoute allowedRoles={['Admin']}><VolunteersPage /></ProtectedRoute>}
          />
          <Route
            path="/volunteer-events"
            element={<ProtectedRoute allowedRoles={['Admin']}><VolunteerEventsPage adminMode={true} /></ProtectedRoute>}
          />
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;