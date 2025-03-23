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
  IconButton,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';

function EditarPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Estados para los datos del post
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [existingImages, setExistingImages] = useState([]); // Rutas de imágenes existentes
  const [existingDocuments, setExistingDocuments] = useState([]); // Rutas de documentos existentes
  const [feedbackComments, setFeedbackComments] = useState(''); // Comentarios previos (feedback)

  // Estados para archivos nuevos (si se quieren actualizar)
  const [newImages, setNewImages] = useState([]);
  const [newImagesUrls, setNewImagesUrls] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

  // Estado para rastrear imágenes y documentos existentes eliminados
  const [deletedExistingImages, setDeletedExistingImages] = useState([]);
  const [deletedExistingDocuments, setDeletedExistingDocuments] = useState([]);

  // Estados de validación y mensajes
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  const userRole = localStorage.getItem('role');
  useEffect(() => {
    if (userRole !== 'encargado') {
      navigate('/feed');
    }
    if (userRole == null) {
      navigate('/login');
    }
  }, [userRole, navigate]);

  // Función auxiliar para construir la URL completa de las imágenes
  const getImageUrl = (img) => {
    if (img.startsWith('uploads/')) {
      return `http://localhost:5000/${img}`;
    }
    return img;
  };

  // Cargar el post existente desde el backend
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setTitle(data.title || '');
          setContent(data.content || '');
          setTags(data.tags ? data.tags.join(',') : '');
          setExistingImages(data.images || []);
          setExistingDocuments(data.documents || []);
          // Suponemos que los comentarios están en el campo 'edits' (array)
          setFeedbackComments(data.edits && data.edits.length > 0 ? data.edits.join('\n') : 'Sin comentarios previos.');
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

  // Manejar la selección de nuevas imágenes
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prevImages) => [...prevImages, ...files]); // Concatenar nuevas imágenes
    const urls = files.map((file) => URL.createObjectURL(file));
    setNewImagesUrls((prevUrls) => [...prevUrls, ...urls]); // Concatenar nuevas URLs
  };

  // Manejar la selección de nuevos documentos
  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);
    setNewDocuments((prevDocs) => [...prevDocs, ...files]); // Concatenar nuevos documentos
  };

  // Validación en tiempo real para el título
  const handleTitleBlur = () => {
    if (!title.trim()) {
      setTitleError('El título es obligatorio.');
    } else {
      setTitleError('');
    }
  };

  // Validación en tiempo real para el contenido
  const handleContentBlur = () => {
    if (!content.trim()) {
      setContentError('El contenido es obligatorio.');
    } else {
      setContentError('');
    }
  };

  // Función para eliminar una imagen existente
  const handleRemoveExistingImage = (index) => {
    const imageToDelete = existingImages[index];
    setDeletedExistingImages((prev) => [...prev, imageToDelete]); // Agregar a la lista de eliminadas
    const newImages = [...existingImages];
    newImages.splice(index, 1);
    setExistingImages(newImages);
  };

  // Función para eliminar una nueva imagen
  const handleRemoveNewImage = (index) => {
    const newImages = [...newImages];
    const newImagesUrls = [...newImagesUrls];
    newImages.splice(index, 1);
    newImagesUrls.splice(index, 1);
    setNewImages(newImages);
    setNewImagesUrls(newImagesUrls);
  };

  // Función para eliminar un documento existente
  const handleRemoveExistingDocument = (index) => {
    const documentToDelete = existingDocuments[index];
    setDeletedExistingDocuments((prev) => [...prev, documentToDelete]); // Agregar a la lista de eliminados
    const newDocuments = [...existingDocuments];
    newDocuments.splice(index, 1);
    setExistingDocuments(newDocuments);
  };

  // Función para eliminar un nuevo documento
  const handleRemoveNewDocument = (index) => {
    const newDocs = [...newDocuments];
    newDocs.splice(index, 1);
    setNewDocuments(newDocs);
  };

  // Función para enviar la actualización al backend
  const handleSubmit = async () => {
    if (!title.trim()) {
      setTitleError('El título es obligatorio.');
      return;
    }
    if (!content.trim()) {
      setContentError('El contenido es obligatorio.');
      return;
    }
    setSubmitError('');
    setSubmitMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('tags', tags);
    formData.append('deletedImages', JSON.stringify(deletedExistingImages)); // Enviar como JSON
    formData.append('deletedDocuments', JSON.stringify(deletedExistingDocuments)); // Enviar como JSON

    // Adjuntar nuevas imágenes
    newImages.forEach((image) => {
      formData.append('images', image);
    });

    // Adjuntar nuevos documentos
    newDocuments.forEach((doc) => {
      formData.append('documents', doc);
    });

    // Para reenvío, se fuerza el estado a "pendiente"
    formData.append('status', 'pendiente');

    try {
      const response = await fetch(`http://localhost:5000/api/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitMessage('Comunicado actualizado y enviado a revisión nuevamente.');
        navigate('/encargado');
      } else {
        setSubmitError(data.message || 'Error al actualizar el comunicado.');
      }
    } catch (error) {
      console.error(error);
      setSubmitError('Error al actualizar el comunicado.');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Editar Comunicado
      </Typography>
      <Typography variant="subtitle1" align="center" gutterBottom>
        Comentarios (No editables):
      </Typography>
      <TextField
        value={feedbackComments}
        variant="outlined"
        fullWidth
        multiline
        rows={3}
        disabled
        margin="normal"
      />
      <Grid container spacing={4}>
        {/* Sección 1: Título y Contenido */}
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

        {/* Sección 2: Adjuntos y Tags */}
        <Grid item xs={12}>
          <Button variant="contained" component="label">
            Adjuntar Nuevas Imágenes
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          <Button variant="contained" component="label" sx={{ ml: 2 }}>
            Adjuntar Nuevos Documentos
            <input
              type="file"
              hidden
              multiple
              accept="application/pdf,application/msword"
              onChange={handleDocumentChange}
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

        {/* Sección 3: Vista Previa */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Vista Previa
          </Typography>
          <Card sx={{ mb: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h5">
                {title || 'Título del comunicado'}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {content || 'Contenido del comunicado...'}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap' }}>
                {/* Mostrar imágenes existentes */}
                {existingImages.map((url, index) => (
                  <Box key={index} sx={{ position: 'relative', mr: 1, mb: 1 }}>
                    <CardMedia
                      component="img"
                      image={getImageUrl(url)}
                      alt={`imagen existente ${index + 1}`}
                      sx={{ width: 150, height: 'auto', borderRadius: '8px' }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        color: 'white',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                      onClick={() => handleRemoveExistingImage(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                {/* Mostrar nuevas imágenes */}
                {newImagesUrls.map((url, index) => (
                  <Box key={`new-${index}`} sx={{ position: 'relative', mr: 1, mb: 1 }}>
                    <CardMedia
                      component="img"
                      image={url}
                      alt={`nueva imagen ${index + 1}`}
                      sx={{ width: 150, height: 'auto', borderRadius: '8px' }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        color: 'white',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                      onClick={() => handleRemoveNewImage(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 1 }}>
                {/* Mostrar documentos existentes */}
                {existingDocuments.map((doc, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">
                      {doc}
                    </Typography>
                    <IconButton
                      sx={{ ml: 1, color: 'red' }}
                      onClick={() => handleRemoveExistingDocument(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                {/* Mostrar nuevos documentos */}
                {newDocuments.map((doc, index) => (
                  <Box key={`new-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">
                      {doc.name}
                    </Typography>
                    <IconButton
                      sx={{ ml: 1, color: 'red' }}
                      onClick={() => handleRemoveNewDocument(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 2 }}>
                {tags.split(',').map(
                  (tag, index) =>
                    tag.trim() !== '' && (
                      <Chip key={index} label={tag.trim()} sx={{ mr: 1, mb: 1 }} />
                    )
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Mensajes de envío */}
        <Grid item xs={12}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          {submitMessage && <Alert severity="success">{submitMessage}</Alert>}
        </Grid>

        {/* Botón para enviar la edición a revisión */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim()}
          >
            Enviar a Revisión
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}

export default EditarPostPage;