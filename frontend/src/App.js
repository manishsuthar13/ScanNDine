import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RequireRole from './components/RequireRole';
import { PageLoader, FeedbackProvider } from './components/ui';

// Each screen is its own chunk so a customer opening a QR menu doesn't download the dashboards
const Auth = lazy(() => import('./pages/Auth'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Menu = lazy(() => import('./pages/Menu'));
const Admin = lazy(() => import('./pages/Admin'));
const Staff = lazy(() => import('./pages/Staff'));
const SuperadminLayout = lazy(() => import('./components/superadmin/SuperadminLayout'));
const Analytics = lazy(() => import('./pages/superadmin/Analytics'));
const Restaurants = lazy(() => import('./pages/superadmin/Restaurants'));
const Pricing = lazy(() => import('./pages/superadmin/Pricing'));
const Billing = lazy(() => import('./pages/superadmin/Billing'));
const Settings = lazy(() => import('./pages/superadmin/Settings'));

function App() {
  return (
    <FeedbackProvider>
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Customers reach the menu through a table QR code - no login */}
          <Route path="/menu" element={<Menu />} />
          <Route path="/superadmin" element={<RequireRole role="superadmin"><SuperadminLayout /></RequireRole>}>
            <Route index element={<Analytics />} />
            <Route path="restaurants" element={<Restaurants />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="billing" element={<Billing />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/admin" element={<RequireRole role="admin"><Admin /></RequireRole>} />
          <Route path="/staff" element={<RequireRole role="staff"><Staff /></RequireRole>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
    </FeedbackProvider>
  );
}

export default App;
