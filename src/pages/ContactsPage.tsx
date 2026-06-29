import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Paper, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Snackbar, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import StatusBadge  from '../components/StatusBadge';
import PageLoader   from '../components/PageLoader';
import ErrorAlert   from '../components/ErrorAlert';
import TableToolbar from '../components/TableToolbar';
import { useContacts } from '../hooks/useContacts';
import { deleteContact } from '../api/contacts';
import type { Contact } from '../types';

const fmt = (n: number) =>
  n ? '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—';

const TYPE_OPTIONS = [
  { value: '',         label: 'All'      },
  { value: 'customer', label: 'Customer' },
  { value: 'vendor',   label: 'Vendor'   },
];

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active'   },
  { value: 'inactive', label: 'Inactive' },
];

export default function ContactsPage() {
  const [contactType, setContactType]   = useState('customer');
  const [status,      setStatus]        = useState('active');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [toDelete,    setToDelete]      = useState<Contact | null>(null);
  const [toast,       setToast]         = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useContacts(
    contactType || undefined,
    status      || undefined,
    paginationModel.page + 1,
    paginationModel.pageSize,
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setToast({ msg: 'Contact deleted', sev: 'success' });
      setToDelete(null);
    },
    onError: () => {
      setToast({ msg: 'Failed to delete contact', sev: 'error' });
      setToDelete(null);
    },
  });

  const reset = () => setPaginationModel((m) => ({ ...m, page: 0 }));

  const handleTypeChange = (_: React.MouseEvent<HTMLElement>, v: string | null) => {
    if (v === null) return; setContactType(v); reset();
  };
  const handleStatusChange = (_: React.MouseEvent<HTMLElement>, v: string | null) => {
    if (v === null) return; setStatus(v); reset();
  };

  const columns: GridColDef[] = [
    { field: 'contact_name',  headerName: 'Name',      flex: 1, minWidth: 160 },
    { field: 'company_name',  headerName: 'Company',   flex: 1, minWidth: 160 },
    { field: 'contact_type',  headerName: 'Type',      width: 110,
      valueFormatter: (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—' },
    { field: 'email',         headerName: 'Email',     flex: 1, minWidth: 180 },
    { field: 'phone',         headerName: 'Phone',     width: 140 },
    {
      field: 'outstanding_receivable_amount',
      headerName: 'Receivable',
      width: 130,
      type: 'number',
      valueFormatter: (v: number) => fmt(v),
    },
    {
      field: 'outstanding_payable_amount',
      headerName: 'Payable',
      width: 120,
      type: 'number',
      valueFormatter: (v: number) => fmt(v),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (p) => <StatusBadge status={p.value as string} />,
    },
    {
      field: '_delete',
      headerName: '',
      width: 56,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (p) => (
        <Tooltip title="Delete contact">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setToDelete(p.row as Contact); }}
            sx={{ color: '#FF3B30' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Contacts</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Customers and vendors from Zoho POS
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <ToggleButtonGroup value={contactType} exclusive onChange={handleTypeChange} size="small"
          sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}>
          {TYPE_OPTIONS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <ToggleButtonGroup value={status} exclusive onChange={handleStatusChange} size="small"
          sx={{ '& .MuiToggleButton-root': { borderRadius: '8px !important', textTransform: 'none', fontWeight: 600, px: { xs: 1, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {error    && <ErrorAlert message={(error as Error).message} onRetry={refetch} />}
      {isLoading && <PageLoader />}

      {!isLoading && !error && (
        <Paper sx={{ borderRadius: '14px', overflow: 'hidden', height: { xs: 480, sm: 540, md: 580 } }}>
          <DataGrid
            rows={data?.items ?? []}
            columns={columns}
            getRowId={(r) => r.contact_id}
            pageSizeOptions={[25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            rowCount={data?.total ?? 0}
            disableRowSelectionOnClick
            slots={{ toolbar: TableToolbar }}
            slotProps={{ toolbar: { onRefresh: refetch } }}
            ignoreDiacritics
            sx={{
              border: 'none', height: '100%',
              '& .MuiDataGrid-columnHeaders': { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
              '& .MuiDataGrid-row:hover': { background: 'rgba(0,122,255,0.06)' },
            }}
          />
        </Paper>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Contact</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{toDelete?.contact_name}</strong>
            {toDelete?.company_name ? ` (${toDelete.company_name})` : ''}? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToDelete(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', fontWeight: 700 }}
            disabled={deleteMutation.isPending}
            onClick={() => toDelete && deleteMutation.mutate(toDelete.contact_id)}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.sev} onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
