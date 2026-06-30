import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Drawer, Box, Typography, Divider, Chip, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, IconButton, Skeleton, Alert,
  Button, useTheme, useMediaQuery, Snackbar,
} from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import PaymentsIcon     from '@mui/icons-material/Payments';
import ReceiptIcon      from '@mui/icons-material/Receipt';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { fetchSalesOrderDetail, createInvoiceFromSO } from '../api/salesorders';
import StatusBadge        from './StatusBadge';
import SOFulfillDialog    from './SOFulfillDialog';
import InvoiceDetailDrawer from './InvoiceDetailDrawer';
import type { SalesOrder } from '../types';

const fmt  = (n: number | undefined | null) => '₹' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQ = (n: number | undefined | null) => { const v = n ?? 0; return v % 1 === 0 ? String(v) : v.toFixed(2); };

const FULFILLABLE = new Set(['draft', 'confirmed', 'open']);
const CAN_INVOICE = new Set(['draft', 'confirmed', 'open']);

interface Props {
  salesOrderId: string | null;
  onClose: () => void;
}

export default function SODetailDrawer({ salesOrderId, onClose }: Props) {
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [fulfilling,      setFulfilling]      = useState(false);
  const [invoiceSnack,    setInvoiceSnack]    = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  const { data: so, isLoading, error } = useQuery({
    queryKey: ['salesorder', salesOrderId],
    queryFn:  () => fetchSalesOrderDetail(salesOrderId!),
    enabled:  !!salesOrderId,
    staleTime: 0,
  });

  const canFulfill = so ? FULFILLABLE.has(so.status) : false;
  const hasInvoice = (so?.invoices ?? []).length > 0;
  const canInvoice = so ? CAN_INVOICE.has(so.status) && !hasInvoice : false;

  const createInvoiceMut = useMutation({
    mutationFn: () => createInvoiceFromSO(salesOrderId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesorder', salesOrderId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setInvoiceSnack(`Invoice ${data.invoice_number} created successfully`);
    },
  });

  // Reset mutation state when switching to a different SO
  useEffect(() => {
    createInvoiceMut.reset();
  }, [salesOrderId]);

  return (
    <>
      <Drawer
        anchor="right"
        open={!!salesOrderId}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 540, md: 620 },
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            top: { xs: '56px', sm: '64px' },
            height: { xs: 'calc(100% - 56px)', sm: 'calc(100% - 64px)' },
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          px: 2, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky', top: 0, zIndex: 1,
          background: theme.palette.background.paper,
        }}>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {isLoading ? <Skeleton width={140} /> : so?.salesorder_number ?? 'Sales Order'}
            </Typography>
            {!isLoading && so && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">{so.customer_name}</Typography>
            )}
          </Box>
          {!isLoading && so && <StatusBadge status={so.status} />}
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: '10px' }}>
              {(error as Error).message}
            </Alert>
          )}

          {createInvoiceMut.isError && (
            <Alert severity="error" sx={{ borderRadius: '10px', mb: 2 }}>
              {(createInvoiceMut.error as Error).message}
            </Alert>
          )}

          {isLoading && (
            <Stack spacing={1.5}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} height={32} />)}
            </Stack>
          )}

          {!isLoading && so && (
            <Stack spacing={3}>
              {/* Meta */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[
                  ['Order Date',    so.date],
                  ['Shipment Date', so.shipment_date || '—'],
                  ['Reference',     so.reference_number || '—'],
                  ['Currency',      so.currency_code],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Linked invoices */}
              {so.invoices && so.invoices.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Linked Invoices</Typography>
                    <Stack spacing={1}>
                      {so.invoices.map((inv) => (
                        <Paper
                          key={inv.invoice_id}
                          variant="outlined"
                          onClick={() => setSelectedInvoice(inv.invoice_id)}
                          sx={{
                            px: 2, py: 1.2, borderRadius: '10px', cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(0,122,255,0.04)' },
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <ReceiptIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="body2" fontWeight={700}>{inv.invoice_number}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={600}>{fmt(inv.total)}</Typography>
                              <StatusBadge status={inv.status} />
                              <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                </>
              )}

              <Divider />

              {/* Line items */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Items</Typography>
                <Paper variant="outlined" sx={{ borderRadius: '10px', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ background: theme.palette.action.hover }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Item</TableCell>
                        {!isMobile && <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Qty</TableCell>}
                        {!isMobile && <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Rate</TableCell>}
                        {!isMobile && <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Tax</TableCell>}
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>Amount (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {so.line_items?.map((li) => (
                        <TableRow key={li.line_item_id} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{li.name}</Typography>
                            {isMobile && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {fmtQ(li.quantity)} {li.unit} × {fmt(li.rate)}
                                {li.tax_name ? ` · ${li.tax_name} (${li.tax_percentage}%)` : ''}
                              </Typography>
                            )}
                          </TableCell>
                          {!isMobile && <TableCell align="right"><Typography variant="body2">{fmtQ(li.quantity)} {li.unit}</Typography></TableCell>}
                          {!isMobile && <TableCell align="right"><Typography variant="body2">{fmt(li.rate)}</Typography></TableCell>}
                          {!isMobile && (
                            <TableCell align="right">
                              {li.tax_name
                                ? <Chip label={`${li.tax_name} ${li.tax_percentage}%`} size="small" sx={{ fontSize: '0.68rem' }} />
                                : <Typography variant="body2" color="text.disabled">—</Typography>}
                            </TableCell>
                          )}
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>{fmt(li.total)}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              {/* Total */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Stack spacing={0.75} sx={{ minWidth: 220 }}>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" fontWeight={700}>Total</Typography>
                    <Typography variant="body2" fontWeight={700}>{fmt(so.total)}</Typography>
                  </Stack>
                </Stack>
              </Box>

              {/* Notes / Terms */}
              {(so.notes || so.terms) && (
                <>
                  <Divider />
                  <Box sx={{ display: 'grid', gridTemplateColumns: so.notes && so.terms ? '1fr 1fr' : '1fr', gap: 2 }}>
                    {so.notes && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>Notes</Typography>
                        <Typography variant="body2">{so.notes}</Typography>
                      </Box>
                    )}
                    {so.terms && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>Terms</Typography>
                        <Typography variant="body2">{so.terms}</Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Stack>
          )}
        </Box>

        {/* Sticky footer */}
        {!isLoading && so && (canFulfill || canInvoice) && (
          <Box sx={{
            px: 3, py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
          }}>
            <Stack spacing={1.5}>
              {/* Create Invoice button — shown when confirmed and no invoice yet */}
              {canInvoice && (
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={createInvoiceMut.isSuccess
                    ? <CheckCircleIcon />
                    : <ReceiptIcon />}
                  onClick={() => createInvoiceMut.mutate()}
                  disabled={createInvoiceMut.isPending || createInvoiceMut.isSuccess}
                  sx={{
                    py: 1.2, borderRadius: '10px', fontWeight: 700,
                    background: createInvoiceMut.isSuccess
                      ? '#34C759'
                      : 'linear-gradient(135deg,#34C759,#30B94E)',
                    '&:hover': { background: 'linear-gradient(135deg,#28A745,#239B3F)' },
                    '&.Mui-disabled': { opacity: 0.7, color: '#fff' },
                  }}
                >
                  {createInvoiceMut.isPending
                    ? 'Creating Invoice…'
                    : createInvoiceMut.isSuccess
                      ? 'Invoice Created'
                      : 'Create Invoice'}
                </Button>
              )}

              {/* Record Payment & Fulfill */}
              {canFulfill && (
                <Button
                  variant={canInvoice ? 'outlined' : 'contained'}
                  fullWidth
                  startIcon={<PaymentsIcon />}
                  onClick={() => setFulfilling(true)}
                  sx={{
                    py: 1.2, borderRadius: '10px', fontWeight: 700,
                    ...(canInvoice ? {} : {
                      background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                      '&:hover': { background: 'linear-gradient(135deg,#0062CC,#1A9ADB)' },
                    }),
                  }}
                >
                  Record Payment &amp; Fulfill
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Drawer>

      <SOFulfillDialog
        salesOrder={fulfilling && so ? (so as unknown as SalesOrder) : null}
        onClose={() => setFulfilling(false)}
      />

      <InvoiceDetailDrawer
        invoiceId={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <Snackbar
        open={!!invoiceSnack}
        autoHideDuration={4000}
        onClose={() => setInvoiceSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          onClose={() => setInvoiceSnack(null)}
          sx={{ borderRadius: '12px', fontWeight: 600 }}
        >
          {invoiceSnack}
        </Alert>
      </Snackbar>
    </>
  );
}
