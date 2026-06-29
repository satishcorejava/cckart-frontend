import { createTheme } from '@mui/material/styles';

const BASE_FONT = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"SF Pro Display"',
  '"SF Pro Text"',
  '"Inter"',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:   { main: '#007AFF' },
    secondary: { main: '#AF52DE' },
    error:     { main: '#FF3B30' },
    warning:   { main: '#FF9500' },
    success:   { main: '#34C759' },
    info:      { main: '#32ADE6' },
    background: {
      default: '#000000',
      paper:   '#1C1C1E',
    },
    text: {
      primary:   '#FFFFFF',
      secondary: '#98989E',
    },
    divider: '#38383A',
  },
  typography: {
    fontFamily: BASE_FONT,
    fontWeightLight:   300,
    fontWeightRegular: 400,
    fontWeightMedium:  500,
    fontWeightBold:    700,
    h4: { fontWeight: 800, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.015em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #38383A',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#007AFF' },
    secondary: { main: '#AF52DE' },
    error:     { main: '#FF3B30' },
    warning:   { main: '#FF9500' },
    success:   { main: '#34C759' },
    info:      { main: '#32ADE6' },
    background: {
      default: '#F2F2F7',
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#000000',
      secondary: '#6C6C70',
    },
    divider: '#C6C6C8',
  },
  typography: darkTheme.typography,
  shape: darkTheme.shape,
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #C6C6C8',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: darkTheme.components?.MuiButton,
    MuiChip:   darkTheme.components?.MuiChip,
  },
});
