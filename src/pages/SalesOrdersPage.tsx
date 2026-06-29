import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Paper, Divider,
  Tooltip, IconButton, Stack, Card, CardActionArea, CardContent,
  Pagination, Chip, useTheme, useMediaQuery,
} from '@mui/material';
import PaymentsIcon   from '@mui/icons-material/Payments';
import RefreshIcon    from '@mui/icons-material/Refresh';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import StatusBadge    from '../components/StatusBadge';
import PageLoader     from '../components/PageLoader';
import ErrorAlert     from '../components/ErrorAlert';
import TableToolbar   from '../components/TableToolbar';
import SOFulfillDialog  from '../components/SOFulfillDialog';
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

const FULFILLABLE = new Set(['draft', 'confirmed', 'open']);

const TOGGLE_SX = {
  '& .MuiToggleButton-root': {
    borderRadius: '8px !important', textTransform: 'none', fontWeight: 600,
    px: { xs: 1, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' },
  },
};

// ── Mobile card ───────────────────────────────────────────────────────────────
function SOCard({ so, onView, onFulfill }: { so: SalesOrder; onView: (id: string) => void; onFulfill: (so: SalesOrder) => void }) {
  const canFulfill = FULFILLABLE.has(so.status);
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
              {canFulfill && (
                <Tooltip title="Record payment & fulfill">
                  <IconButton
                    size="small"
                    onClick={() => onFulfill(so)}
                    sx={{
                      color: '#fff', background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                      width: 30, height: 30,
                      '&:hover': { background: 'linear-gradient(135deg,#0062CC,#1A9ADB)' },
                    }}
                  >
                    <PaymentsIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
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
  const [fulfilling,  setFulfilling]  = useState<SalesOrder | null>(null);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const { dateStart, dateEnd } = resolveDates(datePreset);
  const { data, isLoading, error, refetch } = useSalesOrders(
    status || undefined, dateStart, dateEnd,
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
    {
      field: '_actions', headerName: '', width: 60, sortable: false, disableColumnMenu: true,
      renderCell: (p) => {
        const so = p.row as SalesOrder;
        if (!FULFILLABLE.has(so.status)) return null;
        return (
          <Tooltip title="Record payment & fulfill">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setFulfilling(so); }} sx={{ color: '#007AFF' }}>
              <PaymentsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Sales Orders</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>From Zoho POS</Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
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
                  <SOCard key={so.salesorder_id} so={so} onView={setSelectedId} onFulfill={setFulfilling} />
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

      <SOFulfillDialog salesOrder={fulfilling} onClose={() => setFulfilling(null)} />
      <SODetailDrawer salesOrderId={selectedId} onClose={() => setSelectedId(null)} />
    </Box>
  );
}
