import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, ThemeProvider, useAuth, NotificationProvider } from './context';
import { Navbar, Footer, Sidebar } from './components/layout';
import {
  Home,
  Login,
  Register,
  AdminLogin,
  Dashboard,
  DonateFood,
  FindFood,
  Zakat,
  Leaderboard,
  VolunteerDeliveries,
  RecipientRequest,
  MyRequests,
  ContributorProfile,
  RecipientProfile,
  ReceiptsLedger,
  Users,
  Analytics,
  Reports,
  DonationHistory,
  FoodRequests,
  ZakatRequests,
  AdminVolunteerDeliveries,
  CustomRequests,
} from './pages';
import './App.css';
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const PublicLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </>
  );
};

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/admin-login"
        element={
          <PublicRoute>
            <AdminLogin />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/donate"
        element={
          <RoleRoute allowedRoles={['contributor']}>
            <DashboardLayout>
              <DonateFood />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/find-food"
        element={
          <RoleRoute allowedRoles={['recipient', 'contributor', 'volunteer', 'admin']}>
            <DashboardLayout>
              <FindFood />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/zakat"
        element={
          <RoleRoute allowedRoles={['contributor', 'recipient', 'admin']}>
            <DashboardLayout>
              <Zakat />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Leaderboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/volunteer/deliveries"
        element={
          <RoleRoute allowedRoles={['volunteer', 'admin']}>
            <DashboardLayout>
              <VolunteerDeliveries />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/recipient/request"
        element={
          <RoleRoute allowedRoles={['recipient']}>
            <DashboardLayout>
              <RecipientRequest />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/my-requests"
        element={
          <RoleRoute allowedRoles={['recipient']}>
            <DashboardLayout>
              <MyRequests />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/profile/contributor"
        element={
          <RoleRoute allowedRoles={['contributor']}>
            <DashboardLayout>
              <ContributorProfile />
            </DashboardLayout>
          </RoleRoute>
        }
      />
      <Route
        path="/profile/recipient"
        element={
          <RoleRoute allowedRoles={['recipient']}>
            <DashboardLayout>
              <RecipientProfile />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/users"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/food-requests"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <FoodRequests />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/zakat-requests"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <ZakatRequests />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/volunteer-deliveries"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminVolunteerDeliveries />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/custom-requests"
        element={
          <RoleRoute allowedRoles={['admin', 'contributor']}>
            <DashboardLayout>
              <CustomRequests />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      {}
      <Route
        path="/dashboard/certificates"
        element={
          <RoleRoute allowedRoles={['contributor']}>
            <DashboardLayout>
              <ReceiptsLedger />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      {}
      <Route
        path="/dashboard/history"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DonationHistory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/my-donations"
        element={
          <RoleRoute allowedRoles={['contributor']}>
            <DashboardLayout>
              <DonationHistory />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/analytics"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Analytics />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard/reports"
        element={
          <RoleRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </RoleRoute>
        }
      />

      <Route
        path="*"
        element={
          <PublicLayout>
            <div className="not-found">
              <h1>404</h1>
              <p>Page not found</p>
            </div>
          </PublicLayout>
        }
      />
    </Routes>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <div className="app">
              <AppRoutes />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--white)',
                    color: 'var(--gray-900)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '12px 16px',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--success)',
                      secondary: 'white',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--danger)',
                      secondary: 'white',
                    },
                  },
                }}
              />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
