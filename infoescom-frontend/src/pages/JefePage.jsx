import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

function JefePage() {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  
  const userRole = localStorage.getItem('role');
  useEffect(() => {
      if (userRole !== 'jefe') {
        navigate('/feed');
      }
      if (userRole== null){
        navigate('/login');
      }
    }, [userRole, navigate]);

  // Función para cargar las publicaciones pendientes de revisión.
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts/pending', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPosts(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Función que devuelve un color basado en el estado.
  const getStatusColor = (status) => {
    if (status.toLowerCase() === 'pendiente') return 'grey';
    if (status.toLowerCase() === 'aprobado') return 'green';
    if (status.toLowerCase() === 'rechazado') return 'red';
    return 'black';
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Publicaciones Pendientes
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length ? (
              posts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: getStatusColor(post.status) }}>
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      component={Link}
                      to={`/revision-post/${post._id}`}
                      disabled={post.status.toLowerCase() !== 'pendiente'}
                    >
                      Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No hay publicaciones pendientes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default JefePage;
