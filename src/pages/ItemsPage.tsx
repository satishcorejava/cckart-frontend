import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup,
  TextField, InputAdornment, Paper, useTheme, useMediaQuery,
  Card, CardContent, Stack, Chip, Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import StatusBadge  from '../components/StatusBadge';
import PageLoader   from '../components/PageLoader';
import ErrorAlert   from '../components/ErrorAlert';
import TableToolbar from '../components/TableToolbar';
import { useItems } from '../hooks/useItems';
import type { Item } from '../types';

const fmt = (n: number) =>
  n != null ? '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

const COLUMNS: GridColDef[] = [
  { field: 'name',          headerName: 'Name',       flex: 1, minWidth: 180 },
  { field: 'sku',           headerName: 'SKU',        width: 130 },
  { field: 'item_type',     headerName: 'Type',       width: 110 },
  { field: 'unit',          headerName: 'Unit',       width: 90 },
  { field: 'rate',          headerName: 'Sale Price', width: 130, type: 'number', valueFormatter: (v: number) => fmt(v) },
  { field: 'purchase_rate', headerName: 'Cost',       width: 120, type: 'number', valueFormatter: (v: number) => fmt(v) },
  { field: 'stock_on_hand', headerName: 'Stock',      width: 110, type: 'number', valueFormatter: (v: number) => (v != null ? v.toLocaleString('en-IN') : '—') },
  { field: 'tax_name',      headerName: 'Tax',        width: 130 },
  { field: 'hsn_or_sac',   headerName: 'HSN/SAC',    width: 120 },
  { field: 'status',        headerName: 'Status',     width: 110, renderCell: (p) => <StatusBadge status={p.value as string} /> },
];

const STATUS_OPTIONS = [
  { value: '',         label: 'All'      },
  { value: 'active',   label: 'Active'   },
  { value: 'inactive', label: 'Inactive' },
];

function ItemCard({ item }: { item: Item }) {
  const stockColor = item.stock_on_hand > 0 ? '#34C759' : '#FF9500';
  return (
    <Card variant="outlined" sx={{ borderRadius: '12px', mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          {/* Left */}
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{item.name}</Typography>
              <StatusBadge status={item.status} />
            </Stack>
            {item.sku && (
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {item.sku}{item.item_type ? ` · ${item.item_type}` : ''}
              </Typography>
            )}
            <Typography variant="caption" color="text.disabled" display="block">
              {[item.unit, item.tax_name].filter(Boolean).join(' · ') || '—'}
            </Typography>
          </Box>

          {/* Right */}
          <Stack alignItems="flex-end" spacing={0.5} sx={{ ml: 1.5, flexShrink: 0 }}>
            <Typography variant="body1" fontWeight={800}>{fmt(item.rate)}</Typography>
            {item.purchase_rate > 0 && (
              <Typography variant="caption" color="text.secondary">
                Cost {fmt(item.purchase_rate)}
              </Typography>
            )}
            <Chip
              label={`${item.stock_on_hand ?? 0} in stock`}
              size="small"
              sx={{
                height: 20, fontSize: '0.68rem', fontWeight: 600,
                bgcolor: stockColor + '22', color: stockColor,
                border: `1px solid ${stockColor}44`,
              }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ItemsPage() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [status,  setStatus]  = useState('active');
  const [search,  setSearch]  = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const { data, isLoading, error, refetch } = useItems(
    status || undefined,
    search || undefined,
    paginationModel.page + 1,
    paginationModel.pageSize,
  );

  const handleStatusChange = (_: React.MouseEvent<HTMLElement>, v: string | null) => {
    if (v === null) return;
    setStatus(v);
    setPaginationModel((m) => ({ ...m, page: 0 }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPaginationModel((m) => ({ ...m, page: 0 }));
  };

  const totalPages = Math.ceil((data?.total ?? 0) / paginationModel.pageSize);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Items</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Products and services from Zoho POS
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <ToggleButtonGroup
          value={status}
          exclusive
          onChange={handleStatusChange}
          size="small"
          sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, px: 2 } }}
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <TextField
          size="small"
          placeholder="Search by name…"
          value={search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 240, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />
      </Box>

      {error     && <ErrorAlert message={(error as Error).message} onRetry={refetch} />}
      {isLoading && <PageLoader />}

      {!isLoading && !error && (
        <>
          {/* ── Mobile: card list ── */}
          {isMobile ? (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                {data?.total ?? 0} item{(data?.total ?? 0) !== 1 ? 's' : ''}
              </Typography>

              {(data?.items ?? []).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">No items found</Typography>
                </Box>
              ) : (
                (data?.items ?? []).map((item) => (
                  <ItemCard key={item.item_id} item={item} />
                ))
              )}

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={paginationModel.page + 1}
                    onChange={(_, p) => setPaginationModel((m) => ({ ...m, page: p - 1 }))}
                    color="primary"
                    size="small"
                  />
                </Box>
              )}
            </Box>
          ) : (
            /* ── Desktop: DataGrid ── */
            <Paper sx={{ borderRadius: '14px', overflow: 'hidden', height: 600 }}>
              <DataGrid
                rows={data?.items ?? []}
                columns={COLUMNS}
                getRowId={(r) => r.item_id}
                pageSizeOptions={[25, 50]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                paginationMode="server"
                rowCount={data?.total ?? 0}
                disableRowSelectionOnClick
                slots={{ toolbar: TableToolbar }}
                ignoreDiacritics
                sx={{
                  border: 'none', height: '100%',
                  '& .MuiDataGrid-columnHeaders': { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
                  '& .MuiDataGrid-row:hover': { background: 'rgba(0,122,255,0.06)' },
                }}
              />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
