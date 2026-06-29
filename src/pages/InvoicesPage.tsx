import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Paper, Tooltip,
  IconButton, Divider, Stack, Card, CardActionArea, CardContent,
  Pagination, useTheme, useMediaQuery,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import PaymentsIcon   from '@mui/icons-material/Payments';
import StatusBadge          from '../components/StatusBadge';
import PageLoader           from '../components/PageLoader';
import ErrorAlert           from '../components/ErrorAlert';
import RecordPaymentDialog  from '../components/RecordPaymentDialog';
import InvoiceDetailDrawer  from '../components/InvoiceDetailDrawer';
import TableToolbar         from '../components/TableToolbar';
import { useInvoices }      from '../hooks/useInvoices';
import type { Invoice }     from '../types';

const fmt    = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const toISO  = (d: Date)   => d.toISOString().slice(0, 10);

const DATE_PRESETS = [
  { value: 'all',       label: 'All' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'lastmonth', label: 'Last Month' },
];

const STATUS_OPTIONS = [
  { value: '',        label: 'All'     },
  { value: 'unpaid',  label: 'Unpaid'  },
  { value: 'overdue', label: 'Overdue' },
  { value: 'sent',    label: 'Sent'    },
  { value: 'paid',    label: 'Paid'    },
  { value: 'draft',   label: 'Draft'   },
];

const PAYABLE_STATUSES = new Set(['unpaid', 'overdue', 'sent', 'partially_paid']);

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

// ── Mobile card ───────────────────────────────────────────────────────────────
function InvoiceCard({ inv, onView, onPay }: {
  inv: Invoice;
  onView: (id: string) => void;
  onPay: (inv: Invoice) => void;
}) {
  const canPay = PAYABLE_STATUSES.has(inv.status) && inv.balance > 0;
  return (
    <Card variant="outlined" sx={{ borderRadius: '12px', mb: 1.5 }}>
      <CardActionArea onClick={() => onView(inv.invoice_id)} sx={{ p: 0 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            {/* Left */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{inv.invoice_number}</Typography>
                <StatusBadge status={inv.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary" noWrap>{inv.customer_name}</Typography>
              <Typography variant="caption" color="text.disabled">Due {inv.due_date}</Typography>
            </Box>

            {/* Right */}
            <Stack alignItems="flex-end" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
              <Typography variant="body1" fontWeight={800}>{fmt(inv.total)}</Typography>
              {inv.balance > 0 && (
                <Typography variant="caption" fontWeight={600} sx={{ color: '#FF3B30' }}>
                  Due {fmt(inv.balance)}
                </Typography>
              )}
              {canPay && (
                <Tooltip title="Record payment">
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onPay(inv); }}
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
export default function InvoicesPage() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [status,      setStatus]      = useState('unpaid');
  const [datePreset,  setDatePreset]  = useState('today');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [payingInvoice,   setPayingInvoice]   = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { dateStart, dateEnd } = resolveDates(datePreset);
  const { data, isLoading, error, refetch } = useInvoices(
    status || undefined, dateStart, dateEnd,
    paginationModel.page + 1, paginationModel.pageSize,
  );

  const reset = () => setPaginationModel((m) => ({ ...m, page: 0 }));
  const handleStatusChange = (_: React.MouseEvent<HTMLElement>, v: string | null) => { if (v !== null) { setStatus(v); reset(); } };
  const handleDateChange   = (_: React.MouseEvent<HTMLElement>, v: string | null) => { if (v !== null) { setDatePreset(v); reset(); } };

  const totalPages = Math.ceil((data?.total ?? 0) / paginationModel.pageSize);

  const columns: GridColDef[] = [
    { field: 'invoice_number', headerName: 'Invoice #',   width: 130 },
    { field: 'customer_name',  headerName: 'Customer',    flex: 1, minWidth: 140 },
    { field: 'date',           headerName: 'Date',        width: 110 },
    { field: 'due_date',       headerName: 'Due Date',    width: 110 },
    { field: 'total',          headerName: 'Total',       width: 110, type: 'number', valueFormatter: (v: number) => fmt(v) },
    { field: 'balance',        headerName: 'Balance Due', width: 120, type: 'number', valueFormatter: (v: number) => fmt(v), cellClassName: (p) => (p.value > 0 ? 'cell-balance' : '') },
    { field: 'status',         headerName: 'Status',      width: 110, renderCell: (p) => <StatusBadge status={p.value as string} /> },
    {
      field: '_actions', headerName: '', width: 56, sortable: false, disableColumnMenu: true,
      renderCell: (p) => {
        const inv = p.row as Invoice;
        if (!PAYABLE_STATUSES.has(inv.status) || inv.balance <= 0) return null;
        return (
          <Tooltip title="Record payment">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPayingInvoice(inv); }} sx={{ color: '#007AFF' }}>
              <PaymentsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Invoices</Typography>
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
          {/* ── Mobile: card list ── */}
          {isMobile ? (
            <Box>
              {/* Summary bar */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {data?.total ?? 0} invoice{(data?.total ?? 0) !== 1 ? 's' : ''}
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
                    <PaymentsIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {(data?.items ?? []).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">No invoices found</Typography>
                </Box>
              ) : (
                (data?.items ?? []).map((inv) => (
                  <InvoiceCard
                    key={inv.invoice_id}
                    inv={inv}
                    onView={setSelectedInvoiceId}
                    onPay={setPayingInvoice}
                  />
                ))
              )}

              {/* Mobile pagination */}
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
                getRowId={(r) => r.invoice_id}
                pageSizeOptions={[25, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                paginationMode="server"
                rowCount={data?.total ?? 0}
                onRowClick={(params) => setSelectedInvoiceId(params.row.invoice_id)}
                disableRowSelectionOnClick
                slots={{ toolbar: TableToolbar }}
                slotProps={{ toolbar: { onRefresh: refetch } }}
                ignoreDiacritics
                sx={{
                  border: 'none', height: '100%',
                  '& .MuiDataGrid-columnHeaders': { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
                  '& .MuiDataGrid-row': { cursor: 'pointer' },
                  '& .MuiDataGrid-row:hover': { background: 'rgba(0,122,255,0.06)' },
                  '& .cell-balance': { color: '#FF3B30', fontWeight: 700 },
                }}
              />
            </Paper>
          )}
        </>
      )}

      <RecordPaymentDialog invoice={payingInvoice} onClose={() => setPayingInvoice(null)} />
      <InvoiceDetailDrawer invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
    </Box>
  );
}
