import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer, Box, Typography, Stack, Button, Divider,
  CircularProgress, IconButton, Chip,
} from '@mui/material';
import CloseIcon       from '@mui/icons-material/Close';
import OpenInNewIcon   from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QRCodeSVG }   from 'qrcode.react';
import { fetchInvoiceDetail } from '../api/invoices';

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAID_STATUSES = new Set(['paid', 'payment_made']);

interface Props {
  open:          boolean;
  invoiceId:     string | null;
  paymentUrl:    string;
  invoiceNumber: string;
  customerName:  string;
  balanceDue:    number;
  onClose:       () => void;
  onPaid:        () => void;
}

export default function PaymentWatcherSheet({
  open, invoiceId, paymentUrl, invoiceNumber, customerName, balanceDue, onClose, onPaid,
}: Props) {
  const [copied,       setCopied]       = useState(false);
  const [paidNotified, setPaidNotified] = useState(false);
  const popupRef      = useRef<Window | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Poll invoice status every 5 s while sheet is open
  const { data: watchData } = useQuery({
    queryKey: ['payment-watch', invoiceId],
    queryFn:  () => fetchInvoiceDetail(invoiceId!),
    enabled:  open && !!invoiceId,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d && (PAID_STATUSES.has(d.status) || d.balance <= 0)) return false; // stop polling
      return 5_000;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Derive paid from latest data
  const isPaid = !!(watchData && (PAID_STATUSES.has(watchData.status) || watchData.balance <= 0));

  // Trigger onPaid + auto-close once when paid is first detected
  useEffect(() => {
    if (isPaid && !paidNotified) {
      setPaidNotified(true);
      onPaid();
      closeTimerRef.current = setTimeout(() => {
        popupRef.current?.close();
        onClose();
      }, 3000);
    }
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, [isPaid, paidNotified]);

  // Reset per invoice open
  useEffect(() => {
    if (open) { setCopied(false); setPaidNotified(false); }
  }, [open, invoiceId]);

  const openPopup = () => {
    popupRef.current = window.open(
      paymentUrl,
      'zoho_payment',
      'width=480,height=700,left=200,top=80,resizable=yes,scrollbars=yes',
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(paymentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '92vh',
          overflow: 'auto',
        },
      }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 4 }}>

        {/* Handle bar */}
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 2.5 }} />

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Collect Payment</Typography>
            <Typography variant="body2" color="text.secondary">{customerName}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', mt: -0.5 }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {isPaid ? (
          /* ── Success state ── */
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 72, color: '#34C759', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Payment Received!</Typography>
            <Typography variant="body2" color="text.secondary">
              {invoiceNumber} has been marked as paid.
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
              Closing in 3 seconds…
            </Typography>
          </Box>
        ) : (
          /* ── Waiting state ── */
          <>
            {/* Amount + invoice ref */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Invoice</Typography>
                <Typography variant="body2" fontWeight={700}>{invoiceNumber}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#FF3B30' }}>
                  {fmt(balanceDue)}
                </Typography>
              </Box>
            </Stack>

            {/* QR Code */}
            {paymentUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box sx={{
                  p: 2, borderRadius: '16px', border: '1px solid',
                  borderColor: 'divider', background: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }}>
                  <QRCodeSVG
                    value={paymentUrl}
                    size={200}
                    level="M"
                    includeMargin={false}
                    style={{ display: 'block' }}
                  />
                </Box>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              Scan with phone to pay via UPI / Card / NetBanking
            </Typography>

            {/* Polling indicator */}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <CircularProgress size={14} thickness={5} sx={{ color: '#007AFF' }} />
              <Typography variant="caption" color="text.secondary">
                Waiting for payment confirmation…
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2.5 }}>
              <Chip label="or" size="small" sx={{ fontSize: '0.72rem' }} />
            </Divider>

            {/* Action buttons */}
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                endIcon={<OpenInNewIcon />}
                onClick={openPopup}
                sx={{
                  py: 1.4, borderRadius: '12px', fontWeight: 700,
                  background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                  fontSize: '0.95rem',
                }}
              >
                Open Payment Page
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<ContentCopyIcon />}
                onClick={copyLink}
                sx={{
                  py: 1.2, borderRadius: '12px', fontWeight: 700,
                  borderColor: copied ? '#34C759' : undefined,
                  color:       copied ? '#34C759' : undefined,
                }}
              >
                {copied ? 'Link Copied!' : 'Copy Payment Link'}
              </Button>
            </Stack>

            <Typography variant="caption" color="text.disabled" textAlign="center" display="block" sx={{ mt: 2 }}>
              This page updates automatically when payment is received.
            </Typography>
          </>
        )}
      </Box>
    </Drawer>
  );
}
