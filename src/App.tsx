import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth }  from './context/AuthContext';
import InstallPrompt              from './components/InstallPrompt';
import Layout              from './components/Layout';
import LoginPage           from './pages/LoginPage';
import DashboardPage       from './pages/DashboardPage';
import InvoicesPage        from './pages/InvoicesPage';
import SalesOrdersPage     from './pages/SalesOrdersPage';
import ContactsPage        from './pages/ContactsPage';
import ItemsPage           from './pages/ItemsPage';
import OrganizationsPage   from './pages/OrganizationsPage';
import { darkTheme, lightTheme } from './theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes({ onToggleTheme }: { onToggleTheme: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout onToggleTheme={onToggleTheme}>
      <Routes>
        <Route path="/"              element={<DashboardPage />}     />
        <Route path="/invoices"      element={<InvoicesPage />}      />
        <Route path="/salesorders"   element={<SalesOrdersPage />}   />
        <Route path="/contacts"      element={<ContactsPage />}      />
        <Route path="/items"         element={<ItemsPage />}         />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/login"         element={<Navigate to="/" replace />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem('zh-theme') !== 'light'
  );

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('zh-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes onToggleTheme={toggleTheme} />
            <InstallPrompt />
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
