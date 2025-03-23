// src/pages/VerifyEmailPage.jsx
import React, { useState } from 'react';
import { Container, Typography, CircularProgress, Alert, Button, Box } from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // inicia en false, espera a que se presione el botón
  const navigate = useNavigate();

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://infoescom.site/api/auth/verify-email?token=${token}`);
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "Tu cuenta ha sido verificada. Ahora puedes iniciar sesión.");
      } else {
        setMessage(data.message || "No se pudo verificar tu cuenta. El enlace puede haber expirado.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error al verificar tu cuenta.");
    } finally {
      setLoading(false);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <Container 
      sx={{ 
        mt: 4, 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      <Typography variant="h4" gutterBottom>
        Verificación de Cuenta
      </Typography>
      {token ? (
        <>
          {!loading && !message && (
            <Button variant="contained" color="primary" onClick={verifyEmail}>
              Verificar
            </Button>
          )}
          {loading && <CircularProgress />}
          {message && (
            <>
              <Alert severity={message.toLowerCase().includes("verificada") ? "success" : "error"} sx={{ mt: 2 }}>
                {message}
              </Alert>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Serás redirigido al inicio de sesión en 3 segundos.
              </Typography>
            </>
          )}
        </>
      ) : (
        <Alert severity="error">Token no proporcionado.</Alert>
      )}
    </Container>
  );
}

export default VerifyEmailPage;
