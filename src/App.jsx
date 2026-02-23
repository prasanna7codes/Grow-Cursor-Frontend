import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import LoginPage from './pages/LoginPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProductResearchPage from './pages/admin/ProductResearchPage.jsx';
import AddListerPage from './pages/admin/AddListerPage.jsx';
import ListingAnalyticsPage from './pages/admin/ListingAnalyticsPage.jsx';
import ListerDashboard from './pages/lister/ListerDashboard.jsx';
import RangeAnalyzerPage from './pages/admin/RangeAnalyzerPage.jsx';
import SellerEbayPage from './pages/SellerProfilePage.jsx';
import AboutMePage from './pages/AboutMePage.jsx';
import MessageReceivedPage from './pages/admin/MessageReceivedPage.jsx';
import PayoneerSheetPage from './pages/admin/PayoneerSheetPage.jsx';
import BankAccountsPage from './pages/admin/BankAccountsPage.jsx';
import TransactionPage from './pages/admin/TransactionPage.jsx';
import IdeasPage from './pages/IdeasPage.jsx';

import { setAuthToken } from './lib/api'
import { hasPermission, PERMISSIONS as P } from './constants/permissions';
import { AttendanceProvider } from './context/AttendanceContext';
import AttendanceModal from './components/Attendance/AttendanceModal';
import AttendanceTimer from './components/Attendance/AttendanceTimer';

function useAuth() {
  const [token, setToken] = useState(() => sessionStorage.getItem('auth_token'));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user'); // keeping user in localStorage is fine
    return raw ? JSON.parse(raw) : null;
  });
  const navigate = useNavigate();
  const login = (t, u) => {
    setToken(t);
    setUser(u);
    sessionStorage.setItem('auth_token', t);   // per-tab token
    setAuthToken(t);
    localStorage.setItem('user', JSON.stringify(u));

    // Navigation Logic — use permissions first, fallback to role-based defaults
    if (u.role === 'superadmin') navigate('/admin');
    else if (hasPermission(u, P.LISTER_DASHBOARD)) navigate('/lister');
    else if (hasPermission(u, P.COMPATIBILITY_TASKS)) navigate('/admin/compatibility-tasks');
    else if (hasPermission(u, P.COMPATIBILITY_EDITOR)) navigate('/admin/compatibility-editor');
    else if (hasPermission(u, P.SELLER_PROFILE)) navigate('/seller-ebay');
    else if (hasPermission(u, P.FULFILLMENT)) navigate('/admin/fulfillment');
    else if (hasPermission(u, P.EMPLOYEE_DETAILS)) navigate('/admin/employee-details');
    else if (hasPermission(u, P.PRODUCT_RESEARCH)) navigate('/admin/research');
    else navigate('/admin');
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('auth_token');
    setAuthToken(null);
    localStorage.removeItem('user');
    navigate('/login');
  };
  return { token, user, login, logout };
}

export default function App() {
  const { token, user, login, logout } = useAuth();
  const theme = useMemo(() => createTheme({ palette: { mode: 'light' } }), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {token && user ? (
        <AttendanceProvider user={user}>
          <AttendanceModal />
          <AttendanceTimer />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={login} />} />

            {/* PUBLIC ROUTE - No authentication required */}
            <Route path="/ideas" element={<IdeasPage />} />

            <Route
              path="/about-me"
              element={<AboutMePage />}
            />

            <Route
              path="/admin/*"
              element={
                user.role === 'superadmin' ||
                  (user.permissions && user.permissions.length > 0) ? (
                  <AdminLayout user={user} onLogout={logout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/lister"
              element={hasPermission(user, P.LISTER_DASHBOARD) ? <ListerDashboard user={user} onLogout={logout} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/lister/range-analyzer"
              element={hasPermission(user, P.RANGE_ANALYZER) ? <RangeAnalyzerPage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/seller-ebay"
              element={
                hasPermission(user, P.SELLER_PROFILE) ? (
                  <SellerEbayPage user={user} onLogout={logout} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AttendanceProvider>
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </ThemeProvider>
  );
}