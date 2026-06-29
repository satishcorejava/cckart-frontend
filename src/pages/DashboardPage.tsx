import { Box, Grid, Typography, Paper } from '@mui/material';
import ReceiptIcon      from '@mui/icons-material/Receipt';
import WarningIcon      from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import KpiCard    from '../components/KpiCard';
import PageLoader from '../components/PageLoader';
import ErrorAlert from '../components/ErrorAlert';
import { useDashboard } from '../hooks/useDashboard';

const fmt = (n: number) =>
  '₹' + (n >= 100000 ? (n / 100000).toFixed(1) + 'L' : (n / 1000).toFixed(1) + 'K');

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboard();

  if (isLoading) return <PageLoader message="Fetching Zoho data..." />;
  if (error)     return <ErrorAlert message={(error as Error).message} onRetry={refetch} />;
  if (!data)     return null;

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Analytics Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Live data from Zoho Books &amp; Inventory
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
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '14px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Unpaid Invoice Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Total balance due across <strong>{data.unpaidInvoiceCount}</strong> unpaid invoices:{' '}
              <strong style={{ color: '#FF3B30' }}>{fmt(data.unpaidInvoiceTotal)}</strong>
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: '14px' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Open Sales Orders</Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>{data.openSalesOrderCount}</strong> open orders totalling{' '}
              <strong style={{ color: '#AF52DE' }}>{fmt(data.openSalesOrderTotal)}</strong>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
