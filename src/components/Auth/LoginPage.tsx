import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Avatar,
  Alert,
  Link,
  Checkbox,
  FormControlLabel,
  Fade,
  Grow
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { keyframes } from '@emotion/react';

// Keyframe for subtle gradient animation
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/home');
    } catch (err) {
      if (err instanceof Error) {
        // Customize error messages for better UX
        const errorMessage = err.message.includes('auth/invalid-email') ? 'Invalid email address.' :
          err.message.includes('auth/user-not-found') ? 'User not found.' :
            err.message.includes('auth/wrong-password') ? 'Incorrect password.' :
              err.message;
        setError(errorMessage);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #1976d2, #9c27b0, #ff4081)',
        backgroundSize: '200% 200%',
        animation: `${gradientAnimation} 15s ease infinite`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Grow in timeout={800}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            minWidth: { xs: '100%', sm: 400 },
            maxWidth: 450,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 64, height: 64, boxShadow: 3 }}>
            <LockOutlinedIcon fontSize="large" />
          </Avatar>
          <Typography component="h1" variant="h4" fontWeight={800} mb={3} sx={{ background: '-webkit-linear-gradient(45deg, #1976d2, #9c27b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </Typography>

          <Fade in={!!error}>
            {error ? <Alert severity="error" sx={{ width: '100%', mb: 3, borderRadius: 2 }}>{error}</Alert> : <Box />}
          </Fade>

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
              variant="outlined"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              sx={{ mb: 2 }}
              required
              variant="outlined"
            />
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
              label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.8,
                fontWeight: 700,
                fontSize: '1rem',
                letterSpacing: 1,
                mb: 3,
                borderRadius: 3,
                textTransform: 'none',
                background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)',
                  background: 'linear-gradient(45deg, #1565c0 30%, #7b1fa2 90%)',
                }
              }}
            >
              {isRegister ? 'Sign Up' : 'Sign In'}
            </Button>
            <Box textAlign="center">
              <Link
                component="button"
                variant="body2"
                onClick={() => setIsRegister(!isRegister)}
                sx={{
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Create one"}
              </Link>
            </Box>
          </Box>
          <Box mt={4}>
            <Typography variant="caption" color="text.secondary">
              © {new Date().getFullYear()} Clear Port System. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );
};

export default LoginPage;