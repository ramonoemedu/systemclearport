import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProviderWrapper } from './theme';

import { auth } from "./firebase/config";
import LoginPage from './components/Auth/LoginPage';
import { App } from './App';



// create root for React 18
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <BrowserRouter>
    <ThemeProviderWrapper>
      <CssBaseline />
      <App />
    </ThemeProviderWrapper>
  </BrowserRouter>
);
