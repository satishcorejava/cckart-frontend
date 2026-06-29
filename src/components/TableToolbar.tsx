import { useState } from 'react';
import { InputAdornment, TextField, Tooltip, IconButton } from '@mui/material';
import SearchIcon   from '@mui/icons-material/Search';
import RefreshIcon  from '@mui/icons-material/Refresh';
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  useGridApiContext,
  type GridToolbarProps,
} from '@mui/x-data-grid';

// Extend MUI DataGrid's toolbar slot to accept our custom onRefresh prop
declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    onRefresh?: () => unknown;
  }
}

type Props = GridToolbarProps & { onRefresh?: () => unknown };

export default function TableToolbar({ onRefresh }: Props) {
  const apiRef    = useGridApiContext();
  const [spinning, setSpinning] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    apiRef.current.setQuickFilterValues(
      e.target.value.split(' ').filter(Boolean),
    );
  };

  const handleRefresh = async () => {
    if (!onRefresh || spinning) return;
    setSpinning(true);
    try { await onRefresh(); } finally { setSpinning(false); }
  };

  return (
    <GridToolbarContainer sx={{ px: 1.5, py: 1, gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <TextField
        size="small"
        placeholder="Search…"
        onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          width: 240,
          '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.85rem' },
        }}
      />
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />

      <div style={{ flex: 1 }} />

      {onRefresh && (
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={handleRefresh}
            disabled={spinning}
            sx={{ color: 'text.secondary' }}
          >
            <RefreshIcon
              fontSize="small"
              sx={{
                transition: 'transform 0.6s ease',
                transform: spinning ? 'rotate(360deg)' : 'none',
              }}
            />
          </IconButton>
        </Tooltip>
      )}
    </GridToolbarContainer>
  );
}
