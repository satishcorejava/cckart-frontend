import { useState, useEffect } from 'react';
import { Snackbar, Button, Box, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: 1, sm: 2 } }}
      message={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DownloadIcon fontSize="small" />
          <Typography variant="body2" fontWeight={600}>Install CCKart as an app</Typography>
        </Box>
      }
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" color="inherit" onClick={() => setOpen(false)}>Later</Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleInstall}
            sx={{ background: 'linear-gradient(135deg,#007AFF,#32ADE6)', borderRadius: '6px' }}
          >
            Install
          </Button>
        </Box>
      }
    />
  );
}
