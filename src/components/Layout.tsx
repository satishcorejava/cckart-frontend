import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar, Avatar, Box, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
  useTheme, useMediaQuery,
} from '@mui/material';
import DashboardIcon    from '@mui/icons-material/Dashboard';
import ReceiptIcon      from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BusinessIcon     from '@mui/icons-material/Business';
import PeopleIcon       from '@mui/icons-material/People';
import InventoryIcon    from '@mui/icons-material/Inventory2';
import LinkIcon         from '@mui/icons-material/Link';
import Brightness4Icon  from '@mui/icons-material/Brightness4';
import Brightness7Icon  from '@mui/icons-material/Brightness7';
import LogoutIcon       from '@mui/icons-material/Logout';
import MenuIcon         from '@mui/icons-material/Menu';
import { useAuth }      from '../context/AuthContext';

const DRAWER_WIDTH = 220;

const NAV = [
  { label: 'Dashboard',     path: '/',               Icon: DashboardIcon    },
  { label: 'Invoices',      path: '/invoices',       Icon: ReceiptIcon      },
  { label: 'Sales Orders',  path: '/salesorders',    Icon: ShoppingCartIcon },
  { label: 'Contacts',      path: '/contacts',       Icon: PeopleIcon       },
  { label: 'Items',         path: '/items',          Icon: InventoryIcon    },
  { label: 'SO Invoices',   path: '/so-invoices',    Icon: LinkIcon         },
  { label: 'Organizations', path: '/organizations',  Icon: BusinessIcon     },
];

interface Props {
  children: React.ReactNode;
  onToggleTheme: () => void;
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <List dense sx={{ px: 1 }}>
      {NAV.map(({ label, path, Icon }) => {
        const active = location.pathname === path;
        return (
          <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={path}
              selected={active}
              onClick={onNavigate}
              sx={{
                borderRadius: '10px',
                borderLeft: active ? '3px solid #007AFF' : '3px solid transparent',
                '&.Mui-selected': {
                  background: 'rgba(0,122,255,0.10)',
                  color: '#007AFF',
                  '& .MuiListItemIcon-root': { color: '#007AFF' },
                },
                '&.Mui-selected:hover': { background: 'rgba(0,122,255,0.14)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}

export default function Layout({ children, onToggleTheme }: Props) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const drawerContent = (
    <Box sx={{ pt: isMobile ? 2 : 8, height: '100%', overflow: 'auto' }}>
      {isMobile && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: '8px',
            background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#fff', fontSize: '0.8rem',
          }}>C</Box>
          <Typography variant="subtitle1" fontWeight={700}>
            CC<span style={{ color: '#32ADE6' }}>Kart</span>
          </Typography>
        </Box>
      )}
      <NavList onNavigate={isMobile ? () => setMobileOpen(false) : undefined} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          background: theme.palette.mode === 'dark'
            ? 'rgba(0,0,0,0.85)'
            : 'rgba(242,242,247,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ color: theme.palette.text.primary, mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {!isMobile && (
            <Box sx={{
              width: 34, height: 34, borderRadius: '10px',
              background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#fff', fontSize: '0.9rem', flexShrink: 0,
            }}>C</Box>
          )}

          <Typography
            variant="h6"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: theme.palette.text.primary }}
          >
            CC<span style={{ color: '#32ADE6' }}>Kart</span>
          </Typography>

          <Box sx={{ flex: 1 }} />

          {user && (
            <Tooltip title={`${user.name} · ${user.email}`}>
              <Avatar sx={{
                width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700,
                background: 'linear-gradient(135deg,#007AFF,#32ADE6)',
                cursor: 'default',
              }}>
                {initials}
              </Avatar>
            </Tooltip>
          )}

          <Tooltip title="Toggle light/dark">
            <IconButton onClick={onToggleTheme} sx={{ color: theme.palette.text.secondary }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Sign out">
            <IconButton onClick={logout} sx={{ color: theme.palette.text.secondary }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer — temporary */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              background: theme.palette.background.paper,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer — permanent */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          p: { xs: 1.5, sm: 2, md: 3 },
          pt: { xs: 9, sm: 10, md: 11 },
          background: 'var(--bg, inherit)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
