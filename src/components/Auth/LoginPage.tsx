import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  Alert,
  Link
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    navigate('/home');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #1976d2 0%, #9c27b0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 6,
          borderRadius: 4,
          minWidth: 350,
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 8px 40px rgba(25, 118, 210, 0.2)',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
          <LockOutlinedIcon fontSize="large" />
        </Avatar>
        <Typography component="h1" variant="h4" fontWeight={700} mb={2}>
          {isRegister ? 'Create Account' : 'Sign in'}
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            margin="normal"
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="normal"
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            sx={{ mb: 3 }}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              py: 1.5,
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: 1,
              mb: 2,
            }}
          >
            {isRegister ? 'Create Account' : 'Login'}
          </Button>
        </Box>
        <Link
          component="button"
          variant="body2"
          onClick={() => setIsRegister(!isRegister)}
          sx={{ mt: 1 }}
        >
          {isRegister
            ? 'Already have an account? Sign in'
            : "Don't have an account? Create one"}
        </Link>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} Clear Port System
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;