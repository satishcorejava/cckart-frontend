import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Stack, Card, CardContent,
  CardActionArea, Chip, Divider, Skeleton, Alert, Button, Paper,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip,
  Pagination, useTheme, useMediaQuery,
} from '@mui/material';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import OpenInNewIcon  from '@mui/icons-material/OpenInNew';
import PaymentsIcon   from '@mui/icons-material/Payments';
import RefreshIcon    from '@mui/icons-material/Refresh';
import StatusBadge    from '../components/StatusBadge';
import RecordPaymentDialog  from '../components/RecordPaymentDialog';
import InvoiceDetailDrawer  from '../components/InvoiceDetailDrawer';
import { fetchSalesOrdersForLookup, fetchSOInvoices, type LinkedInvoice } from '../api/soInvoices';
import type { SalesOrder, Invoice } from '../types';

const fmt   = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
const toISO = (d: Date)   => d.toISOString().slice(0, 10);

const DATE_PRESETS = [
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'lastmonth', label: 'Last Month' },
  { value: 'all',       label: 'All' },
];

function resolveDates(preset: string): { dateStart?: string; dateEnd?: string } {
  const now = new Date(); const today = toISO(now);
  if (preset === 'today')     return { dateStart: today, dateEnd: today };
  if (preset === 'yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); return { dateStart: toISO(y), dateEnd: toISO(y) }; }
  if (preset === 'thismonth') return { dateStart: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), dateEnd: today };
  if (preset === 'lastmonth') return { dateStart: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)), dateEnd: toISO(new Date(now.getFullYear(), now.getMonth(), 0)) };
  return {};
}

const PAYABLE = new Set(['unpaid', 'overdue', 'sent', 'partially_paid']);

// ── Invoice list panel ────────────────────────────────────────────────────────
function InvoicePanel({ so, onBack }: { so: SalesOrder; onBack: () => void }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [paying,     setPaying]     = useState<LinkedInvoice | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: invoices = [], isLoading, error, refetch } = useQuery({
    queryKey: ['so-invoices', so.salesorder_id],
    queryFn:  () => fetchSOInvoices(so.salesorder_id),
    staleTime: 60_000,
  });

  return (
    <Box>
      {/* Sub-header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton size="small" onClick={onBack} sx={{ color: 'text.secondary' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>{so.salesorder_number}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">{so.customer_name}</Typography>
        </Box>
        <StatusBadge status={so.status} />
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{(error as Error).message}</Alert>}

      {isLoading && (
        <Stack spacing={1.5}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={80} sx={{ borderRadius: '12px' }} />)}
        </Stack>
      )}

      {!isLoading && invoices.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No invoices linked to this sales order</Typography>
        </Box>
      )}

      {!isLoading && invoices.length > 0 && (
        isMobile ? (
          /* Mobile: cards */
          <Stack spacing={1.5}>
            {invoices.map((inv) => {
              const canPay = PAYABLE.has(inv.status) && inv.balance > 0;
              return (
                <Card key={inv.invoice_id} variant="outlined"
                  sx={{ borderRadius: '12px', '&:hover': { borderColor: 'primary.main' } }}>
                  <CardActionArea onClick={() => setSelectedId(inv.invoice_id)} sx={{ p: 0 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={700}>{inv.invoice_number}</Typography>
                          <StatusBadge status={inv.status} />
                        </Stack>
                        <Typography variant="caption" color="text.disabled">
                          Date: {inv.date}{inv.due_date ? ` · Due: ${inv.due_date}` : ''}
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" spacing={0.5} sx={{ ml: 1, flexShrink: 0 }}>
                        <Typography variant="body1" fontWeight={800}>{fmt(inv.total)}</Typography>
                        {inv.balance > 0 && (
                          <Typography variant="caption" fontWeight={600} sx={{ color: '#FF3B30' }}>
                            Due {fmt(inv.balance)}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5}>
                          {inv.invoice_url && (
                            <Tooltip title="Pay Online">
                              <IconButton size="small" href={inv.invoice_url} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} sx={{ color: '#007AFF' }}>
                                <OpenInNewIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canPay && (
                            <Tooltip title="Record Payment">
                              <IconButton size="small"
                                onClick={(e) => { e.stopPropagation(); setPaying(inv); }}
                                sx={{ color: '#fff', background: 'linear-gradient(135deg,#007AFF,#32ADE6)', width: 28, height: 28,
                                  '&:hover': { background: 'linear-gradient(135deg,#0062CC,#1A9ADB)' } }}>
                                <PaymentsIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        ) : (
          /* Desktop: table */
          <Paper variant="outlined" sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: theme.palette.action.hover }}>
                  {['Invoice #', 'Date', 'Due Date', 'Total', 'Balance', 'Status', ''].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => {
                  const canPay = PAYABLE.has(inv.status) && inv.balance > 0;
                  return (
                    <TableRow key={inv.invoice_id} onClick={() => setSelectedId(inv.invoice_id)}
                      sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer', '&:hover': { background: 'rgba(0,122,255,0.06)' } }}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{inv.invoice_number}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{inv.date}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{inv.due_date || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={600}>{fmt(inv.total)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}
                          sx={{ color: inv.balance > 0 ? '#FF3B30' : 'success.main' }}>
                          {fmt(inv.balance)}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {inv.invoice_url && (
                            <Tooltip title="Pay Online">
                              <IconButton size="small" href={inv.invoice_url} target="_blank" rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()} sx={{ color: '#007AFF' }}>
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canPay && (
                            <Tooltip title="Record Payment">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPaying(inv); }} sx={{ color: '#007AFF' }}>
                                <PaymentsIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )
      )}

      <RecordPaymentDialog
        invoice={paying ? (paying as unknown as Invoice) : null}
        onClose={() => setPaying(null)}
      />
      <InvoiceDetailDrawer
        invoiceId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </Box>
  );
}

const PER_PAGE = 20;

// ── SO list panel ─────────────────────────────────────────────────────────────
function SOListPanel({ onSelect }: { onSelect: (so: SalesOrder) => void }) {
  const [datePreset, setDatePreset] = useState('today');
  const [page, setPage] = useState(1);
  const { dateStart, dateEnd } = resolveDates(datePreset);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['so-lookup', dateStart, dateEnd, page],
    queryFn:  () => fetchSalesOrdersForLookup(dateStart, dateEnd, page, PER_PAGE),
    staleTime: 60_000,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PER_PAGE);
  const handleDateChange = (_: React.MouseEvent<HTMLElement>, v: string | null) => {
    if (v) { setDatePreset(v); setPage(1); }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <ToggleButtonGroup value={datePreset} exclusive size="small"
          onChange={handleDateChange}
          sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, px: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.72rem', sm: '0.8rem' } } }}>
          {DATE_PRESETS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Typography variant="caption" color="text.secondary">{data?.total ?? 0} orders</Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{(error as Error).message}</Alert>}

      {isLoading && (
        <Stack spacing={1.5}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={72} sx={{ borderRadius: '12px' }} />)}
        </Stack>
      )}

      {!isLoading && (data?.items ?? []).length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">No sales orders found for this period</Typography>
        </Box>
      )}

      {!isLoading && (data?.items ?? []).map((so) => (
        <Card key={so.salesorder_id} variant="outlined"
          sx={{ borderRadius: '12px', mb: 1.5, '&:hover': { borderColor: 'primary.main' } }}>
          <CardActionArea onClick={() => onSelect(so)} sx={{ p: 0 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>{so.salesorder_number}</Typography>
                    <StatusBadge status={so.status} />
                    {so.reference_number && (
                      <Chip label={so.reference_number} size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>{so.customer_name}</Typography>
                  <Typography variant="caption" color="text.disabled">{so.date}</Typography>
                </Box>
                <Stack alignItems="flex-end" sx={{ ml: 1, flexShrink: 0 }}>
                  <Typography variant="body1" fontWeight={800}>{fmt(so.total)}</Typography>
                  <Typography variant="caption" color="primary">View invoices →</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            size="small"
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SOInvoicesPage() {
  const [selectedSO, setSelectedSO] = useState<SalesOrder | null>(null);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>SO Invoices</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        View invoices linked to a Sales Order
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {selectedSO ? (
        <InvoicePanel so={selectedSO} onBack={() => setSelectedSO(null)} />
      ) : (
        <SOListPanel onSelect={setSelectedSO} />
      )}
    </Box>
  );
}
