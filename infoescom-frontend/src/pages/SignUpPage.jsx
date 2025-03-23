// src/pages/SignupPage.jsx
import React, { useState, useContext } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Link as MuiLink,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from "../ThemeContext";

function SignupPage() {
  const navigate = useNavigate();
  const { mode } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [role, setRole] = useState('alumno');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Expresión regular para validar que el correo sea del dominio ipn.mx
  const emailRegex = /^[\w-\.]+@(?:[\w-]+\.)?ipn\.mx$/;

  const handleEmailBlur = () => {
    if (email && !emailRegex.test(email)) {
      setEmailError("El correo debe ser del dominio ipn.mx");
    } else {
      setEmailError('');
    }
  };

  const handlePasswordBlur = () => {
    if (password && password.length < 7) {
      setPasswordError("La contraseña debe tener al menos 7 caracteres");
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmPasswordError("Las contraseñas no coinciden");
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailRegex.test(email)) {
      setError("El correo debe ser del dominio ipn.mx");
      return;
    }
    if (password.length < 7) {
      setError("La contraseña debe tener al menos 7 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      if (response.ok) {
        // Mostrar mensaje de éxito y redirigir a login después de 3 segundos
        setSuccess(data.message);
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } else {
        setError(data.message || 'Error en el registro');
      }
    } catch (err) {
      console.error(err);
      setError('Error en el registro');
    }
  };

  return (
    <Container maxWidth={false} disableGutters>
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* Columna izquierda: mensaje de bienvenida */}
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
              Visualiza Anuncios,<br />
              Administra tus notificaciones,<br />
              Mantente siempre conectado,<br />
              Infórmate de la ESCOM
            </Typography>
          </Box>
        </Grid>
        {/* Columna derecha: formulario de registro */}
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
            <Typography variant="h3" align="center" gutterBottom>
              INFOESCOM
            </Typography>
            <Typography variant="h4" align="center" gutterBottom>
              Registrarse
            </Typography>
            {error && (
              <Alert variant="outlined" severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="outlined" severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Nombre"
                variant="outlined"
                fullWidth
                margin="normal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                label="Correo"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                error={Boolean(emailError)}
                helperText={emailError}
                required
              />
              <TextField
                label="Contraseña"
                variant="outlined"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                error={Boolean(passwordError)}
                helperText={passwordError}
                required
              />
              <TextField
                label="Confirmar Contraseña"
                variant="outlined"
                type="password"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={handleConfirmPasswordBlur}
                error={Boolean(confirmPasswordError)}
                helperText={confirmPasswordError}
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="role-label">Soy</InputLabel>
                <Select
                  labelId="role-label"
                  id="role-select"
                  value={role}
                  label="Soy"
                  onChange={(e) => setRole(e.target.value)}
                >
                  <MenuItem value="alumno">Alumno</MenuItem>
                  <MenuItem value="docente">Docente</MenuItem>
                  <MenuItem value="paae">PAAE</MenuItem>
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                Registrarse
              </Button>
            </form>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              ¿Ya tienes una cuenta?{" "}
              <MuiLink href="/login" underline="hover">
                Iniciar Sesión
              </MuiLink>
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SignupPage;
