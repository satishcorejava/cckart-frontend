import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, Box, InputBase, List, ListItem, ListItemButton,
  ListItemText, ListItemIcon, Typography, Divider, useTheme,
} from '@mui/material';
import ReceiptIcon      from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon       from '@mui/icons-material/People';
import SearchIcon       from '@mui/icons-material/Search';
import { useQuery }     from '@tanstack/react-query';
import { fetchAllInvoices }  from '../api/invoices';
import { fetchSalesOrders }  from '../api/salesorders';
import { fetchContacts }     from '../api/contacts';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const theme    = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const trimmed = q.trim();

  const { data: invoiceData } = useQuery({
    queryKey: ['cmd-invoices', trimmed],
    queryFn:  () => fetchAllInvoices(undefined, undefined, undefined, trimmed, 1, 5),
    enabled:  open && trimmed.length > 1,
    staleTime: 30_000,
  });

  const { data: soData } = useQuery({
    queryKey: ['cmd-sos', trimmed],
    queryFn:  () => fetchSalesOrders(undefined, undefined, undefined, 1, 5),
    enabled:  open && trimmed.length > 1,
    staleTime: 30_000,
  });

  const { data: contactData } = useQuery({
    queryKey: ['cmd-contacts', trimmed],
    queryFn:  () => fetchContacts(undefined, undefined, 1, 10),
    enabled:  open && trimmed.length > 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) setQ('');
  }, [open]);

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const invoices  = invoiceData?.items ?? [];
  const allSos    = soData?.items ?? [];
  const allCnts   = contactData?.items ?? [];

  const lq = trimmed.toLowerCase();
  const sos      = allSos.filter((s: any) =>
    s.salesorder_number?.toLowerCase().includes(lq) ||
    s.customer_name?.toLowerCase().includes(lq)
  ).slice(0, 5);
  const contacts = allCnts.filter((c: any) =>
    c.contact_name?.toLowerCase().includes(lq) ||
    c.email?.toLowerCase().includes(lq) ||
    c.phone?.toLowerCase().includes(lq)
  ).slice(0, 5);

  const hasResults = invoices.length > 0 || sos.length > 0 || contacts.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
          mt: '10vh',
          alignSelf: 'flex-start',
        },
      }}
      slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1 }}>
        <SearchIcon sx={{ color: 'text.secondary', flexShrink: 0 }} />
        <InputBase
          autoFocus
          fullWidth
          placeholder="Search invoices, orders, contacts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ fontSize: '1rem' }}
        />
        <Typography variant="caption" sx={{
          px: 0.8, py: 0.2, borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          color: 'text.secondary', flexShrink: 0,
        }}>
          Esc
        </Typography>
      </Box>

      {trimmed.length > 1 && (
        <>
          <Divider />
          <List dense sx={{ maxHeight: 380, overflow: 'auto', py: 0.5 }}>
            {invoices.length > 0 && (
              <>
                <ListItem sx={{ py: 0.25 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Invoices
                  </Typography>
                </ListItem>
                {invoices.map((inv: any) => (
                  <ListItem key={inv.invoice_id} disablePadding>
                    <ListItemButton onClick={() => go(`/invoices?id=${inv.invoice_id}`)} sx={{ borderRadius: 1, mx: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}><ReceiptIcon fontSize="small" color="action" /></ListItemIcon>
                      <ListItemText
                        primary={inv.invoice_number}
                        secondary={`${inv.customer_name} · ₹${inv.total?.toLocaleString('en-IN')}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            )}

            {sos.length > 0 && (
              <>
                <ListItem sx={{ py: 0.25 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Sales Orders
                  </Typography>
                </ListItem>
                {sos.map((so: any) => (
                  <ListItem key={so.salesorder_id} disablePadding>
                    <ListItemButton onClick={() => go(`/salesorders?id=${so.salesorder_id}`)} sx={{ borderRadius: 1, mx: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}><ShoppingCartIcon fontSize="small" color="action" /></ListItemIcon>
                      <ListItemText
                        primary={so.salesorder_number}
                        secondary={`${so.customer_name} · ₹${so.total?.toLocaleString('en-IN')}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            )}

            {contacts.length > 0 && (
              <>
                <ListItem sx={{ py: 0.25 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Contacts
                  </Typography>
                </ListItem>
                {contacts.map((c: any) => (
                  <ListItem key={c.contact_id} disablePadding>
                    <ListItemButton onClick={() => go(`/contacts`)} sx={{ borderRadius: 1, mx: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}><PeopleIcon fontSize="small" color="action" /></ListItemIcon>
                      <ListItemText
                        primary={c.contact_name}
                        secondary={c.email || c.phone}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            )}

            {!hasResults && (
              <ListItem>
                <Typography variant="body2" color="text.secondary">No results found for "{trimmed}"</Typography>
              </ListItem>
            )}
          </List>
        </>
      )}

      {trimmed.length <= 1 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Type at least 2 characters to search across invoices, sales orders, and contacts.
            </Typography>
          </Box>
        </>
      )}
    </Dialog>
  );
}
