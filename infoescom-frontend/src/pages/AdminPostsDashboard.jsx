import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function AdminPostsDashboard() {
  const [comunicados, setComunicados] = useState([]);
  const [filteredComunicados, setFilteredComunicados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComunicadoId, setSelectedComunicadoId] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Obtener los comunicados aprobados
  useEffect(() => {
    const fetchComunicados = async () => {
      try {
        const response = await fetch('https://infoescom.site/api/posts/approved', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setComunicados(data.posts);
          setFilteredComunicados(data.posts);
        } else {
          setError(data.message || 'Error al obtener los comunicados');
        }
      } catch (err) {
        console.error(err);
        setError('Error al obtener los comunicados');
      } finally {
        setLoading(false);
      }
    };

    fetchComunicados();
  }, [token]);

  // Manejar la búsqueda en tiempo real
  useEffect(() => {
    const results = comunicados.filter((comunicado) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        comunicado.title.toLowerCase().includes(searchLower) ||
        (comunicado.area?.name.toLowerCase().includes(searchLower)) ||
        (comunicado.author?.name.toLowerCase().includes(searchLower)) ||
        (comunicado.approvedBy?.name.toLowerCase().includes(searchLower))
      );
    });
    setFilteredComunicados(results);
  }, [searchTerm, comunicados]);

  // Manejar la apertura del diálogo de eliminación
  const handleDeleteClick = (comunicadoId) => {
    setSelectedComunicadoId(comunicadoId);
    setDeleteDialogOpen(true);
  };

  // Manejar el cierre del diálogo de eliminación
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedComunicadoId(null);
    setDeleteReason('');
  };

  // Manejar la eliminación del comunicado
  const handleDeleteComunicado = async () => {
    if (!deleteReason) {
      alert('Debes ingresar un motivo para eliminar el comunicado.');
      return;
    }

    try {
      const response = await fetch(`https://infoescom.site/api/posts/${selectedComunicadoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleteReason }),
      });

      const data = await response.json();
      if (response.ok) {
        // Eliminar el comunicado de la lista
        setComunicados((prev) => prev.filter((comunicado) => comunicado._id !== selectedComunicadoId));
        setFilteredComunicados((prev) => prev.filter((comunicado) => comunicado._id !== selectedComunicadoId));
        handleCloseDeleteDialog();
      } else {
        setError(data.message || 'Error al eliminar el comunicado');
      }
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el comunicado');
    }
  };

  // Formatear la fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Comunicados Aprobados
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <TextField
          label="Buscar por título, área, creador o aprobado por"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{width:500, mt: 2}}
        />
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha de creación</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Área</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Aprobado por</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredComunicados.length > 0 ? (
              filteredComunicados.map((comunicado) => (
                <TableRow key={comunicado._id}>
                  <TableCell>{formatDate(comunicado.createdAt)}</TableCell>
                  <TableCell>{comunicado.title}</TableCell>
                  <TableCell>{comunicado.area?.name}</TableCell>
                  <TableCell>{comunicado.author?.name}</TableCell>
                  <TableCell>{comunicado.approvedBy?.name}</TableCell>
                  <TableCell>
                    {comunicado.sign && (
                      <img
                        src={`https://infoescom.site/${comunicado.sign}`}
                        alt="Firma"
                        style={{ width: 50, height: 50 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDeleteClick(comunicado._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No se encontraron comunicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de eliminación */}
      <Dialog
  open={deleteDialogOpen}
  onClose={handleCloseDeleteDialog}
  PaperProps={{ sx: { width: 700 } }} // Establece el ancho del diálogo
>
  <DialogTitle>Motivo de la eliminación</DialogTitle>
  <DialogContent>
    <TextField
      fullWidth
      multiline
      rows={7}
      placeholder="Escribe el motivo..."
      value={deleteReason}
      onChange={(e) => setDeleteReason(e.target.value)}
      sx={{ mt: 2 }}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
    <Button onClick={handleDeleteComunicado} color="error">
      Eliminar
    </Button>
  </DialogActions>
</Dialog>
    </Container>
  );
}

export default AdminPostsDashboard;