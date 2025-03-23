// src/components/NavBar.jsx
import React, { useState, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Box,
  Menu,
  MenuItem,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import ChecklistIcon from "@mui/icons-material/Checklist";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EditNotificationsIcon from "@mui/icons-material/EditNotifications";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";


function NavBar() {
  const { mode } = useContext(ThemeContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Estado para el menú del administrador
  const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);

  // Obtener rol del usuario desde localStorage.
  const userRole = localStorage.getItem("role");

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
    if (searchOpen) {
      setSearchQuery(""); // Restablecer la búsqueda al cerrar la barra
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      navigate(`/feed?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery(""); // Restablecer la búsqueda después de enviar
    }
  };

  // Abrir y cerrar el menú del administrador
  const handleAdminMenuClick = (event) => {
    setAdminMenuAnchor(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminMenuAnchor(null);
  };

  // Función para manejar el logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    navigate("/login");
  };

  if (isMobile) {
    // Layout exclusivo para móviles
    return (
      <AppBar
        position="static"
        sx={{
          background:
            mode === "light"
              ? "linear-gradient(90deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)"
              : undefined,
        }}
      >
        <Toolbar sx={{ flexDirection: "column", alignItems: "center", p: 1, position: "relative" }}>
          {/* Título centrado en la parte superior */}
          <Typography
            variant="h6"
            component={Link}
            to="/feed"
            onClick={() => {
              setSelectedArea(null); // Restablecer área seleccionada
              setSelectedSubArea(null); // Restablecer subárea seleccionada
            }}
            sx={{
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold",
              mb: 1,
              mt: 1,
            }}
          >
            InfoESCOM
          </Typography>
          {/* Fila inferior con barra de búsqueda a la izquierda y los íconos a la derecha */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                position: "relative",
              }}
            >
              <IconButton color="inherit" onClick={toggleSearch}>
                <SearchIcon />
              </IconButton>
              {/* Contenedor de la barra de búsqueda siempre renderizado */}
              <Box
                sx={{
                  position: "absolute",
                  left: 40,
                  top: "70%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  width: searchOpen ? 300 : 0,
                  opacity: searchOpen ? 1 : 0,
                  overflow: "hidden",
                  transition: "width 0.5s ease-in-out, opacity 0.5s ease-in-out"
                  
                }}
              >
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={{
                    ml: 1,
                    backgroundColor: mode === "dark" ? "#424242" : "#ffffff",
                    borderRadius: 1,
                    "& .MuiOutlinedInput-input": {
                      color: mode === "dark" ? "#ffffff" : "#000000",
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color:
                        mode === "dark"
                          ? "rgba(255, 255, 255, 0.7)"
                          : "rgba(0, 0, 0, 0.7)",
                    },
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                color="inherit"
                component={Link}
                to="/feed"
                onClick={() => {
                  setSelectedArea(null); // Restablecer área seleccionada
                  setSelectedSubArea(null); // Restablecer subárea seleccionada
                }}
              >
                <HomeIcon />
              </IconButton>
              <IconButton color="inherit" component={Link} to="/profile">
                <AccountCircleIcon />
              </IconButton>
              {userRole === "encargado" && (
                <IconButton color="inherit" component={Link} to="/encargado">
                  <EditIcon />
                </IconButton>
              )}
              {userRole === "jefe" && (
                <IconButton color="inherit" component={Link} to="/jefe">
                  <ChecklistIcon />
                </IconButton>
              )}
              {userRole === "administrador" && (
                <>
                  <IconButton color="inherit" onClick={handleAdminMenuClick}>
                    <MenuBookIcon />
                  </IconButton>
                  <Menu
                    anchorEl={adminMenuAnchor}
                    open={Boolean(adminMenuAnchor)}
                    onClose={handleAdminMenuClose}
                  >
                    <MenuItem
                      component={Link}
                      to="/dashboard/areas"
                      onClick={handleAdminMenuClose}
                    >
                      Áreas
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/dashboard/usuarios"
                      onClick={handleAdminMenuClose}
                    >
                      Usuarios
                    </MenuItem>
                    <MenuItem
                      component={Link}
                      to="/dashboard/comunicados"
                      onClick={handleAdminMenuClose}
                    >
                      Comunicados
                    </MenuItem>
                  </Menu>
                </>
              )}
              <IconButton color="inherit" component={Link} to="/notificaciones">
                <EditNotificationsIcon />
              </IconButton>
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }
    


  return (
    <AppBar position="static" sx={{
      // En modo claro, aplicar el degradado; en modo oscuro, usar el color predeterminado
      background: mode === "light"
        ? "linear-gradient(90deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)"
        : undefined,
    }}>
      <Toolbar sx={{ position: "relative" }}>
        {/* Izquierda: búsqueda */}
        <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
          <IconButton color="inherit" onClick={toggleSearch}>
            <SearchIcon />
          </IconButton>
          <Box
            sx={{
              position: "absolute",
              left: 50,
              top: 15,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              width: searchOpen ? 300 : 0,
              
              transition: "width 0.3s ease-in-out",
            }}
          >
            <TextField
              variant="outlined"
              size="small"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{
                width: "100%",
                opacity: searchOpen ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
                backgroundColor: mode === 'dark' ? '#424242' : '#ffffff',
                borderRadius: 1,
                // Aplica estilos al input (el texto)
                '& .MuiOutlinedInput-input': {
                  color: mode === 'dark' ? '#ffffff' : '#000000',
                },
                // Opcional: también puedes ajustar el placeholder (si es necesario)
                '& .MuiInputBase-input::placeholder': {
                  color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                },
              }}
            />
          </Box>
        </Box>
        {/* Centro: título centrado con posición absoluta */}
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <Typography
            variant="h6"
            component={Link}
            to="/feed"
            onClick={() => {
              setSelectedArea(null); // Restablecer área seleccionada
              setSelectedSubArea(null); // Restablecer subárea seleccionada
            }}
            sx={{
              textDecoration: "none",
              color: "inherit",
              fontWeight: "bold",
            }}
          >
            InfoESCOM
          </Typography>
        </Box>
        {/* Derecha: íconos */}
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
        <IconButton
            color="inherit"
            component={Link}
            to="/feed"
            onClick={() => {
              setSelectedArea(null); // Restablecer área seleccionada
              setSelectedSubArea(null); // Restablecer subárea seleccionada
            }}
          >
            <HomeIcon />
          </IconButton>
          <IconButton color="inherit" component={Link} to="/profile">
            <AccountCircleIcon />
          </IconButton>
          {userRole === "encargado" && (
            <IconButton color="inherit" component={Link} to="/encargado">
              <EditIcon />
            </IconButton>
          )}
          {userRole === "jefe" && (
            <IconButton color="inherit" component={Link} to="/jefe">
              <ChecklistIcon />
            </IconButton>
          )}
          {userRole === "administrador" && (
            <>
              <IconButton color="inherit" onClick={handleAdminMenuClick}>
                <MenuBookIcon />
              </IconButton>
              <Menu
                anchorEl={adminMenuAnchor}
                open={Boolean(adminMenuAnchor)}
                onClose={handleAdminMenuClose}
              >
                <MenuItem
                  component={Link}
                  to="/dashboard/areas"
                  onClick={handleAdminMenuClose}
                >
                  Áreas
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/dashboard/usuarios"
                  onClick={handleAdminMenuClose}
                >
                  Usuarios
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/dashboard/comunicados"
                  onClick={handleAdminMenuClose}
                >
                  Comunicados
                </MenuItem>
              </Menu>
            </>
          )}
          <IconButton color="inherit" component={Link} to="/notificaciones">
            <EditNotificationsIcon />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
