import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Stack, InputAdornment, IconButton,
} from '@mui/material';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import VisibilityOffIcon  from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      login(res.token!, res);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400, borderRadius: '20px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 56, height: 56, borderRadius: '16px',
                background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900 }}>C</Typography>
            </Box>
            <Typography variant="h5" fontWeight={800}>CCKart</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <TextField
                label="Password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(v => !v)} edge="end" size="small">
                        {showPass ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.4,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
