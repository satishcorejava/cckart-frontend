import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer, Box, Typography, Divider, Chip, Stack, Paper,
  IconButton, Skeleton, Alert, Button, TextField, Snackbar,
  useTheme, useMediaQuery,
} from '@mui/material';
import ArrowBackIcon  from '@mui/icons-material/ArrowBack';
import EditIcon       from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchItemDetail, updateItem } from '../api/items';
import StatusBadge from './StatusBadge';

const fmt  = (n: number | undefined | null) =>
  '₹' + (n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtQ = (n: number | undefined | null) => {
  const v = n ?? 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2);
};

interface Props {
  itemId: string | null;
  onClose: () => void;
}

export default function ItemDetailDrawer({ itemId, onClose }: Props) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const queryClient = useQueryClient();

  const [editing,       setEditing]       = useState(false);
  const [sellingPrice,  setSellingPrice]  = useState('');
  const [costPrice,     setCostPrice]     = useState('');
  const [toast,         setToast]         = useState<string | null>(null);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', itemId],
    queryFn:  () => fetchItemDetail(itemId!),
    enabled:  !!itemId,
    staleTime: 60_000,
  });

  const updateMut = useMutation({
    mutationFn: () => updateItem(itemId!, {
      name:          item!.name,
      rate:          parseFloat(sellingPrice),
      purchase_rate: parseFloat(costPrice),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setEditing(false);
      setToast('Prices updated on Zoho');
    },
  });

  const handleEditClick = () => {
    setSellingPrice(String(item?.rate ?? ''));
    setCostPrice(String(item?.purchase_rate ?? ''));
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    updateMut.reset();
  };

  const canSave =
    sellingPrice !== '' && costPrice !== '' &&
    !isNaN(parseFloat(sellingPrice)) && !isNaN(parseFloat(costPrice)) &&
    parseFloat(sellingPrice) >= 0 && parseFloat(costPrice) >= 0;

  const stockColor = (item?.stock_on_hand ?? 0) > 0 ? '#34C759' : '#FF9500';

  return (
    <>
      <Drawer
        anchor="right"
        open={!!itemId}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 500 },
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
              {isLoading ? <Skeleton width={160} /> : (item?.name ?? 'Item')}
            </Typography>
            {!isLoading && item?.sku && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                SKU: {item.sku}
              </Typography>
            )}
          </Box>
          {!isLoading && item && <StatusBadge status={item.status} />}
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
              {[...Array(6)].map((_, i) => <Skeleton key={i} height={36} />)}
            </Stack>
          )}

          {!isLoading && item && (
            <Stack spacing={3}>
              {/* Item info grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[
                  ['Type',    item.item_type || '—'],
                  ['Unit',    item.unit      || '—'],
                  ['Tax',     item.tax_name  || '—'],
                  ['HSN/SAC', item.hsn_or_sac || '—'],
                  ...(item.vendor_name ? [['Vendor', item.vendor_name]] : []),
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Box>
                ))}
              </Box>

              <Divider />

              {/* Prices + Stock */}
              {!editing ? (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={700}>Pricing & Stock</Typography>

                  <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                    {/* Selling Price */}
                    <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: '12px', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Selling Price
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {fmt(item.rate)}
                      </Typography>
                    </Paper>

                    {/* Cost */}
                    <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: '12px', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Cost Price
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="text.primary">
                        {fmt(item.purchase_rate)}
                      </Typography>
                    </Paper>

                    {/* Stock */}
                    <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: '12px', textAlign: 'center',
                      bgcolor: stockColor + '0D', borderColor: stockColor + '44' }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                        Stock on Hand
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: stockColor }}>
                        {fmtQ(item.stock_on_hand)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{item.unit || 'units'}</Typography>
                    </Paper>
                  </Stack>

                  {item.tax_percentage != null && item.tax_percentage > 0 && (
                    <Chip
                      label={`${item.tax_name} ${item.tax_percentage}% included`}
                      size="small"
                      sx={{ alignSelf: 'flex-start', fontSize: '0.72rem' }}
                    />
                  )}
                </Stack>
              ) : (
                /* Edit form */
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={700}>Edit Prices</Typography>

                  {updateMut.isError && (
                    <Alert severity="error" sx={{ borderRadius: '10px' }}>
                      {(updateMut.error as Error).message}
                    </Alert>
                  )}

                  <TextField
                    label="Selling Price (₹)"
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    fullWidth
                    autoFocus
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <TextField
                    label="Cost Price (₹)"
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  <Typography variant="caption" color="text.secondary">
                    Stock on Hand: <strong>{fmtQ(item.stock_on_hand)} {item.unit || 'units'}</strong> (view only — managed via inventory adjustments)
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </Box>

        {/* Footer */}
        {!isLoading && item && (
          <Box sx={{
            px: 3, py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
          }}>
            {!editing ? (
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{
                  py: 1.2, borderRadius: '10px', fontWeight: 700,
                  background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                  '&:hover': { background: 'linear-gradient(135deg,#005FCC,#2090C0)' },
                }}
              >
                Edit Prices
              </Button>
            ) : (
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleCancel}
                  disabled={updateMut.isPending}
                  sx={{ py: 1.2, borderRadius: '10px', fontWeight: 700 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={updateMut.isSuccess ? <CheckCircleIcon /> : undefined}
                  disabled={!canSave || updateMut.isPending}
                  onClick={() => updateMut.mutate()}
                  sx={{
                    py: 1.2, borderRadius: '10px', fontWeight: 700,
                    background: 'linear-gradient(135deg,#34C759,#30B94E)',
                    '&:hover': { background: 'linear-gradient(135deg,#28A745,#239B3F)' },
                    '&.Mui-disabled': { opacity: 0.7, color: '#fff' },
                  }}
                >
                  {updateMut.isPending ? 'Saving…' : 'Save to Zoho'}
                </Button>
              </Stack>
            )}
          </Box>
        )}
      </Drawer>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={toast}
      />
    </>
  );
}
