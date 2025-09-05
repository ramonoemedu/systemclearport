import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client'; // updated import
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom'; // add this
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase/config";
import LoginPage from './components/Auth/LoginPage';
import { App } from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  shape: { borderRadius: 12 },
});

// create root for React 18
const root = ReactDOM.createRoot(document.getElementById('root')!);

const AuthWrapper: React.FC = () => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null; // or a loading spinner

  return user ? <App /> : <LoginPage />;
};

root.render(
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthWrapper />
    </ThemeProvider>
  </BrowserRouter>
);
