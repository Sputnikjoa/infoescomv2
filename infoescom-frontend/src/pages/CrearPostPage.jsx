import React, { useState, useEffect, useRef } from 'react';
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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

function CrearPostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState('');
  const [images, setImages] = useState([]);
  const [imagesUrls, setImagesUrls] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tags, setTags] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const token = localStorage.getItem('token');
  const userAreaId = localStorage.getItem('userArea');
  const [areasMap, setAreasMap] = useState({});

  const userRole = localStorage.getItem('role');
  useEffect(() => {
    if (userRole !== 'encargado') {
      navigate('/feed');
    }
    if (userRole == null) {
      navigate('/login');
    }
  }, [userRole, navigate]);

  // Referencias para inputs
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

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

  useEffect(() => {
    fetchAreas();
  }, []);

  const userAreaName = areasMap[userAreaId] || 'Área desconocida';

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagesUrls((prevUrls) => [...prevUrls, ...urls]);
  };

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments((prevDocs) => [...prevDocs, ...files]);
  };

  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitleError('El título es obligatorio.');
    } else {
      setTitleError('');
    }
  };

  const handleContentBlur = () => {
    if (!content.trim()) {
      setContentError('El contenido es obligatorio.');
    } else {
      setContentError('');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError('El título es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setContentError('El contenido es obligatorio.');
      return;
    }
    if (!userAreaId) {
      setSubmitError('No se pudo detectar su área. Por favor, contacte a soporte.');
      return;
    }
    setSubmitError('');
    setSubmitMessage('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('area', userAreaId);
    formData.append('tags', tags);
    images.forEach((image) => {
      formData.append('images', image);
    });
    documents.forEach((doc) => {
      formData.append('documents', doc);
    });
    try {
      const response = await fetch('https://infoescom.site/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitMessage('Comunicado enviado a revisión.');
        setTitle('');
        setContent('');
        setTags('');
        setImages([]);
        setImagesUrls([]);
        setDocuments([]);
      } else {
        setSubmitError(data.message || 'Error al enviar el comunicado.');
      }
    } catch (error) {
      console.error(error);
      setSubmitError('Error al enviar el comunicado.');
    }
  };

  // Función para eliminar una imagen de la lista
  const handleRemoveImage = (index) => {
    const newImages = [...images];
    const newImagesUrls = [...imagesUrls];
    newImages.splice(index, 1);
    newImagesUrls.splice(index, 1);
    setImages(newImages);
    setImagesUrls(newImagesUrls);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Función para eliminar un documento de la lista
  const handleRemoveDocument = (index) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Crear Comunicado
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <TextField
            label="Título"
            variant="outlined"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            error={Boolean(titleError)}
            helperText={titleError}
            margin="normal"
          />
          <TextField
            label="Contenido"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            error={Boolean(contentError)}
            helperText={contentError}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" component="label">
            Adjuntar Imágenes
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
              ref={imageInputRef}
              onClick={(e) => (e.target.value = "")}
            />
          </Button>
          <Button variant="contained" component="label" sx={{ ml: 2 }}>
            Adjuntar Documentos
            <input
              type="file"
              hidden
              multiple
              accept="application/pdf,application/msword"
              onChange={handleDocumentChange}
              ref={documentInputRef}
              onClick={(e) => (e.target.value = "")}
            />
          </Button>
          <TextField
            label="Tags (separados por comas)"
            variant="outlined"
            fullWidth
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Vista Previa
          </Typography>
          <Card sx={{ mb: 2, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                  {userAreaId ? userAreaName.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {title || 'Título del comunicado'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Área: {userAreaName}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" sx={{ mb: 2 }}>
                {content || 'Contenido del comunicado...'}
              </Typography>

              {imagesUrls.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    {imagesUrls.map((url, index) => (
                      <Grid item key={index} xs={12} sm={6} md={4}>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            image={url}
                            alt={`imagen ${index + 1}`}
                            sx={{ borderRadius: '8px', cursor: 'pointer' }}
                          />
                          <IconButton
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              color: 'white',
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            }}
                            onClick={() => handleRemoveImage(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {documents.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    Documentos adjuntos:
                  </Typography>
                  <List>
                    {documents.map((doc, index) => {
                      const fileName = doc.name;
                      return (
                        <ListItem key={index} disablePadding>
                          <ListItemText
                            primary={
                              <a
                                href={URL.createObjectURL(doc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: '#1976d2' }}
                              >
                                {fileName}
                              </a>
                            }
                          />
                          <IconButton
                            sx={{ color: 'red' }}
                            onClick={() => handleRemoveDocument(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}

              {tags.trim() !== '' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {tags.split(',').map(
                      (tag, index) =>
                        tag.trim() !== '' && (
                          <Chip key={index} label={tag.trim()} sx={{ mr: 1, mb: 1 }} />
                        )
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          {submitMessage && <Alert severity="success">{submitMessage}</Alert>}
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || !userAreaId}
          >
            Enviar a Revisión
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}

export default CrearPostPage;
