import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Box,
  Divider,
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function EditProfilePage() {
  const [user, setUser] = useState({ name: '', email: '' });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

    const userRole = localStorage.getItem('role');
        useEffect(() => {
            
            if (userRole== null){
              navigate('/login');
            }
          }, [userRole, navigate]);

  // Obtener los datos del perfil del usuario
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
        } else {
          setError(data.message || 'Error al obtener el perfil');
        }
      } catch (err) {
        console.error(err);
        setError('Error al obtener el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

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
    if (showPasswordFields) {
      if (password.length < 7) {
        setPasswordError('La contraseña debe tener al menos 7 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError('Las contraseñas no coinciden');
        return;
      }
    }
  
    try {
      const updatedData = { name: user.name }; // Enviar el nombre
      if (showPasswordFields) {
        updatedData.password = password; // Enviar la contraseña si se está cambiando
      }
  
      const response = await fetch('http://localhost:5000/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
  
      const data = await response.json();
      if (response.ok) {
        setSuccess('Perfil actualizado correctamente');
        setError('');
        setTimeout(() => navigate('/profile'), 2000); // Redirigir al perfil después de 2 segundos
      } else {
        setError(data.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el perfil');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card sx={{ p: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Editar Perfil
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nombre"
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Correo electrónico"
              value={user.email}
              disabled
              margin="normal"
            />

            {!showPasswordFields && (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => setShowPasswordFields(true)}
              >
                Cambiar Contraseña
              </Button>
            )}

            {showPasswordFields && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Nueva Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={validatePassword}
                  margin="normal"
                  required
                  error={!!passwordError}
                />
                {passwordError && (
                  <FormHelperText error>{passwordError}</FormHelperText>
                )}

                <TextField
                  fullWidth
                  type="password"
                  label="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={validateConfirmPassword}
                  margin="normal"
                  required
                  error={!!confirmPasswordError}
                />
                {confirmPasswordError && (
                  <FormHelperText error>{confirmPasswordError}</FormHelperText>
                )}
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default EditProfilePage;