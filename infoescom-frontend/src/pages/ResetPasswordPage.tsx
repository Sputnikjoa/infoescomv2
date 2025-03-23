import React, { useState, useContext } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Link as MuiLink,
  FormHelperText,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeContext } from "../ThemeContext";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Obtener el token de la URL
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { mode } = useContext(ThemeContext);

  // Validar la contraseña al salir del campo
  const validatePassword = () => {
    if (password.length > 0 && password.length < 7) {
      setPasswordError('La contraseña debe tener al menos 7 caracteres');
    } else {
      setPasswordError('');
    }
  };

  // Validar la coincidencia de las contraseñas al salir del campo
  const validateConfirmPassword = () => {
    if (confirmPassword !== password) {
      setConfirmPasswordError('Las contraseñas no coinciden');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar la contraseña antes de enviar
    if (password.length < 7) {
      setPasswordError('La contraseña debe tener al menos 7 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      return;
    }

    try {
      const response = await fetch('https://infoescom.site/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }), // Asegúrate de enviar "newPassword"
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Contraseña restablecida correctamente');
        setError('');
        setTimeout(() => navigate('/login'), 2000); // Redirigir al login después de 2 segundos
      } else {
        setError(data.message || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      console.error(err);
      setError('Error al restablecer la contraseña');
    }
  };

  return (
    <Container maxWidth={false} disableGutters>
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Columna izquierda: mensaje de bienvenida con fondo azul */}
        <Grid item xs={12} md={6} sx={{ background: mode === "light"
    ? "linear-gradient(0deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)"
    : "linear-gradient(0deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)", display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Box sx={{ p: 4 }}>
            <Typography variant="h3" gutterBottom>Bienvenido</Typography>
            <Typography variant="h6">
              Restablece tu contraseña y vuelve a conectarte con InfoEscom.
            </Typography>
          </Box>
        </Grid>
        {/* Columna derecha: formulario para restablecer la contraseña */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Restablecer Contraseña
            </Typography>
            {message && (
              <Typography variant="body1" color="success.main" align="center" gutterBottom>
                {message}
              </Typography>
            )}
            {error && (
              <Typography variant="body1" color="error" align="center" gutterBottom>
                {error}
              </Typography>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Nueva Contraseña"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePassword}
                error={!!passwordError}
                required
              />
              {passwordError && (
                <FormHelperText error>{passwordError}</FormHelperText>
              )}

              <TextField
                label="Confirmar Contraseña"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={validateConfirmPassword}
                error={!!confirmPasswordError}
                required
              />
              {confirmPasswordError && (
                <FormHelperText error>{confirmPasswordError}</FormHelperText>
              )}

              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Restablecer Contraseña
              </Button>
            </form>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              ¿Recordaste tu contraseña? <MuiLink href="/login" underline="hover">Inicia Sesión</MuiLink>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ResetPasswordPage;