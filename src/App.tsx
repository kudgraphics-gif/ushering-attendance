import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { EventsPage } from './pages/EventsPage';
import { UsersPage } from './pages/UsersPage';
import { AttendancePage } from './pages/AttendancePage';
import { SettingsPage } from './pages/SettingsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { RosterManagementPage } from './pages/RosterManagementPage';
import { RosterAssignmentsPage } from './pages/RosterAssignmentPage'; // New Import
import { PaymentsPage } from './pages/PaymentsPage';
import { KoinoniaPage } from './pages/KoinoniaPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route 
            path="/dashboard" 
            element={user?.role === 'Admin' ? <DashboardPage /> : <UserDashboardPage />} 
          />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/koinonia" element={<KoinoniaPage />} />
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
          {/* New Route for Roster Assignments */}
          <Route 
            path="/roster/:id" 
            element={<ProtectedRoute allowedRoles={['Admin']}><RosterAssignmentsPage /></ProtectedRoute>} 
          />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;