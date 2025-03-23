import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  Paper,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

function AdminAreasDashboard() {
    const navigate = useNavigate();
    
  const token = localStorage.getItem('token');
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para el diálogo de agregar/editar área
  const [openAreaDialog, setOpenAreaDialog] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaFocus, setAreaFocus] = useState(['alumno']); // Array de focus por defecto
  const [editingArea, setEditingArea] = useState(null);

  // Estados para el diálogo de agregar/editar subárea
  const [openSubareaDialog, setOpenSubareaDialog] = useState(false);
  const [subareaName, setSubareaName] = useState('');
  const [subareaFocus, setSubareaFocus] = useState(['alumno']); // Array de focus por defecto
  const [parentAreaId, setParentAreaId] = useState('');
  const [editingSubarea, setEditingSubarea] = useState(null);

    const userRole = localStorage.getItem('role');
      useEffect(() => {
        if (userRole !== 'administrador') {
          navigate('/feed');
        }
    
        if (userRole == null){
          navigate('/login');
        }
      }, [userRole, navigate]);


  // Función para obtener áreas desde el backend
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
        setError(data.message || 'Error al obtener áreas.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al obtener áreas.');
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // Manejar agregar o editar área
  const handleSaveArea = async () => {
    if (!areaName.trim()) {
      setError('El nombre del área es obligatorio.');
      return;
    }
    try {
      let response;
      if (editingArea) {
        // Actualizar área
        response = await fetch(`http://localhost:5000/api/areas/${editingArea._id}`, {
          method: 'PUT', // o PATCH según la implementación del backend
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: areaName, focus: areaFocus }),
        });
      } else {
        // Crear nueva área
        response = await fetch('http://localhost:5000/api/areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: areaName, focus: areaFocus }),
        });
      }
      const data = await response.json();
      if (response.ok) {
        setSuccess(editingArea ? 'Área actualizada.' : 'Área creada.');
        setOpenAreaDialog(false);
        setAreaName('');
        setAreaFocus(['alumno']);
        setEditingArea(null);
        fetchAreas();
      } else {
        setError(data.message || 'Error al guardar el área.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al guardar el área.');
    }
  };

  // Manejar eliminar área
  const handleDeleteArea = async (areaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/areas/${areaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Área eliminada.');
        fetchAreas();
      } else {
        setError(data.message || 'Error al eliminar el área.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el área.');
    }
  };

  // Manejar agregar o editar subárea
  const handleSaveSubarea = async () => {
    if (!subareaName.trim()) {
      setError('El nombre de la subárea es obligatorio.');
      return;
    }
    try {
      let response;
      if (editingSubarea) {
        // Actualizar subárea
        response = await fetch(`http://localhost:5000/api/areas/${editingSubarea._id}`, {
          method: 'PUT', // o PATCH
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: subareaName, focus: subareaFocus }),
        });
      } else {
        // Crear nueva subárea. Se envía el parent para relacionarla con el área.
        response = await fetch('http://localhost:5000/api/areas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: subareaName,
            focus: subareaFocus,
            parent: parentAreaId,
          }),
        });
      }
      const data = await response.json();
      if (response.ok) {
        setSuccess(editingSubarea ? 'Subárea actualizada.' : 'Subárea creada.');
        setOpenSubareaDialog(false);
        setSubareaName('');
        setSubareaFocus(['alumno']);
        setEditingSubarea(null);
        setParentAreaId('');
        fetchAreas();
      } else {
        setError(data.message || 'Error al guardar la subárea.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al guardar la subárea.');
    }
  };

  // Manejar eliminar subárea
  const handleDeleteSubarea = async (subareaId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/areas/${subareaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Subárea eliminada.');
        fetchAreas();
      } else {
        setError(data.message || 'Error al eliminar la subárea.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al eliminar la subárea.');
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Dashboard de Áreas
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" onClick={() => setOpenAreaDialog(true)}>
          Agregar Área
        </Button>
      </Box>
      <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre del Área</TableCell>
            <TableCell>Focus</TableCell>
            <TableCell>Subáreas</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {areas.map(area => (
            <TableRow key={area._id}>
              <TableCell>{area.name}</TableCell>
              <TableCell>{Array.isArray(area.focus) ? area.focus.join(', ') : area.focus}</TableCell>
              <TableCell>
                {area.subareas && area.subareas.length > 0 
                  ? area.subareas.map(sub => (
                      <Box key={sub._id} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">{sub.name} ({Array.isArray(sub.focus) ? sub.focus.join(', ') : sub.focus})</Typography>
                        <IconButton size="small" onClick={() => {
                          setEditingSubarea(sub);
                          setSubareaName(sub.name);
                          setSubareaFocus(Array.isArray(sub.focus) ? sub.focus : [sub.focus]);
                          setParentAreaId(area._id);
                          setOpenSubareaDialog(true);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteSubarea(sub._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))
                  : 'Sin subáreas'}
                <Button size="small" onClick={() => {
                  setParentAreaId(area._id);
                  setEditingSubarea(null);
                  setSubareaName('');
                  setSubareaFocus(['alumno']);
                  setOpenSubareaDialog(true);
                }}>
                  Agregar Subárea
                </Button>
              </TableCell>
              <TableCell>
                <IconButton onClick={() => {
                  setEditingArea(area);
                  setAreaName(area.name);
                  setAreaFocus(Array.isArray(area.focus) ? area.focus : [area.focus]);
                  setOpenAreaDialog(true);
                }}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteArea(area._id)}>
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableContainer>
      {/* Diálogo para agregar/editar área */}
      <Dialog open={openAreaDialog} onClose={() => setOpenAreaDialog(false)}>
        <DialogTitle>{editingArea ? 'Editar Área' : 'Agregar Área'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Área"
            type="text"
            fullWidth
            variant="outlined"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="focus-label">Focus</InputLabel>
            <Select
              labelId="focus-label"
              multiple
              value={areaFocus}
              label="Focus"
              onChange={(e) => setAreaFocus(e.target.value)}
            >
              <MenuItem value="alumno">Alumno</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="paae">PAAE</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAreaDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveArea}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para agregar/editar subárea */}
      <Dialog open={openSubareaDialog} onClose={() => setOpenSubareaDialog(false)}>
        <DialogTitle>{editingSubarea ? 'Editar Subárea' : 'Agregar Subárea'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la Subárea"
            type="text"
            fullWidth
            variant="outlined"
            value={subareaName}
            onChange={(e) => setSubareaName(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="subarea-focus-label">Focus</InputLabel>
            <Select
              labelId="subarea-focus-label"
              multiple
              value={subareaFocus}
              label="Focus"
              onChange={(e) => setSubareaFocus(e.target.value)}
            >
              <MenuItem value="alumno">Alumno</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="paae">PAAE</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubareaDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveSubarea}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminAreasDashboard;
