// src/components/Layout/PortalLayout.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useColorMode } from '../../theme';

const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toggleColorMode } = useColorMode();
  const mode = document.body.dataset.theme || 'light';

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(120deg, #1976d2 0%, #9c27b0 100%)' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Clear Port System
          </Typography>
          <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle dark mode">
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
};

export default PortalLayout;
