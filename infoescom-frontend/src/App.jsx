// src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProviderCustom, ThemeContext } from './ThemeContext';

// Importa tus páginas
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import NavBar from './components/NavBar';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import EncargadoPage from './pages/EncargadoPage';
import CrearPostPage from './pages/CrearPostPage';
import JefePage from './pages/JefePage';
import RevisionPostPage from './pages/RevisionPostPage';
import EditarPostPage from './pages/EditarPostPage';
import AdminAreasDashboard from './pages/AdminAreasDashboard';
import AdminUsersDashboard from './pages/AdminUsersDashboard';
import AdminPostsDashboard from './pages/AdminPostsDashboard';
import EditProfilePage from './pages/EditProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotificacionesPage from './pages/NotificacionesPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

const Layout = ({ children }) => {
  const location = useLocation();
  let path = location.pathname;
  if (path !== '/' && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  const noNavRoutes = ['/', '/login', '/signup', '/forgot-password', '/logout', '/reset-password', '/verify-email'];
  return (
    <>
      { !noNavRoutes.includes(path) && <NavBar /> }
      { children }
    </>
  );
};

// Por ejemplo, en tu index.jsx o App.jsx:
if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker registrado con éxito:', registration);
    })
    .catch(error => {
      console.error('Error al registrar el Service Worker:', error);
    });
}


function AppContent() {
  const { theme } = useContext(ThemeContext);
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/encargado" element={<EncargadoPage />} />
            <Route path="/crear-post" element={<CrearPostPage />} />
            <Route path="/jefe" element={<JefePage />} />
            <Route path="/revision-post/:id" element={<RevisionPostPage />} />
            <Route path="/editar-post/:id" element={<EditarPostPage />} />
            <Route path="/dashboard/areas" element={<AdminAreasDashboard />} />
            <Route path="/dashboard/usuarios" element={<AdminUsersDashboard />} />
            <Route path="/dashboard/comunicados" element={<AdminPostsDashboard />} />
            <Route path="/edit-profile" element={<EditProfilePage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProviderCustom>
      <AppContent />
    </ThemeProviderCustom>
  );
}

export default App;
