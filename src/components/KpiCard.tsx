import { Paper, Typography, Box } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface Props {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  Icon: SvgIconComponent;
}

export default function KpiCard({ title, value, subtitle, color = '#007AFF', Icon }: Props) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          background: color,
          borderRadius: '14px 14px 0 0',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 40, height: 40, borderRadius: '10px',
            background: `${color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon sx={{ color, fontSize: 20 }} />
        </Box>
      </Box>
      <Typography
        variant="h5"
        sx={{ mt: 1.5, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}
