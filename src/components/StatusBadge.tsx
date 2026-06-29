import { Chip } from '@mui/material';

const STATUS_MAP: Record<string, { label: string; color: 'error' | 'warning' | 'success' | 'default' | 'info' }> = {
  unpaid:          { label: 'Unpaid',         color: 'error'   },
  overdue:         { label: 'Overdue',        color: 'warning' },
  paid:            { label: 'Paid',           color: 'success' },
  partially_paid:  { label: 'Partial',        color: 'info'    },
  draft:           { label: 'Draft',          color: 'default' },
  open:            { label: 'Open',           color: 'info'    },
  confirmed:       { label: 'Confirmed',      color: 'success' },
  void:            { label: 'Void',           color: 'default' },
  closed:          { label: 'Closed',         color: 'default' },
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const cfg = STATUS_MAP[status.toLowerCase()] ?? { label: status, color: 'default' as const };
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size="small"
      sx={{ fontWeight: 600, fontSize: '0.72rem', borderRadius: '8px' }}
    />
  );
}
