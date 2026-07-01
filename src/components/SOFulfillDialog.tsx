import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Typography,
  Alert, Divider, CircularProgress, Stepper, Step, StepLabel,
  Box, IconButton,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DeleteIcon    from '@mui/icons-material/Delete';
import type { SalesOrder } from '../types';
import { fulfillSalesOrder, type FulfillmentResult } from '../api/salesorders';

const PAYMENT_MODES = [
  { label: 'UPI',           value: 'upi'          },
  { label: 'Cash',          value: 'cash'         },
  { label: 'Bank Transfer', value: 'banktransfer' },
  { label: 'Credit Card',   value: 'creditcard'   },
  { label: 'Cheque',        value: 'check'        },
  { label: 'Other',         value: 'others'       },
];

const STEPS = ['Invoice', 'Payment', 'Closed'];

const today = () => new Date().toISOString().slice(0, 10);
const fmt   = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

interface Props {
  salesOrder: SalesOrder | null;
  onClose: () => void;
}

export default function SOFulfillDialog({ salesOrder, onClose }: Props) {
  const queryClient = useQueryClient();
  const fileRef     = useRef<HTMLInputElement>(null);

  const [amount,      setAmount]      = useState('');
  const [mode,        setMode]        = useState('upi');
  const [date,        setDate]        = useState(today());
  const [reference,   setReference]   = useState('');
  const [description, setDescription] = useState('');
  const [screenshot,  setScreenshot]  = useState<string | null>(null);
  const [result,      setResult]      = useState<FulfillmentResult | null>(null);

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (req: Parameters<typeof fulfillSalesOrder>[1]) =>
      fulfillSalesOrder(salesOrder!.salesorder_id, req),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['salesorders'] });
      queryClient.invalidateQueries({ queryKey: ['salesorder', salesOrder!.salesorder_id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
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
    setResult(null);
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

  // Auto-populate amount from SO total if user hasn't typed yet
  const effectiveAmount = amount !== '' ? amount : String(salesOrder?.total ?? '');

  const amountNum   = parseFloat(effectiveAmount) || 0;
  const maxAmount   = salesOrder?.total ?? 0;
  const amountError = amountNum <= 0
    ? 'Amount must be greater than zero'
    : amountNum > maxAmount
    ? `Cannot exceed order total of ${fmt(maxAmount)}`
    : '';

  const handleSubmit = () => {
    if (!salesOrder || amountError) return;
    mutate({
      payment_mode:     mode,
      amount:           amountNum,
      date,
      reference_number: reference || undefined,
      description:      description || undefined,
    });
  };

  return (
    <Dialog open={!!salesOrder} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {result ? 'Order Fulfilled' : 'Record Payment & Fulfill Order'}
      </DialogTitle>

      <DialogContent>
        {/* ── Success view ── */}
        {result && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stepper activeStep={3} alternativeLabel>
              {STEPS.map((s) => (
                <Step key={s} completed>
                  <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>{s}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Alert severity="success" sx={{ borderRadius: '10px', mt: 1 }}>
              {result.message}
            </Alert>

            {[
              ['Sales Order', result.salesOrderNumber],
              ['Invoice',     result.invoiceNumber || result.invoiceId],
              ['Payment ID',  result.paymentId],
            ].filter(([, value]) => !!value).map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between"
                sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" fontWeight={600} fontFamily="monospace">{value}</Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {/* ── Form view ── */}
        {!result && salesOrder && (
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {/* SO summary */}
            <Stack direction="row" justifyContent="space-between"
              sx={{ background: 'rgba(0,122,255,0.06)', borderRadius: '10px', p: 1.5 }}>
              <Stack>
                <Typography variant="caption" color="text.secondary">Sales Order</Typography>
                <Typography variant="body2" fontWeight={700}>{salesOrder.salesorder_number}</Typography>
                <Typography variant="caption" color="text.secondary">{salesOrder.customer_name}</Typography>
              </Stack>
              <Stack alignItems="flex-end">
                <Typography variant="caption" color="text.secondary">Order Total</Typography>
                <Typography variant="body1" fontWeight={800} color="primary.main">
                  {fmt(salesOrder.total)}
                </Typography>
                <Typography variant="caption" color="text.secondary">{salesOrder.status}</Typography>
              </Stack>
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Recording payment will automatically: create invoice → apply payment → close order.
            </Typography>

            <Divider />

            <TextField
              label="Payment Amount (₹)"
              type="number"
              value={effectiveAmount}
              onChange={(e) => setAmount(e.target.value)}
              error={!!effectiveAmount && !!amountError}
              helperText={effectiveAmount ? amountError : `Order total: ${fmt(maxAmount)}`}
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
              label="Description (optional)"
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

            {isPending && (
              <Stack direction="row" spacing={1.5} alignItems="center"
                sx={{ background: 'rgba(0,122,255,0.06)', borderRadius: '10px', p: 1.5 }}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Processing: creating invoice → recording payment → closing order…
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={isPending} sx={{ borderRadius: '8px' }}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isPending || !effectiveAmount || !!amountError}
            sx={{
              borderRadius: '8px',
              background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
              minWidth: 160,
            }}
          >
            {isPending
              ? <CircularProgress size={18} color="inherit" />
              : 'Pay & Fulfill Order'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
