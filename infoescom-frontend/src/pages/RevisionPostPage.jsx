import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Box,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

function RevisionPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  console.log("token:"+token);
  // Estado para almacenar el comunicado a revisar
  const [post, setPost] = useState(null);
  // Estado para almacenar el mapa de áreas (id -> nombre)
  const [areasMap, setAreasMap] = useState({});
  // Estados para los campos de revisión
  const [status, setStatus] = useState(''); // Inicial vacío para forzar elección
  const [feedback, setFeedback] = useState('');
  const [signature, setSignature] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const userRole = localStorage.getItem('role');
  useEffect(() => {
    if (userRole !== 'jefe') {
      navigate('/feed');
    }

    if (userRole == null){
      navigate('/login');
    }
  }, [userRole, navigate]);

  // Función auxiliar para obtener la URL completa de la imagen o documento
  const getFileUrl = (file) => {
    if (file.startsWith('uploads/')) {
      return `https://infoescom.site/${file}`;
    }
    return file;
  };

  // Cargar el comunicado desde el backend según el id
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`https://infoescom.site/api/posts/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setPost(data);
        } else {
          setSubmitError(data.message || 'Error al cargar el comunicado.');
        }
      } catch (error) {
        console.error(error);
        setSubmitError('Error al cargar el comunicado.');
      }
    };
    fetchPost();
  }, [id, token]);

  // Cargar las áreas desde el backend
  useEffect(() => {
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
    fetchAreas();
  }, [token]);

  // Obtener el nombre del área usando el ID
  const getAreaName = (areaId) => {
    return areasMap[areaId] || 'Área desconocida';
  };

  // Manejar la carga del archivo de firma (para estado aprobado)
  const handleSignatureChange = (e) => {
    if (e.target.files.length > 0) {
      setSignature(e.target.files[0]);
    }
  };

  // Función para enviar la revisión
  const handleSubmit = async () => {
    // Validaciones:
    if (status === 'aprobado' && !signature) {
      setSubmitError('Para aprobar, se requiere adjuntar la firma.');
      return;
    }
    if (status === 'rechazado' && !feedback.trim()) {
      setSubmitError('Para rechazar, se requiere feedback.');
      return;
    }
    if (!status) {
      setSubmitError('Debe seleccionar un estado.');
      return;
    }
    setSubmitError('');
    setSubmitMessage('');

    const formData = new FormData();
    formData.append('status', status.trim());
    if (status.trim() === 'aprobado') {
      formData.append('sign', signature);
    }
    if (status.trim() === 'rechazado') {
      formData.append('feedback', feedback);
    }
    try {
      const response = await fetch(`https://infoescom.site/api/posts/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitMessage('Revisión enviada correctamente.');
        navigate('/jefe');
      } else {
        setSubmitError(data.message || 'Error al enviar la revisión.');
      }
    } catch (error) {
      console.error(error);
      setSubmitError('Error al enviar la revisión.');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Revisar Comunicado
      </Typography>
      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
      {submitMessage && <Alert severity="success" sx={{ mb: 2 }}>{submitMessage}</Alert>}
      {post ? (
        <Grid container spacing={4}>
          {/* Vista Previa del Comunicado */}
          <Grid item xs={12}>
            <Card sx={{ mb: 2, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
              <CardContent>
                {/* Header del Comunicado */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                    {post.area && typeof post.area === 'object'
                      ? post.area.name.charAt(0).toUpperCase()
                      : getAreaName(post.area).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {post.area && typeof post.area === 'object'
                        ? post.area.name
                        : getAreaName(post.area)} • {new Date(post.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {/* Contenido del Comunicado */}
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {post.content}
                </Typography>

                {/* Imágenes */}
                {post.images && post.images.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      {post.images.map((img, index) => (
                        <Grid item key={index} xs={12} sm={6} md={4}>
                          <CardMedia
                            component="img"
                            image={getFileUrl(img)}
                            alt={`imagen ${index + 1}`}
                            sx={{ borderRadius: '8px', cursor: 'pointer' }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Documentos */}
                {post.documents && post.documents.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      Documentos adjuntos:
                    </Typography>
                    <List>
                      {post.documents.map((doc, index) => {
                        const fileName = doc.split('/').pop(); // Extraer el nombre del archivo
                        return (
                          <ListItem key={index} disablePadding>
                            <ListItemText
                              primary={
                                <a
                                  href={getFileUrl(doc)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ textDecoration: 'none', color: '#1976d2' }}
                                >
                                  {fileName} {/* Mostrar el nombre del archivo con extensión */}
                                </a>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      Tags:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                      {post.tags.map((tag, index) => (
                        <Chip key={index} label={tag} sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
            <Typography variant="p" align="center" gutterBottom>
            
          Autor: {post.author.name}
            </Typography>
          </Grid>

          {/* Formulario de Revisión */}
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Revisión
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel id="status-label">Estado</InputLabel>
              <Select
                labelId="status-label"
                value={status}
                label="Estado"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="aprobado">Aprobado</MenuItem>
                <MenuItem value="rechazado">Rechazado</MenuItem>
              </Select>
            </FormControl>
            {status === 'rechazado' && (
              <TextField
                label="Feedback"
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                margin="normal"
              />
            )}
            {status === 'aprobado' && (
              <Button variant="contained" component="label" sx={{ mt: 2 }}>
                Adjuntar Firma
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleSignatureChange}
                />
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Enviar Revisión
            </Button>
            
          </Grid>
        </Grid>
        
      ) : (
        <Typography align="center">Cargando comunicado...</Typography>
      )}
    </Container>
  );
}

export default RevisionPostPage;