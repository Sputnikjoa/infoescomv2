// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../ThemeContext';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [areasMap, setAreasMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { mode, toggleTheme } = useContext(ThemeContext);

  const userRole = localStorage.getItem('role');
  useEffect(() => {
    if (!userRole) {
      navigate('/login');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('https://infoescom.site/api/users/me', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
          if (data.area && (data.role === 'jefe' || data.role === 'encargado')) {
            await fetchAreas(); // Obtener mapa de áreas
          }
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

    const fetchAreas = async () => {
      try {
        const response = await fetch('https://infoescom.site/api/areas', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          const map = {};
          data.forEach(area => {
            map[area._id] = area.name;
            if (area.subareas) {
              area.subareas.forEach(subarea => {
                map[subarea._id] = subarea.name;
              });
            }
          });
          setAreasMap(map);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    };

    fetchProfile();
  }, [token]);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card sx={{ p: 2, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 80, height: 80, mb: 1 }}>
            {user.name.charAt(0)}
          </Avatar>
          <Typography variant="h5">{user.name}</Typography>
          <Typography variant="body2" color="textSecondary">{user.email}</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1"><strong>Rol:</strong> {user.role}</Typography>
            {(user.role === 'jefe' || user.role === 'encargado') && user.area && (
              <Typography variant="subtitle1">
                <strong>Área:</strong> {areasMap[user.area] || user.area}
              </Typography>
            )}
          </Box>
          <FormControlLabel
            control={<Switch checked={mode === 'dark'} onChange={toggleTheme} />}
            label="Modo oscuro"
          />
          <Button variant="contained" color="primary" fullWidth onClick={() => navigate('/edit-profile')} sx={{ mt: 2 }}>
            Editar Perfil
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ProfilePage;
