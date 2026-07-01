import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Paper, Divider,
  Tooltip, IconButton, Stack, Card, CardActionArea, CardContent,
  Pagination, Chip, TextField, useTheme, useMediaQuery,
} from '@mui/material';
import RefreshIcon    from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import StatusBadge    from '../components/StatusBadge';
import PageLoader     from '../components/PageLoader';
import ErrorAlert     from '../components/ErrorAlert';
import TableToolbar   from '../components/TableToolbar';
import SODetailDrawer   from '../components/SODetailDrawer';
import { useSalesOrders } from '../hooks/useSalesOrders';
import type { SalesOrder } from '../types';

const fmt   = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const toISO = (d: Date)   => d.toISOString().slice(0, 10);

const DATE_PRESETS = [
  { value: 'all',       label: 'All' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'lastmonth', label: 'Last Month' },
  { value: 'custom',    label: 'Custom…' },
];

const STATUS_OPTIONS = [
  { value: '',          label: 'All'       },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'draft',     label: 'Draft'     },
  { value: 'closed',    label: 'Closed'    },
  { value: 'void',      label: 'Void'      },
];

function resolveDates(preset: string): { dateStart?: string; dateEnd?: string } {
  const now = new Date(); const today = toISO(now);
  if (preset === 'today')     return { dateStart: today, dateEnd: today };
  if (preset === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); return { dateStart: toISO(y), dateEnd: toISO(y) }; }
  if (preset === 'thismonth') return { dateStart: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), dateEnd: today };
  if (preset === 'lastmonth') return { dateStart: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)), dateEnd: toISO(new Date(now.getFullYear(), now.getMonth(), 0)) };
  return {};
}


const TOGGLE_SX = {
  '& .MuiToggleButton-root': {
    borderRadius: '8px !important', textTransform: 'none', fontWeight: 600,
    px: { xs: 1, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' },
  },
};

function invoiceStatusChip(so: SalesOrder): { label: string; color: string } {
  const paid = so.paid_status ?? '';
  const inv  = so.invoiced_status ?? '';
  if (paid === 'paid') return { label: 'Paid', color: '#34C759' };
  if (inv === 'invoiced' || inv === 'partially_invoiced') return { label: 'Invoiced', color: '#FF9500' };
  return { label: 'To be Invoiced', color: '#007AFF' };
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function SOCard({ so, onView }: { so: SalesOrder; onView: (id: string) => void }) {
  const chip = invoiceStatusChip(so);
  return (
    <Card variant="outlined" sx={{ borderRadius: '12px', mb: 1.5 }}>
      <CardActionArea onClick={() => onView(so.salesorder_id)} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            {/* Left */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{so.salesorder_number}</Typography>
                <StatusBadge status={so.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary" noWrap>{so.customer_name}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
                <Typography variant="caption" color="text.disabled">{so.date}</Typography>
                {so.reference_number && (
                  <Chip label={so.reference_number} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                )}
              </Stack>
            </Box>

            {/* Right */}
            <Stack alignItems="flex-end" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
              <Typography variant="body1" fontWeight={800}>{fmt(so.total)}</Typography>
              <Chip
                label={chip.label}
                size="small"
                sx={{
                  height: 18, fontSize: '0.62rem', fontWeight: 700,
                  bgcolor: chip.color + '22',
                  color: chip.color,
                  border: `1px solid ${chip.color}44`,
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SalesOrdersPage() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [status,      setStatus]      = useState('');
  const [datePreset,  setDatePreset]  = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const resolved = datePreset === 'custom'
    ? { dateStart: customStart || undefined, dateEnd: customEnd || undefined }
    : resolveDates(datePreset);
  const { data, isLoading, error, refetch } = useSalesOrders(
    status || undefined, resolved.dateStart, resolved.dateEnd,
    paginationModel.page + 1, paginationModel.pageSize,
  );

  const reset = () => setPaginationModel((m) => ({ ...m, page: 0 }));
  const handleStatusChange = (_: React.MouseEvent<HTMLElement>, v: string | null) => { if (v !== null) { setStatus(v); reset(); } };
  const handleDateChange   = (_: React.MouseEvent<HTMLElement>, v: string | null) => { if (v !== null) { setDatePreset(v); reset(); } };

  const totalPages = Math.ceil((data?.total ?? 0) / paginationModel.pageSize);

  const columns: GridColDef[] = [
    { field: 'salesorder_number', headerName: 'SO #',      width: 140 },
    { field: 'customer_name',     headerName: 'Customer',  flex: 1, minWidth: 160 },
    { field: 'date',              headerName: 'Date',      width: 120 },
    { field: 'shipment_date',     headerName: 'Shipment',  width: 120 },
    { field: 'reference_number',  headerName: 'Reference', width: 140 },
    { field: 'total',             headerName: 'Total',     width: 130, type: 'number', valueFormatter: (v: number) => fmt(v) },
    { field: 'status',            headerName: 'Status',    width: 120, renderCell: (p) => <StatusBadge status={p.value as string} /> },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Sales Orders</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>From Zoho POS</Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5, alignItems: 'center' }}>
        <ToggleButtonGroup value={datePreset} exclusive onChange={handleDateChange} size="small" sx={TOGGLE_SX}>
          {DATE_PRESETS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <ToggleButtonGroup value={status} exclusive onChange={handleStatusChange} size="small" sx={TOGGLE_SX}>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {datePreset === 'custom' && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small" type="date" label="From"
            value={customStart}
            onChange={(e) => { setCustomStart(e.target.value); reset(); }}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <TextField
            size="small" type="date" label="To"
            value={customEnd}
            onChange={(e) => { setCustomEnd(e.target.value); reset(); }}
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Box>
      )}

      {error     && <ErrorAlert message={(error as Error).message} onRetry={refetch} />}
      {isLoading && <PageLoader />}

      {!isLoading && !error && (
        <>
          {isMobile ? (
            /* ── Mobile: card list ── */
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {data?.total ?? 0} order{(data?.total ?? 0) !== 1 ? 's' : ''}
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {(data?.items ?? []).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">No sales orders found</Typography>
                </Box>
              ) : (
                (data?.items ?? []).map((so) => (
                  <SOCard key={so.salesorder_id} so={so} onView={setSelectedId} />
                ))
              )}

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={paginationModel.page + 1}
                    onChange={(_, p) => setPaginationModel((m) => ({ ...m, page: p - 1 }))}
                    size="small"
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          ) : (
            /* ── Desktop: DataGrid ── */
            <Paper sx={{ borderRadius: '14px', overflow: 'hidden', height: 580 }}>
              <DataGrid
                rows={data?.items ?? []}
                columns={columns}
                getRowId={(r) => r.salesorder_id}
                pageSizeOptions={[25, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                paginationMode="server"
                rowCount={data?.total ?? 0}
                onRowClick={(params) => setSelectedId(params.row.salesorder_id)}
                disableRowSelectionOnClick
                slots={{ toolbar: TableToolbar }}
                slotProps={{ toolbar: { onRefresh: refetch } }}
                ignoreDiacritics
                sx={{
                  border: 'none', height: '100%',
                  '& .MuiDataGrid-columnHeaders': { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-row:hover': { background: 'rgba(0,122,255,0.06)' },
                }}
              />
            </Paper>
          )}
        </>
      )}

      <SODetailDrawer salesOrderId={selectedId} onClose={() => setSelectedId(null)} />
    </Box>
  );
}
