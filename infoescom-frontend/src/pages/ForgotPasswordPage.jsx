// src/pages/ForgotPasswordPage.jsx
import React, { useState, useContext } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Link as MuiLink
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from "../ThemeContext";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { mode } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Se ha enviado un correo para restablecer tu contraseña');
      } else {
        setError(data.message || 'Error al enviar el correo de recuperación');
      }
    } catch (err) {
      console.error(err);
      setError('Error al enviar el correo de recuperación');
    }
  };

  return (
    <Container maxWidth={false} disableGutters>
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* En móviles: el formulario tendrá order 1 y el mensaje de bienvenida order 2 */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{
            order: { xs: 1, md: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Recuperar Contraseña
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
                label="Correo"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Enviar correo de recuperación
              </Button>
            </form>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              ¿Recordaste tu contraseña?{" "}
              <MuiLink href="/login" underline="hover">
                Inicia Sesión
              </MuiLink>
            </Typography>
          </Box>
        </Grid>
        {/* En móviles: el mensaje de bienvenida tendrá order 2 */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{
            order: { xs: 2, md: 1 },
            background: mode === "light"
    ? "linear-gradient(0deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)"
    : "linear-gradient(0deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Box sx={{ p: 4 }}>
            <Typography variant="h3" gutterBottom>
              Bienvenido
            </Typography>
            <Typography variant="h6">
              Recupera tu contraseña y vuelve a conectarte con InfoEscom.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ForgotPasswordPage;
