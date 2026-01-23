import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  Divider,
  IconButton,
  Avatar,
  Button,
  Tooltip,
  Stack,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import { WorkRounded, Brightness4, Brightness7, ChevronLeft } from '@mui/icons-material';
import { useColorMode } from '../../theme';

const drawerWidth = 260;

const HomePage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const theme = useTheme();
  const { toggleColorMode } = useColorMode();
  const colorMode = theme.palette.mode;

  useEffect(() => {
    setUserEmail(auth.currentUser?.email ?? null);
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navItems = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/home',
      selected: location.pathname === '/home',
    },
    {
      label: 'Employee Data Form',
      icon: <AssignmentIcon />,
      path: '/home/employeedataform',
      selected: location.pathname.startsWith('/home/employeedataform'),
    },
    {
      label: 'Reports',
      icon: <AssignmentIcon />,
      path: '/home/reports',
      selected: location.pathname.startsWith('/home/reports'),
    },
    {
      label: 'Form Word',
      icon: <WorkRounded />,
      path: '/home/formword',
      selected: location.pathname.startsWith('/home/formword'),
    },
    {
      label: 'Name Extractor',
      icon: <ImageSearchIcon />,
      path: '/home/name-extractor',
      selected: location.pathname.startsWith('/home/name-extractor'),
    },
  ];

  const drawerContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: colorMode === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(15px)',
    }}>
      <Toolbar sx={{
        justifyContent: 'center',
        mb: 2,
        pt: 2,
        background: 'transparent'
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', px: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 50,
              height: 50,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {userEmail ? userEmail[0].toUpperCase() : 'A'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle1" fontWeight={800} noWrap>
              Admin Portal
            </Typography>
            {userEmail && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {userEmail}
              </Typography>
            )}
          </Box>
        </Stack>
      </Toolbar>
      <Divider sx={{ mb: 2, mx: 2, opacity: 0.5 }} />
      <List sx={{ flexGrow: 1, px: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
            <Button
              fullWidth
              startIcon={item.icon}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: 3,
                px: 2,
                py: 1.5,
                bgcolor: item.selected ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                color: item.selected ? 'primary.main' : 'text.primary',
                fontWeight: item.selected ? 700 : 500,
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  bgcolor: item.selected ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.text.primary, 0.05),
                  transform: 'translateX(5px)',
                },
                '&::before': item.selected ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '15%',
                  bottom: '15%',
                  width: '4px',
                  bgcolor: 'primary.main',
                  borderRadius: '0 4px 4px 0',
                } : {},
                textTransform: 'none',
              }}
              onClick={() => {
                navigate(item.path);
                if (mobileOpen) setMobileOpen(false);
              }}
            >
              {item.label}
            </Button>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 1, mb: 2, mx: 2, opacity: 0.5 }} />
      <Box sx={{ px: 3, pb: 4 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            borderRadius: 3,
            fontWeight: 700,
            py: 1.2,
            borderColor: alpha(theme.palette.error.main, 0.5),
            '&:hover': {
              borderColor: 'error.main',
              bgcolor: alpha(theme.palette.error.main, 0.05)
            }
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          color: 'text.primary',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} sx={{ flexGrow: 1, letterSpacing: '-0.5px' }}>
            <span style={{ color: theme.palette.primary.main }}>
              {location.pathname === '/home' && 'Dashboard'}
              {location.pathname.startsWith('/home/employeedataform') && 'Employee Data'}
              {location.pathname.startsWith('/home/reports') && 'Reports'}
              {location.pathname.startsWith('/home/formword') && 'Form Word'}
            </span>
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="sidebar"
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              bgcolor: 'transparent',
              border: 'none',
              boxShadow: 'none'
            },
            '& .MuiBackdrop-root': {
              backdropFilter: 'blur(4px)'
            }
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: 'transparent',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          marginTop: '64px',
          transition: 'all 0.3s ease'
        }}
      >
        <Fade in={true} timeout={600}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default HomePage;