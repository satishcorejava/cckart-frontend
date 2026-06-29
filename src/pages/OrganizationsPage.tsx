import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Tooltip, IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PageLoader  from '../components/PageLoader';
import ErrorAlert  from '../components/ErrorAlert';
import { fetchOrganizations } from '../api/organizations';

export default function OrganizationsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
    staleTime: 10 * 60 * 1000,
  });

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>Organizations</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configured Zoho organization
      </Typography>

      {error    && <ErrorAlert message={(error as Error).message} onRetry={refetch} />}
      {isLoading && <PageLoader />}

      {!isLoading && !error && (
        <TableContainer component={Paper} sx={{ borderRadius: '14px' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Organization ID', 'Base URL', ''].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((org) => (
                <TableRow key={org.organization_id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {org.organization_id}
                    {org.is_default_org && (
                      <Chip label="default" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                    )}
                  </TableCell>
                  <TableCell>{(org as unknown as { base_url: string }).base_url}</TableCell>
                  <TableCell padding="checkbox">
                    <Tooltip title="Copy org ID">
                      <IconButton size="small" onClick={() => copy(org.organization_id)}>
                        <ContentCopyIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
