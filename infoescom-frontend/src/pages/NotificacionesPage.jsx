import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  TableContainer,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function NotificacionesPage() {
  const [areas, setAreas] = useState([]);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

    const userRole = localStorage.getItem("role");
    useEffect(() => {
      if (userRole == null) {
        navigate("/login");
      }
    }, [userRole, navigate]);

  const urlBase64ToUint8Array = (base64String) => {
    if (!base64String) {
      throw new Error('La clave VAPID no está definida.');
    }
  
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
  
    return outputArray;
  };

  // Obtener las áreas con subáreas desde el endpoint /api/areas
  const fetchAreas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/areas', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAreas(data);
      } else {
        setError(data.message || 'Error al obtener las áreas');
      }
    } catch (err) {
      console.error(err);
      setError('Error al obtener las áreas');
    }
  };

  
  const getSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
  
      // Verifica que la clave VAPID esté definida
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('La clave VAPID no está definida en las variables de entorno.');
      }
  
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
  
      return subscription;
    } catch (error) {
      console.error('Error al obtener la suscripción:', error);
      return null;
    }
  };

  // Obtener las suscripciones del usuario desde GET /api/users/me (campo "suscribed")
  const fetchUserSubscriptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/me', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Se asume que el usuario tiene el campo "suscribed" con IDs de áreas suscritas
        setUserSubscriptions(data.suscribed || []);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.getRegistration()
        .then((registration) => {
          if (!registration) {
            // Si no hay registro, registra el Service Worker
            navigator.serviceWorker.register('/service-worker.js')
              .then((registration) => {
                console.log('Service Worker registrado con éxito:', registration);
              })
              .catch((error) => {
                console.error('Error al registrar el Service Worker:', error);
              });
          } else {
            console.log('Service Worker ya está registrado:', registration);
          }
        })
        .catch((error) => {
          console.error('Error al obtener el registro del Service Worker:', error);
        });
    }
  }, []);

  useEffect(() => {
    fetchAreas();
    fetchUserSubscriptions();
  }, [token]);

  // Filtrar áreas y subáreas por el término de búsqueda
  const filteredAreas = areas.filter((area) => {
    const areaMatches = area.name.toLowerCase().includes(searchQuery.toLowerCase());
    const subMatches = area.subareas && area.subareas.some(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return areaMatches || subMatches;
  });

  // Manejar la suscripción/desuscripción
  const handleToggleSubscription = async (areaId) => {
    try {
      const subscription = await getSubscription();
      if (!subscription) {
        throw new Error('No se pudo obtener la suscripción push.');
      }
  
      if (userSubscriptions.includes(areaId)) {
        // Desuscribir
        const response = await fetch('http://localhost:5000/api/notifications/unsubscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ area: areaId }),
        });
        const data = await response.json();
        if (response.ok) {
          setUserSubscriptions(prev => prev.filter(id => id !== areaId));
        } else {
          console.error(data.message);
        }
      } else {
        // Suscribir
        const response = await fetch('http://localhost:5000/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ area: areaId, subscription }),
        });
        const data = await response.json();
        if (response.ok) {
          setUserSubscriptions(prev => [...prev, areaId]);
        } else {
          console.error(data.message);
        }
      }
    } catch (err) {
      console.error("Error al actualizar la suscripción:", err);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Configuración de Notificaciones
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Buscar áreas o subáreas"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
        />
              <TableContainer component={Paper}>    

        <List>
          {filteredAreas.map((area) => (
            <React.Fragment key={area._id}>
              {/* Área principal: se muestra en negrita */}
              <ListItem>
                <ListItemText primary={<Typography variant="body1" fontWeight="bold">{area.name}</Typography>} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={userSubscriptions.includes(area._id)}
                      onChange={() => handleToggleSubscription(area._id)}
                    />
                  }
                  label="Notificaciones"
                />
              </ListItem>
              {/* Subáreas: se muestran indentadas */}
              {area.subareas && area.subareas.map((sub) => (
                <ListItem key={sub._id} sx={{ pl: 4 }}>
                  <ListItemText primary={sub.name} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userSubscriptions.includes(sub._id)}
                        onChange={() => handleToggleSubscription(sub._id)}
                      />
                    }
                    label="Notificaciones"
                  />
                </ListItem>
              ))}
            </React.Fragment>
          ))}
        </List>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default NotificacionesPage;
