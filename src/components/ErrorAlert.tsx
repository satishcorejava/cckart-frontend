import { Alert, Button } from '@mui/material';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorAlert({ message, onRetry }: Props) {
  return (
    <Alert
      severity="error"
      sx={{ borderRadius: '12px' }}
      action={
        onRetry ? (
          <Button color="error" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}
