import { Box, Grid, Typography, Paper, useTheme } from '@mui/material';
import ReceiptIcon      from '@mui/icons-material/Receipt';
import WarningIcon      from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import KpiCard    from '../components/KpiCard';
import PageLoader from '../components/PageLoader';
import ErrorAlert from '../components/ErrorAlert';
import { useDashboard } from '../hooks/useDashboard';
import { fetchWeeklyCollections } from '../api/dashboard';

const fmt = (n: number) =>
  '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : (n / 1000).toFixed(1) + 'K');


export default function DashboardPage() {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useDashboard();
  const { data: weeklyData } = useQuery({
    queryKey: ['dashboard', 'weekly-collections'],
    queryFn: fetchWeeklyCollections,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageLoader message="Fetching Zoho data..." />;
  if (error)     return <ErrorAlert message={(error as Error).message} onRetry={refetch} />;
  if (!data)     return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Analytics Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        From local database · synced from Zoho
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <KpiCard
            title="Total Outstanding"
            value={fmt(data.unpaidInvoiceTotal)}
            subtitle={`${data.unpaidInvoiceCount} unpaid invoices`}
            color="#FF3B30"
            Icon={ReceiptIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <KpiCard
            title="Overdue Invoices"
            value={String(data.overdueInvoiceCount)}
            subtitle={fmt(data.overdueInvoiceTotal) + ' overdue'}
            color="#FF9500"
            Icon={WarningIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <KpiCard
            title="Open Sales Orders"
            value={String(data.openSalesOrderCount)}
            subtitle={fmt(data.openSalesOrderTotal) + ' value'}
            color="#AF52DE"
            Icon={ShoppingCartIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <KpiCard
            title="Collected YTD"
            value={fmt(data.collectedYtd)}
            color="#34C759"
            Icon={AccountBalanceIcon}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <KpiCard
            title="Collection Rate"
            value={`${data.collectionRate}%`}
            color="#32ADE6"
            Icon={TrendingUpIcon}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: '14px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>7-Day Collections</Typography>
            {weeklyData && weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => fmt(v as number)} tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} width={55} />
                  <ReTooltip
                    formatter={(v) => ['₹' + Number(v).toLocaleString('en-IN'), 'Collected']}
                    contentStyle={{ borderRadius: 10, border: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}
                  />
                  <Bar dataKey="amount" fill="#007AFF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">No payment data for the past 7 days.</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: '14px', height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Summary</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>{data.unpaidInvoiceCount}</strong> unpaid invoices —{' '}
              <strong style={{ color: '#FF3B30' }}>{fmt(data.unpaidInvoiceTotal)}</strong> due
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{data.openSalesOrderCount}</strong> open orders —{' '}
              <strong style={{ color: '#AF52DE' }}>{fmt(data.openSalesOrderTotal)}</strong> value
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
