import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, Paper, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Snackbar, Alert, Stack, Card, CardContent, Pagination, Avatar, Chip, useTheme,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon    from '@mui/icons-material/Delete';
import PhoneIcon     from '@mui/icons-material/Phone';
import EmailIcon     from '@mui/icons-material/Email';
import RefreshIcon   from '@mui/icons-material/Refresh';
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

const TOGGLE_SX = {
  '& .MuiToggleButton-root': {
    borderRadius: '8px !important', textTransform: 'none', fontWeight: 600,
    px: { xs: 1, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' },
  },
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = ['#007AFF', '#32ADE6', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];
  return colors[name.charCodeAt(0) % colors.length];
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function ContactCard({ contact, onDelete }: { contact: Contact; onDelete: (c: Contact) => void }) {
  const receivable = contact.outstanding_receivable_amount;
  const payable    = contact.outstanding_payable_amount;

  return (
    <Card variant="outlined" sx={{ borderRadius: '12px', mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {/* Avatar */}
          <Avatar sx={{ width: 40, height: 40, fontSize: '0.85rem', fontWeight: 700,
            bgcolor: avatarColor(contact.contact_name), flexShrink: 0 }}>
            {initials(contact.contact_name)}
          </Avatar>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{contact.contact_name}</Typography>
              <StatusBadge status={contact.status} />
            </Stack>

            {contact.company_name && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {contact.company_name}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
              {contact.contact_type && (
                <Chip label={contact.contact_type} size="small"
                  sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} />
              )}
              {contact.phone && (
                <Stack direction="row" spacing={0.25} alignItems="center">
                  <PhoneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">{contact.phone}</Typography>
                </Stack>
              )}
            </Stack>

            {contact.email && (
              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ mt: 0.25 }}>
                <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" noWrap>{contact.email}</Typography>
              </Stack>
            )}

            {(receivable > 0 || payable > 0) && (
              <Stack direction="row" spacing={1.5} sx={{ mt: 0.75 }}>
                {receivable > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.disabled" display="block">Receivable</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#FF3B30' }}>{fmt(receivable)}</Typography>
                  </Box>
                )}
                {payable > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.disabled" display="block">Payable</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#FF9500' }}>{fmt(payable)}</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Box>

          {/* Delete */}
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(contact)} sx={{ color: '#FF3B30', flexShrink: 0 }}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ContactsPage() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const totalPages = Math.ceil((data?.total ?? 0) / paginationModel.pageSize);

  const columns: GridColDef[] = [
    { field: 'contact_name',  headerName: 'Name',      flex: 1, minWidth: 160 },
    { field: 'company_name',  headerName: 'Company',   flex: 1, minWidth: 160 },
    { field: 'contact_type',  headerName: 'Type',      width: 110,
      valueFormatter: (v: string) => v ? v.charAt(0).toUpperCase() + v.slice(1) : '—' },
    { field: 'email',         headerName: 'Email',     flex: 1, minWidth: 180 },
    { field: 'phone',         headerName: 'Phone',     width: 140 },
    { field: 'outstanding_receivable_amount', headerName: 'Receivable', width: 130,
      type: 'number', valueFormatter: (v: number) => fmt(v) },
    { field: 'outstanding_payable_amount',    headerName: 'Payable',    width: 120,
      type: 'number', valueFormatter: (v: number) => fmt(v) },
    { field: 'status', headerName: 'Status', width: 110,
      renderCell: (p) => <StatusBadge status={p.value as string} /> },
    {
      field: '_delete', headerName: '', width: 56, sortable: false, disableColumnMenu: true,
      renderCell: (p) => (
        <Tooltip title="Delete contact">
          <IconButton size="small"
            onClick={(e) => { e.stopPropagation(); setToDelete(p.row as Contact); }}
            sx={{ color: '#FF3B30' }}>
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
        <ToggleButtonGroup value={contactType} exclusive onChange={handleTypeChange} size="small" sx={TOGGLE_SX}>
          {TYPE_OPTIONS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup value={status} exclusive onChange={handleStatusChange} size="small" sx={TOGGLE_SX}>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <ToggleButton key={value} value={value}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {error     && <ErrorAlert message={(error as Error).message} onRetry={refetch} />}
      {isLoading && <PageLoader />}

      {!isLoading && !error && (
        <>
          {isMobile ? (
            /* ── Mobile: card list ── */
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {data?.total ?? 0} contact{(data?.total ?? 0) !== 1 ? 's' : ''}
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={() => refetch()} sx={{ color: 'text.secondary' }}>
                    <RefreshIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>

              {(data?.items ?? []).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">No contacts found</Typography>
                </Box>
              ) : (
                (data?.items ?? []).map((c) => (
                  <ContactCard key={c.contact_id} contact={c} onDelete={setToDelete} />
                ))
              )}

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={paginationModel.page + 1}
                    onChange={(_, p) => setPaginationModel((m) => ({ ...m, page: p - 1 }))}
                    size="small"
                    color="primary"
                  />
                </Box>
              )}
            </Box>
          ) : (
            /* ── Desktop: DataGrid ── */
            <Paper sx={{ borderRadius: '14px', overflow: 'hidden', height: { sm: 540, md: 580 } }}>
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
        </>
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
          <Button variant="contained" color="error" sx={{ textTransform: 'none', fontWeight: 700 }}
            disabled={deleteMutation.isPending}
            onClick={() => toDelete && deleteMutation.mutate(toDelete.contact_id)}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev} onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
