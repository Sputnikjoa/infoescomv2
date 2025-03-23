import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";

function AdminUsersDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Estados para el diálogo de agregar/editar usuario
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState(""); // Nuevo campo para la contraseña
  const [userRole, setUserRole] = useState("alumno");
  const [userArea, setUserArea] = useState("");

  // Estado para el diálogo de confirmación de eliminación
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const userRoleadmin = localStorage.getItem("role");
  useEffect(() => {
    if (userRoleadmin !== "administrador") {
      navigate("/feed");
    }
    if (userRoleadmin == null) {
      navigate("/login");
    }
  }, [userRoleadmin, navigate]);

  // Función para obtener usuarios desde el backend
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data);
      } else {
        setError(data.message || "Error al obtener usuarios.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al obtener usuarios.");
    }
  };

  // Función para obtener áreas (y subáreas)
  const fetchAreas = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/areas", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAreas(data);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAreas();
  }, []);

  // Filtrar usuarios por email (en tiempo real)
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Función para crear el menú de áreas y subáreas para el campo "Área" en el formulario.
  const renderAreaOptions = () => {
    const topAreas = areas.filter((area) => !area.parent);
    let options = [];
    topAreas.forEach((area) => {
      options.push(
        <MenuItem key={area._id} value={area._id}>
          {area.name}
        </MenuItem>
      );
      if (area.subareas && area.subareas.length > 0) {
        area.subareas.forEach((sub) => {
          options.push(
            <MenuItem key={sub._id} value={sub._id} sx={{ pl: 4 }}>
              {sub.name}
            </MenuItem>
          );
        });
      }
    });
    return options;
  };

  // Manejar apertura del diálogo para agregar un nuevo usuario
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPassword(""); // Reiniciar el campo de contraseña
    setUserRole("alumno");
    setUserArea("");
    setOpenUserDialog(true);
  };

  // Manejar apertura del diálogo para editar usuario
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword(""); // No mostrar contraseña al editar
    setUserRole(user.role);
    setUserArea(user.area || "");
    setOpenUserDialog(true);
  };

  // Guardar (crear o actualizar) usuario
  const handleSaveUser = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    if (!editingUser && !userPassword.trim()) {
      setError("La contraseña es obligatoria para nuevos usuarios.");
      return;
    }
    try {
      let response;
      const userPayload = {
        name: userName,
        email: userEmail,
        role: userRole,
        verified: true, // Los usuarios creados desde el admin se verifican automáticamente.
      };
      // Solo asignar área si el rol es encargado o jefe
      if (userRole === "encargado" || userRole === "jefe") {
        userPayload.area = userArea;
      }
      if (editingUser) {
        // Actualizar usuario (sin contraseña)
        response = await fetch(`http://localhost:5000/api/users/${editingUser._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userPayload),
        });
      } else {
        // Crear usuario (incluir contraseña)
        userPayload.password = userPassword;
        response = await fetch("http://localhost:5000/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userPayload),
        });
      }
      const data = await response.json();
      if (response.ok) {
        setSuccess(editingUser ? "Usuario actualizado." : "Usuario creado.");
        setOpenUserDialog(false);
        fetchUsers();
      } else {
        setError(data.message || "Error al guardar el usuario.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al guardar el usuario.");
    }
  };

  // Manejar eliminación con confirmación: abrir diálogo de confirmación
  const handleDeleteUserConfirm = (userId) => {
    setUserToDelete(userId);
    setOpenConfirmDialog(true);
  };

  // Eliminar usuario tras confirmar
  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Usuario eliminado.");
        fetchUsers();
      } else {
        setError(data.message || "Error al eliminar el usuario.");
      }
      setOpenConfirmDialog(false);
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Error al eliminar el usuario.");
      setOpenConfirmDialog(false);
      setUserToDelete(null);
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Dashboard de Usuarios
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
        <TextField
          label="Buscar por correo"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="contained" onClick={handleOpenAddUser}>
          Agregar Usuario
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Área</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {user.area
                      ? user.area.name || user.area
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditUser(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUserConfirm(user._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No se encontraron usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para agregar/editar usuario */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)}>
        <DialogTitle>{editingUser ? "Editar Usuario" : "Agregar Usuario"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            type="text"
            fullWidth
            variant="outlined"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Correo"
            type="email"
            fullWidth
            variant="outlined"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          {!editingUser && (
            <TextField
              margin="dense"
              label="Contraseña"
              type="password"
              fullWidth
              variant="outlined"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
            />
          )}
          <FormControl fullWidth margin="dense">
            <InputLabel id="role-label">Rol</InputLabel>
            <Select
              labelId="role-label"
              value={userRole}
              label="Rol"
              onChange={(e) => setUserRole(e.target.value)}
            >
              <MenuItem value="alumno">Alumno</MenuItem>
              <MenuItem value="docente">Docente</MenuItem>
              <MenuItem value="paae">PAAE</MenuItem>
              <MenuItem value="encargado">Encargado</MenuItem>
              <MenuItem value="jefe">Jefe</MenuItem>
            </Select>
          </FormControl>
          {(userRole === "encargado" || userRole === "jefe") && (
            <FormControl fullWidth margin="dense">
              <InputLabel id="area-label">Área</InputLabel>
              <Select
                labelId="area-label"
                value={userArea}
                label="Área"
                onChange={(e) => setUserArea(e.target.value)}
              >
                {renderAreaOptions()}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveUser}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar usuario */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar este usuario?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancelar</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminUsersDashboard;
