import { Box, CircularProgress, Typography } from '@mui/material';

interface Props { message?: string }

export default function PageLoader({ message = 'Loading...' }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 2 }}>
      <CircularProgress color="primary" size={40} />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );
}
