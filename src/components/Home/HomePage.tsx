import React from 'react';
import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Button,
  Tooltip,
} from '@mui/material';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ListItemButton from '@mui/material/ListItemButton';

const drawerWidth = 220;

const HomePage: React.FC = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/'); // Redirect to login page
  };
    // ...existing hooks...
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(auth.currentUser?.email ?? null);
  }, []);

  const drawer = (
    <div>
       <Toolbar sx={{ justifyContent: 'center' }}>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
          {userEmail ? userEmail[0].toUpperCase() : 'A'}
        </Avatar>
        <Box>
          <Typography variant="h6" noWrap>
            Admin Portal
          </Typography>
          {userEmail && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {userEmail}
            </Typography>
          )}
        </Box>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/home'}
            sx={{ borderRadius: 2, mx: 1, my: 0.5, '&:hover': { bgcolor: 'primary.light' } }}
            onClick={() => navigate('/home')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
        {/* <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname.startsWith('/home/users')}
            sx={{ borderRadius: 2, mx: 1, my: 0.5, '&:hover': { bgcolor: 'primary.light' } }}
            onClick={() => navigate('/home/users')}
          >
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Users" />
          </ListItemButton>
        </ListItem> */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname.startsWith('/home/employeedataform')}
            sx={{ borderRadius: 2, mx: 1, my: 0.5, '&:hover': { bgcolor: 'primary.light' } }}
            onClick={() => navigate('/home/employeedataform')}
          >
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Employee Data Form" />
          </ListItemButton>
        </ListItem>
         <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname.startsWith('/home/reports')}
            sx={{ borderRadius: 2, mx: 1, my: 0.5, '&:hover': { bgcolor: 'primary.light' } }}
            onClick={() => navigate('/home/reports')}
          >
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {location.pathname === '/home' && 'System Clear Port'}
            {location.pathname.startsWith('/home/users') && 'User Management'}
            {location.pathname.startsWith('/home/reports') && 'Reports'}
          </Typography>
          <Tooltip title="Logout">
            <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
              Logout
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
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
          p: 4,
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