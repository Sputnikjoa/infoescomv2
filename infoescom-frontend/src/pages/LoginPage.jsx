// src/pages/LoginPage.jsx
import React, { useState,useContext } from "react";
import {
  Container,
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Link as MuiLink,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../ThemeContext";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { mode } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Error en el inicio de sesión");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("userArea", data.user.area);
        localStorage.setItem("userId", data.user.id);
        navigate("/feed");
      }
    } catch (err) {
      console.error(err);
      setError("Error en el inicio de sesión");
    }
  };

  return (
    <Container maxWidth={false} disableGutters>
      <Grid container sx={{ minHeight: "100vh" }}>
        {/* En móviles, el formulario tendrá order 1 y la bienvenida order 2; en pantallas medianas en adelante se mantiene lado a lado */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            order: { xs: 2, md: 1 },
            background: mode === "light"
            ? "linear-gradient(0deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)"
            : "linear-gradient(0deg, rgba(0,153,230,0.91) 0%, rgba(0,64,128,1) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <Box sx={{ p: 4 }}>
            <Typography variant="h3" gutterBottom>
              Bienvenido
            </Typography>
            <Typography variant="h6">
              Visualiza Anuncios,
              <br />
              Administra tus notificaciones,
              <br />
              Mantente siempre conectado,
              <br />
              Infórmate de la ESCOM
            </Typography>
          </Box>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            order: { xs: 1, md: 2 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <Typography variant="h3" align="center" gutterBottom>
              INFOESCOM
            </Typography>
            <Typography variant="h4" align="center" gutterBottom>
              INICIA SESIÓN
            </Typography>
            {error && (
              <Typography
                variant="body1"
                color="error"
                align="center"
                gutterBottom
              >
                {error}
              </Typography>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <TextField
                label="Contraseña"
                variant="outlined"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Box sx={{ textAlign: "right", mt: 1 }}>
                <MuiLink href="/forgot-password" variant="body2" underline="hover">
                  ¿Olvidaste tu contraseña?
                </MuiLink>
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
              >
                INICIAR SESIÓN
              </Button>
            </form>
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2">
                ¿No tienes cuenta?{" "}
                <MuiLink href="/signup" underline="hover">
                  Regístrate*
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default LoginPage;
