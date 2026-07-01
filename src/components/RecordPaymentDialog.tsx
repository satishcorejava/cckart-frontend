import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Typography,
  Alert, Divider, CircularProgress, Box, IconButton,
} from '@mui/material';
import CameraAltIcon  from '@mui/icons-material/CameraAlt';
import DeleteIcon      from '@mui/icons-material/Delete';
import type { Invoice } from '../types';
import { recordPayment } from '../api/payments';

const PAYMENT_MODES = [
  { label: 'Cash',          value: 'cash'         },
  { label: 'Check',         value: 'check'        },
  { label: 'Bank Transfer', value: 'banktransfer' },
  { label: 'Credit Card',   value: 'creditcard'   },
  { label: 'UPI',           value: 'upi'          },
  { label: 'Other',         value: 'others'       },
];

const today = () => new Date().toISOString().slice(0, 10);
const fmt   = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
}

export default function RecordPaymentDialog({ invoice, onClose }: Props) {
  const queryClient = useQueryClient();
  const fileRef     = useRef<HTMLInputElement>(null);

  const [amount,      setAmount]      = useState('');
  const [mode,        setMode]        = useState('upi');
  const [date,        setDate]        = useState(today());
  const [reference,   setReference]   = useState('');
  const [description, setDescription] = useState('');
  const [screenshot,  setScreenshot]  = useState<string | null>(null);

  // Pre-populate amount when invoice changes
  const effectiveAmount = amount !== '' ? amount : String(invoice?.balance ?? '');

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: recordPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice?.invoice_id] });
      handleClose();
    },
  });

  const handleClose = () => {
    reset();
    setAmount('');
    setMode('upi');
    setDate(today());
    setReference('');
    setDescription('');
    setScreenshot(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const amountNum   = parseFloat(effectiveAmount) || 0;
  const maxAmount   = invoice?.balance ?? 0;
  const amountError = amountNum <= 0
    ? 'Amount must be greater than zero'
    : amountNum > maxAmount
    ? `Cannot exceed balance due of ${fmt(maxAmount)}`
    : '';

  const handleSubmit = () => {
    if (!invoice || amountError) return;
    mutate({
      customer_id:      invoice.customer_id,
      payment_mode:     mode,
      amount:           amountNum,
      date,
      reference_number: reference || undefined,
      description:      description || undefined,
      invoices: [{ invoice_id: invoice.invoice_id, amount_applied: amountNum }],
    });
  };

  return (
    <Dialog open={!!invoice} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Record Payment</DialogTitle>

      <DialogContent>
        {invoice && (
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Invoice summary */}
            <Stack direction="row" justifyContent="space-between"
              sx={{ background: 'rgba(0,122,255,0.06)', borderRadius: '10px', p: 1.5 }}>
              <Stack>
                <Typography variant="caption" color="text.secondary">Invoice</Typography>
                <Typography variant="body2" fontWeight={700}>{invoice.invoice_number}</Typography>
                <Typography variant="caption" color="text.secondary">{invoice.customer_name}</Typography>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                <Typography variant="body1" fontWeight={800} color="error.main">
                  {fmt(invoice.balance)}
                </Typography>
                <Typography variant="caption" color="text.secondary">Due {invoice.due_date}</Typography>
              </Stack>
            </Stack>

            <Divider />

            <TextField
              label="Payment Amount (₹)"
              type="number"
              value={effectiveAmount}
              onChange={(e) => setAmount(e.target.value)}
              error={!!effectiveAmount && !!amountError}
              helperText={effectiveAmount ? amountError : `Balance due: ${fmt(maxAmount)}`}
              inputProps={{ min: 0.01, max: maxAmount, step: 0.01 }}
              fullWidth
              required
              autoFocus
            />

            <TextField
              select
              label="Payment Mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              fullWidth
            >
              {PAYMENT_MODES.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Payment Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Reference Number"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              fullWidth
              placeholder="Cheque no., UTR, transaction ID…"
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            {/* Payment screenshot */}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
                Payment Screenshot (optional)
              </Typography>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              {screenshot ? (
                <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                  <Box
                    component="img"
                    src={screenshot}
                    alt="Payment screenshot"
                    sx={{
                      width: '100%', maxHeight: 220, objectFit: 'contain',
                      borderRadius: '10px', border: '1px solid',
                      borderColor: 'divider', display: 'block',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setScreenshot(null)}
                    sx={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      '&:hover': { background: 'rgba(0,0,0,0.75)' },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<CameraAltIcon />}
                  onClick={() => fileRef.current?.click()}
                  fullWidth
                  sx={{ borderRadius: '10px', borderStyle: 'dashed', py: 1.5, textTransform: 'none' }}
                >
                  Upload / Take Photo
                </Button>
              )}
            </Box>

            {error && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {(error as Error).message}
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={isPending} sx={{ borderRadius: '8px' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending || !effectiveAmount || !!amountError}
          sx={{
            borderRadius: '8px',
            background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
            minWidth: 140,
          }}
        >
          {isPending ? <CircularProgress size={18} color="inherit" /> : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
