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
} from '@mui/material';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { WorkRounded } from '@mui/icons-material';

const drawerWidth = 240;

const HomePage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);

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
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      <Toolbar sx={{ justifyContent: 'center', mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            {userEmail ? userEmail[0].toUpperCase() : 'A'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Admin Portal
            </Typography>
            {userEmail && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {userEmail}
              </Typography>
            )}
          </Box>
        </Stack>
      </Toolbar>
      <Divider sx={{ mb: 1 }} />
      <List sx={{ flexGrow: 1, px: 1 }}>
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
                bgcolor: item.selected ? 'primary.main' : 'transparent',
                color: item.selected ? '#fff' : 'text.primary',
                fontWeight: item.selected ? 700 : 500,
                boxShadow: item.selected ? 2 : 0,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: item.selected ? 'primary.dark' : 'grey.100',
                  color: item.selected ? '#fff' : 'primary.main',
                },
                textTransform: 'none',
              }}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Button>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 1, mb: 2 }} />
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ borderRadius: 3, fontWeight: 700, py: 1.5 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'primary.main',
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
          <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
            {location.pathname === '/home' && 'System Clear Port'}
            {location.pathname.startsWith('/home/employeedataform') && 'Employee Data Form'}
            {location.pathname.startsWith('/home/reports') && 'Reports'}
            {location.pathname.startsWith('/home/formword') && 'Form Word'}
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="sidebar"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: '#f4f6fa',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default HomePage;