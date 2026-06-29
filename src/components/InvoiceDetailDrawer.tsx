import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer, Box, Typography, Divider, Chip, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, IconButton, Skeleton, Alert,
  Button, Snackbar, useTheme, useMediaQuery,
} from '@mui/material';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';
import PhoneIcon        from '@mui/icons-material/Phone';
import LocationOnIcon   from '@mui/icons-material/LocationOn';
import OpenInNewIcon    from '@mui/icons-material/OpenInNew';
import ContentCopyIcon  from '@mui/icons-material/ContentCopy';
import WhatsAppIcon     from '@mui/icons-material/WhatsApp';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { fetchInvoiceDetail, markInvoiceAsSent, enableInvoicePayment } from '../api/invoices';
import StatusBadge from './StatusBadge';
import RecordPaymentDialog from './RecordPaymentDialog';
import type { Invoice } from '../types';

const fmt  = (n: number | undefined | null) => '₹' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQ = (n: number | undefined | null) => { const v = n ?? 0; return v % 1 === 0 ? String(v) : v.toFixed(2); };

interface Props {
  invoiceId: string | null;
  onClose: () => void;
}

export default function InvoiceDetailDrawer({ invoiceId, onClose }: Props) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const queryClient = useQueryClient();

  const [paying,      setPaying]      = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);
  const [paymentUrl,  setPaymentUrl]  = useState<string | null>(null);

  const enablePaymentMutation = useMutation({
    mutationFn: () => enableInvoicePayment(invoiceId!),
    onSuccess: (url) => {
      setPaymentUrl(url);
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      setToast('Payment link generated!');
    },
    onError: () => setToast('Failed to enable payment'),
  });

  const markSentMutation = useMutation({
    mutationFn: () => markInvoiceAsSent(invoiceId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setToast('Invoice marked as sent');
    },
    onError: () => setToast('Failed to mark as sent'),
  });

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => { setToast('Payment link copied!'); });
  };

  const shareWhatsApp = (inv: { invoice_number: string; balance: number; invoice_url: string }) => {
    const text = encodeURIComponent(
      `Hi, please find your invoice ${inv.invoice_number}.\nBalance due: ₹${inv.balance.toLocaleString('en-IN')}.\nPay here: ${inv.invoice_url}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const { data: inv, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn:  () => { setPaymentUrl(null); return fetchInvoiceDetail(invoiceId!); },
    enabled:  !!invoiceId,
    staleTime: 60_000,
  });

  return (
    <Drawer
      anchor="right"
      open={!!invoiceId}
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
            {isLoading ? <Skeleton width={140} /> : inv?.invoice_number ?? 'Invoice'}
          </Typography>
          {!isLoading && inv && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">{inv.customer_name}</Typography>
          )}
        </Box>
        {!isLoading && inv && <StatusBadge status={inv.status} />}
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: '10px' }}>
            {(error as Error).message}
          </Alert>
        )}

        {isLoading && (
          <Stack spacing={1.5}>
            {[...Array(6)].map((_, i) => <Skeleton key={i} height={32} />)}
          </Stack>
        )}

        {!isLoading && inv && (
          <Stack spacing={3}>
            {/* Meta info */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                ['Invoice Date',  inv.date],
                ['Due Date',      inv.due_date],
                ['Reference',     inv.reference_number || '—'],
                ['Currency',      inv.currency_code],
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </Box>

            {/* Customer contact & address */}
            {(inv.mobile || inv.phone || inv.billing_address) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Customer Info</Typography>
                  <Stack spacing={1}>
                    {(inv.mobile || inv.phone) && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{inv.mobile || inv.phone}</Typography>
                      </Stack>
                    )}
                    {inv.billing_address && (inv.billing_address.address || inv.billing_address.city) && (
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', mt: '2px' }} />
                        <Typography variant="body2">
                          {[
                            inv.billing_address.address,
                            inv.billing_address.city,
                            inv.billing_address.state,
                            inv.billing_address.zip,
                            inv.billing_address.country,
                          ].filter(Boolean).join(', ')}
                        </Typography>
                      </Stack>
                    )}
                    {inv.billing_address?.phone && inv.billing_address.phone !== inv.mobile && inv.billing_address.phone !== inv.phone && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">{inv.billing_address.phone} (billing)</Typography>
                      </Stack>
                    )}
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
                    {inv.line_items?.map((li) => (
                      <TableRow key={li.line_item_id} sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{li.name}</Typography>
                          {li.description && (
                            <Typography variant="caption" color="text.secondary">{li.description}</Typography>
                          )}
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
                          <Typography variant="body2" fontWeight={600}>{fmt(li.amount)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            {/* Totals */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Stack spacing={0.75} sx={{ minWidth: 220 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Sub Total</Typography>
                  <Typography variant="body2">{fmt(inv.total - (inv.total - inv.balance > 0 ? 0 : 0))}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={700}>Total</Typography>
                  <Typography variant="body2" fontWeight={700}>{fmt(inv.total ?? 0)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Balance Due</Typography>
                  <Typography variant="body2" fontWeight={700} color={(inv.balance ?? 0) > 0 ? 'error.main' : 'success.main'}>
                    {fmt(inv.balance ?? 0)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Notes / Terms */}
            {(inv.notes || inv.terms) && (
              <>
                <Divider />
                <Box sx={{ display: 'grid', gridTemplateColumns: inv.notes && inv.terms ? '1fr 1fr' : '1fr', gap: 2 }}>
                  {inv.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>Notes</Typography>
                      <Typography variant="body2">{inv.notes}</Typography>
                    </Box>
                  )}
                  {inv.terms && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>Terms</Typography>
                      <Typography variant="body2">{inv.terms}</Typography>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Stack>
        )}
      </Box>

      {/* Sticky footer */}
      {!isLoading && inv && (
        <Box sx={{
          px: 3, py: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper,
        }}>
          {/* Mark as Sent — only for draft invoices */}
          {inv.status === 'draft' && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<MarkEmailReadIcon />}
              disabled={markSentMutation.isPending}
              onClick={() => markSentMutation.mutate()}
              sx={{
                mb: 1.5, py: 1.2, borderRadius: '10px', fontWeight: 700,
                background: 'linear-gradient(135deg,#34C759,#30B350)',
                '&:hover': { background: 'linear-gradient(135deg,#2DB34A,#289A40)' },
              }}
            >
              {markSentMutation.isPending ? 'Marking as Sent…' : 'Mark as Sent'}
            </Button>
          )}

          {/* Payment actions row */}
          {(inv.balance ?? 0) > 0 && (
            <Stack direction="row" spacing={1.5} sx={{ mb: inv.invoice_url ? 1 : 0 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setPaying(true)}
                sx={{ py: 1.2, borderRadius: '10px', fontWeight: 700 }}
              >
                Record Payment
              </Button>

              {inv.invoice_url && (
                <Button
                  variant="contained"
                  fullWidth
                  endIcon={enablePaymentMutation.isPending ? undefined : <OpenInNewIcon />}
                  disabled={enablePaymentMutation.isPending}
                  onClick={async () => {
                    try {
                      const url = await enableInvoicePayment(invoiceId!);
                      window.open(url || inv.invoice_url!, '_blank', 'noopener,noreferrer');
                    } catch {
                      window.open(inv.invoice_url!, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  sx={{
                    py: 1.2,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                    fontWeight: 700,
                  }}
                >
                  {enablePaymentMutation.isPending ? 'Opening…' : 'Pay Online'}
                </Button>
              )}
            </Stack>
          )}

          {/* Enable Zoho Payment link */}
          {(inv.balance ?? 0) > 0 && (
            <Box sx={{ mb: 1 }}>
              {/* Generate button — shown until a URL is available */}
              {!paymentUrl && !inv.invoice_url && (
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={enablePaymentMutation.isPending}
                  onClick={() => enablePaymentMutation.mutate()}
                  sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none',
                    borderColor: '#007AFF', color: '#007AFF',
                    '&:hover': { background: 'rgba(0,122,255,0.06)' } }}
                >
                  {enablePaymentMutation.isPending ? 'Generating…' : '⚡ Generate Payment Link'}
                </Button>
              )}

              {/* Generated / existing payment URL display */}
              {(paymentUrl || inv.invoice_url) && (() => {
                const activeUrl = paymentUrl || inv.invoice_url!;
                return (
                  <Box sx={{ p: 1.5, borderRadius: '10px', border: '1px solid',
                    borderColor: 'success.light', background: 'rgba(52,199,89,0.06)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="caption" fontWeight={700} color="success.main">
                        ✓ Payment Link Ready
                      </Typography>
                      <Button
                        size="small"
                        endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                        href={activeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700,
                          color: '#007AFF', p: '2px 8px' }}
                      >
                        Open
                      </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ wordBreak: 'break-all', display: 'block', mb: 1 }}>
                      {activeUrl}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                        onClick={() => copyLink(activeUrl)}
                        sx={{ flex: 1, borderRadius: '8px', textTransform: 'none', fontSize: '0.78rem' }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<WhatsAppIcon sx={{ fontSize: 14, color: '#25D366' }} />}
                        onClick={() => shareWhatsApp({
                          invoice_number: inv.invoice_number,
                          balance: inv.balance,
                          invoice_url: activeUrl,
                        })}
                        sx={{ flex: 1, borderRadius: '8px', textTransform: 'none', fontSize: '0.78rem',
                          borderColor: '#25D366', color: '#25D366',
                          '&:hover': { borderColor: '#128C7E', background: 'rgba(37,211,102,0.06)' } }}
                      >
                        WhatsApp
                      </Button>
                    </Stack>
                  </Box>
                );
              })()}

              {/* Re-generate if already has URL but want to refresh */}
              {inv.invoice_url && (
                <Button
                  size="small"
                  disabled={enablePaymentMutation.isPending}
                  onClick={() => enablePaymentMutation.mutate()}
                  sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.72rem', color: 'text.secondary' }}
                >
                  {enablePaymentMutation.isPending ? 'Refreshing…' : '↻ Re-enable Zoho Payments'}
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      <RecordPaymentDialog
        invoice={paying && inv ? (inv as unknown as Invoice) : null}
        onClose={() => setPaying(false)}
      />

      <Snackbar
        open={!!toast || copied}
        autoHideDuration={2500}
        onClose={() => { setToast(null); setCopied(false); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={toast ?? 'Payment link copied!'}
      />
    </Drawer>
  );
}
