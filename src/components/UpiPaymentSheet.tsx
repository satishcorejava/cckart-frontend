import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Drawer, Box, Typography, Stack, Button, Divider,
  CircularProgress, IconButton, Chip, LinearProgress,
} from '@mui/material';
import CloseIcon        from '@mui/icons-material/Close';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import ContentCopyIcon  from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { createUpiSession, fetchUpiPaymentStatus } from '../api/upiPayment';
import { closeLinkedSalesOrders } from '../api/invoices';
import type { InvoiceDetail } from '../types';

const fmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TERMINAL = new Set(['succeeded', 'failed', 'canceled']);
const POLL_INTERVAL_MS = 5_000;
const SESSION_SECONDS  = 900; // 15 min

interface Props {
  open:    boolean;
  inv:     InvoiceDetail | null;
  onClose: () => void;
  onPaid:  () => void;
}

export default function UpiPaymentSheet({ open, inv, onClose, onPaid }: Props) {
  const queryClient = useQueryClient();

  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [qrImage,      setQrImage]      = useState<string | null>(null);
  const [upiString,    setUpiString]    = useState<string | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [createError,  setCreateError]  = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [secondsLeft,  setSecondsLeft]  = useState(SESSION_SECONDS);
  const [paidNotified, setPaidNotified] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Start session when drawer opens ────────────────────────────────────────
  useEffect(() => {
    if (!open || !inv) return;
    let cancelled = false;

    // Reset state
    setSessionId(null);
    setQrImage(null);
    setUpiString(null);
    setCreateError(null);
    setCopied(false);
    setSecondsLeft(SESSION_SECONDS);
    setPaidNotified(false);

    setLoading(true);
    createUpiSession({
      invoice_id:     inv.invoice_id,
      invoice_number: inv.invoice_number,
      customer_id:    inv.customer_id,
      amount:         inv.balance,
    })
      .then((data) => {
        if (cancelled) return;
        setSessionId(data.session_id);
        setQrImage(data.qr_image);
        setUpiString(data.upi_string);
        setSecondsLeft(data.expires_in);
      })
      .catch((err) => {
        if (cancelled) return;
        setCreateError(err?.response?.data?.message ?? err?.message ?? 'Failed to create session');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, inv?.invoice_id]);

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !sessionId) return;
    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [open, sessionId]);

  // ── Poll payment status ────────────────────────────────────────────────────
  const { data: statusData } = useQuery({
    queryKey: ['upi-status', sessionId],
    queryFn:  () => fetchUpiPaymentStatus(sessionId!),
    enabled:  open && !!sessionId && secondsLeft > 0,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (s && TERMINAL.has(s)) return false;
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  const status     = statusData?.status ?? 'initiated';
  const isSucceeded = status === 'succeeded';
  const isFailed    = status === 'failed' || status === 'canceled';
  const isExpired   = secondsLeft <= 0 && !isSucceeded;

  // ── Handle success ─────────────────────────────────────────────────────────
  const handlePaid = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['invoice', inv?.invoice_id] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['salesorders'] });
    if (inv?.invoice_id) closeLinkedSalesOrders(inv.invoice_id).catch(() => {});
    onPaid();
  }, [inv?.invoice_id, onPaid, queryClient]);

  useEffect(() => {
    if (isSucceeded && !paidNotified) {
      setPaidNotified(true);
      handlePaid();
      closeTimerRef.current = setTimeout(onClose, 3500);
    }
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, [isSucceeded, paidNotified]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const copyUpi = () => {
    if (!upiString) return;
    navigator.clipboard.writeText(upiString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const mmSs = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const progress = (secondsLeft / SESSION_SECONDS) * 100;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '94vh',
          overflow: 'auto',
        },
      }}
    >
      <Box sx={{ px: 3, pt: 2.5, pb: 5 }}>

        {/* Handle */}
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mb: 2.5 }} />

        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>Pay via UPI</Typography>
            <Typography variant="body2" color="text.secondary">{inv?.customer_name}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', mt: -0.5 }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Loading state ── */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={48} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Generating UPI QR code…
            </Typography>
          </Box>
        )}

        {/* ── Error state ── */}
        {!loading && createError && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main', mb: 1.5 }} />
            <Typography variant="h6" fontWeight={700} color="error">Session Error</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{createError}</Typography>
            <Button variant="outlined" sx={{ mt: 3 }} onClick={onClose}>Close</Button>
          </Box>
        )}

        {/* ── Success state ── */}
        {!loading && !createError && isSucceeded && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: '#34C759', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Payment Received!</Typography>
            <Typography variant="body2" color="text.secondary">
              {inv?.invoice_number} — {fmt(statusData?.amount ?? 0)}
            </Typography>
            {statusData?.upi_id && (
              <Chip label={statusData.upi_id} size="small" sx={{ mt: 1.5, fontWeight: 600 }} />
            )}
            {statusData?.transaction_reference_number && (
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
                UTR: {statusData.transaction_reference_number}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
              Closing in 3 seconds…
            </Typography>
          </Box>
        )}

        {/* ── Failed / canceled state ── */}
        {!loading && !createError && isFailed && !isSucceeded && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorOutlineIcon sx={{ fontSize: 72, color: 'error.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>Payment {status}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              The UPI transaction was not completed.
            </Typography>
            <Button variant="outlined" sx={{ mt: 3 }} onClick={onClose}>Close</Button>
          </Box>
        )}

        {/* ── Expired state ── */}
        {!loading && !createError && isExpired && !isSucceeded && !isFailed && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorOutlineIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>Session Expired</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              The QR code has expired. Close and re-open to generate a new one.
            </Typography>
            <Button variant="outlined" sx={{ mt: 3 }} onClick={onClose}>Close</Button>
          </Box>
        )}

        {/* ── Active QR state ── */}
        {!loading && !createError && !isSucceeded && !isFailed && !isExpired && qrImage && (
          <>
            {/* Amount row */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Invoice</Typography>
                <Typography variant="body2" fontWeight={700}>{inv?.invoice_number}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Amount Due</Typography>
                <Typography variant="h6" fontWeight={800} color="error.main">
                  {fmt(inv?.balance ?? 0)}
                </Typography>
              </Box>
            </Stack>

            {/* QR image from backend (base64 PNG) */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
              <Box sx={{
                p: 2, borderRadius: '16px', border: '2px solid',
                borderColor: 'primary.light', background: '#fff',
                boxShadow: '0 4px 20px rgba(0,122,255,0.12)',
              }}>
                <img src={qrImage} alt="UPI QR Code" width={220} height={220} style={{ display: 'block' }} />
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 1 }}>
              Scan with any UPI app — PhonePe, GPay, Paytm, BHIM
            </Typography>

            {/* Countdown */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Session expires in</Typography>
                <Typography variant="caption" fontWeight={700}
                  color={secondsLeft < 60 ? 'error' : 'text.primary'}>{mmSs}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4, borderRadius: 2,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: secondsLeft < 60 ? 'error.main' : 'primary.main',
                  },
                }}
              />
            </Box>

            {/* Polling indicator */}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mb: 3 }}>
              <CircularProgress size={14} thickness={5} sx={{ color: '#007AFF' }} />
              <Typography variant="caption" color="text.secondary">
                Waiting for payment confirmation…
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2 }}>
              <Chip label="or" size="small" sx={{ fontSize: '0.72rem' }} />
            </Divider>

            {/* Copy UPI string */}
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ContentCopyIcon />}
              onClick={copyUpi}
              sx={{
                py: 1.2, borderRadius: '12px', fontWeight: 700,
                borderColor: copied ? '#34C759' : undefined,
                color:       copied ? '#34C759' : undefined,
              }}
            >
              {copied ? 'Copied!' : 'Copy UPI String'}
            </Button>

            <Typography variant="caption" color="text.disabled" textAlign="center" display="block" sx={{ mt: 2 }}>
              Page auto-updates every 5 seconds when payment is received.
            </Typography>
          </>
        )}
      </Box>
    </Drawer>
  );
}
