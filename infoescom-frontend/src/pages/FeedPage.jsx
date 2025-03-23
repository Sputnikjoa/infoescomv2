import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemText,
  Modal,
  Avatar,
  Divider,
  TextField,
  Button,
  Switch,
  FormControlLabel
} from "@mui/material";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DeleteIcon from "@mui/icons-material/Delete"; // Icono para eliminar
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import InfiniteScroll from "react-infinite-scroll-component";
import { useSearchParams, useNavigate } from "react-router-dom";
import Link from "@mui/material/Link";

import { ExpandMore, ExpandLess } from "@mui/icons-material"; // Íconos para desplegar/contraer

function QuiltedImageList({ images, getImageUrl, onImageClick }) {
  return (
    <ImageList variant="masonry" cols={3} gap={8} sx={{ width: "100%", margin: 0 }}>
      {images.map((img, index) => (
        <ImageListItem key={index} cols={1} rows={1}>
          <img
            src={`${getImageUrl(img)}?w=248&fit=crop&auto=format`}
            srcSet={`${getImageUrl(img)}?w=248&fit=crop&auto=format&dpr=2 2x`}
            alt={`imagen ${index + 1}`}
            loading="lazy"
            style={{ cursor: "pointer", borderRadius: "8px" }}
            onClick={() => onImageClick(getImageUrl(img), images, index)}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

// Función auxiliar para obtener la URL completa de la imagen o documento
const getFileUrl = (file) => {
  if (file.startsWith("uploads/")) {
    return `http://localhost:5000/${file}`;
  }
  return file;
};

const renderContentWithLinks = (text) => {
  // Dividimos el texto usando una expresión regular para URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    // Si el segmento coincide con el patrón de URL, se envuelve en el componente Link
    if (part.match(/https?:\/\/[^\s]+/)) {
      return (
        <Link
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ wordBreak: "break-all" }}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areasMap, setAreasMap] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSubArea, setSelectedSubArea] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem("token");
  const limit = 200;

  const [searchParams] = useSearchParams();
  const searchQueryParam = searchParams.get("search") || "";

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [modalImages, setModalImages] = useState([]); // Array de imágenes del post actual
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Estado para el modal de eliminación
  const [selectedPostId, setSelectedPostId] = useState(null); // ID del post seleccionado para eliminar
  const [deleteReason, setDeleteReason] = useState(""); // Motivo de la eliminación
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const userRole = localStorage.getItem("role");
  useEffect(() => {
    if (userRole == null) {
      navigate("/login");
    }
  }, [userRole, navigate]);

  // Función para convertir la clave VAPID
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  };

  // Obtener las suscripciones del usuario
  const fetchUserSubscriptions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUserSubscriptions(data.suscribed || []);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Obtener la suscripción push
  const getSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("La clave VAPID no está definida en las variables de entorno.");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      return subscription;
    } catch (error) {
      console.error("Error al obtener la suscripción:", error);
      return null;
    }
  };



  // Manejar la suscripción/desuscripción
  const handleToggleSubscription = async (areaId) => {
    try {
      const subscription = await getSubscription();
      if (!subscription) {
        throw new Error("No se pudo obtener la suscripción push.");
      }

      if (userSubscriptions.includes(areaId)) {
        // Desuscribir
        const response = await fetch("http://localhost:5000/api/notifications/unsubscribe", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ area: areaId }),
        });
        const data = await response.json();
        if (response.ok) {
          setUserSubscriptions((prev) => prev.filter((id) => id !== areaId));
        } else {
          console.error(data.message);
        }
      } else {
        // Suscribir
        const response = await fetch("http://localhost:5000/api/notifications/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ area: areaId, subscription }),
        });
        const data = await response.json();
        if (response.ok) {
          setUserSubscriptions((prev) => [...prev, areaId]);
        } else {
          console.error(data.message);
        }
      }
    } catch (err) {
      console.error("Error al actualizar la suscripción:", err);
    }
  };

  useEffect(() => {
    fetchUserSubscriptions();
  }, [token]);

  // Renderizar la campana de notificaciones
  const renderNotificationBell = () => {
    const areaId = selectedSubArea || selectedArea;
    if (!areaId) return null;
  
    const isSubscribed = userSubscriptions.includes(areaId);
  
    return (
      <IconButton
        onClick={() => handleToggleSubscription(areaId)}
        color={isSubscribed ? "primary" : "default"}
        sx={{ mt:1,mb:2 }}
      >
        {isSubscribed ? <NotificationsIcon /> : <NotificationsOffIcon />}
      </IconButton>
    );
  };


  // Función para calcular el tiempo transcurrido
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const updatedAt = new Date(dateString);
    const diffInMilliseconds = now - updatedAt;
    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
        return "Hace menos de una hora";
    } else if (diffInHours === 1) {
        return "Hace 1 hora";
    } else if (diffInHours < 24) {
        return `Hace ${diffInHours} horas`;
    } else if (diffInDays === 1) {
        return "Hace 1 día";
    } else if (diffInDays <= 3) {
        return `Hace ${diffInDays} días`;
    } else {
        // Formatear la fecha en "día - mes - año"
        const day = updatedAt.getDate();
        const month = updatedAt.getMonth() + 1; // Los meses en JavaScript van de 0 a 11
        const year = updatedAt.getFullYear();
        return `${day}-${month}-${year}`;
    }
};

  const fetchPosts = async () => {
    try {
      let url = `http://localhost:5000/api/posts/approved?page=${page}&limit=${limit}`;
      if (selectedSubArea) url += `&area=${selectedSubArea}`;
      else if (selectedArea) url += `&area=${selectedArea}`;
      if (searchQueryParam) url += `&search=${encodeURIComponent(searchQueryParam)}`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPosts((prevPosts) => {
          const newPosts = data.posts.filter(
            (newPost) => !prevPosts.some((post) => post._id === newPost._id)
          );
          return [...prevPosts, ...newPosts];
        });
        if (data.posts.length < limit) {
          setHasMore(false);
        } else {
          setPage((prevPage) => prevPage + 1);
        }
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

    // Efecto para reiniciar área y subárea cuando se ingresa una búsqueda global
    useEffect(() => {
      if (searchQueryParam) {
        setSelectedArea(null);
        setSelectedSubArea(null);
      }
    }, [searchQueryParam]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPosts();
  }, [selectedArea, selectedSubArea, searchQueryParam]);

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
        const map = {};
        data.forEach((area) => {
          map[area._id] = area.name;
          if (area.subareas) {
            area.subareas.forEach((subarea) => {
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

  const handleToggleLike = async (postId, index) => {
    const currentPost = posts[index];
    const likedByStrings = currentPost.likedBy
      ? currentPost.likedBy.map((item) => item.toString())
      : [];
    const endpoint = likedByStrings.includes(userId) ? "unlike" : "like";

    try {
      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}/${endpoint}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setPosts((prevPosts) => {
          const updated = [...prevPosts];
          updated[index].like = data.likeCount;
          updated[index].likedBy =
            endpoint === "like"
              ? [...(updated[index].likedBy || []), userId]
              : updated[index].likedBy.filter((id) => id.toString() !== userId);
          return updated;
        });
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error al dar/quitar like:", error);
    }
  };

  const getImageUrl = (img) => {
    if (img.startsWith("uploads/")) return `http://localhost:5000/${img}`;
    return img;
  };

  const handleImageClick = (imgUrl, imagesArray, index) => {
    setModalImages(imagesArray);
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedImage("");
    setModalImages([]);
    setCurrentImageIndex(0);
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < modalImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const handleAreaClick = (areaId) => {
    setSelectedArea(areaId);
    setSelectedSubArea(null);
    navigate("/feed"); // Restablecer la URL sin el parámetro de búsqueda
  };

  const handleSubAreaClick = (subAreaId) => {
    setSelectedSubArea(subAreaId);
    navigate("/feed"); // Restablecer la URL sin el parámetro de búsqueda
  };

  // Función para abrir el modal de eliminación
  const handleDeleteClick = (postId) => {
    setSelectedPostId(postId);
    setDeleteModalOpen(true);
  };

  // Función para cerrar el modal de eliminación
  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedPostId(null);
    setDeleteReason("");
  };

  // Función para eliminar el post
  const handleDeletePost = async () => {
    if (!deleteReason) {
      alert("Debes ingresar un motivo para eliminar el post.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/posts/${selectedPostId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deleteReason }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Eliminar el post de la lista
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== selectedPostId)
        );
        handleCloseDeleteModal();
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error al eliminar el post:", error);
    }
  };

  const renderAreaMenu = () => {
    const topAreas = areas.filter((area) => !area.parent);
    return (
      <Box
        sx={{
          display: 'flex',
          overflowX: 'auto',
          gap: 2,
          p: 1,
          borderBottom: '1px solid #e0e0e0',
          // Estilos para la barra de scroll (solo WebKit)
          '&::-webkit-scrollbar': {
            height: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#ccc',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }}
      >
        {topAreas.map((area) => (
           <Typography
           key={area._id}
           variant="body1"
           onClick={() => handleAreaClick(area._id)}
           sx={{
             cursor: 'pointer',
             px: 1,
             py: 0.5,
             borderRadius: 1,
             // Convertir el Typography en un contenedor flex para centrar el contenido en ambas direcciones:
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             textAlign: 'center',
             fontWeight: selectedArea === area._id ? 'bold' : 'normal',
             color: selectedArea === area._id ? 'primary.main' : 'text.primary',
             backgroundColor: selectedArea === area._id ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
             transition: 'background-color 0.3s, color 0.3s',
             '&:hover': {
               backgroundColor: 'rgba(25, 118, 210, 0.05)',
             },
             // Opcional: definir un tamaño mínimo para que el centrado sea consistente
             minWidth: '100px',
             minHeight: '40px',
           }}
         >
           {area.name}
         </Typography>
        ))}
      </Box>
    );
  };
  

  const renderSubAreaList = () => {
    if (!selectedArea) return null;
    const selectedAreaData = areas.find((area) => area._id === selectedArea);
    const subAreas = selectedAreaData ? selectedAreaData.subareas : [];
    if (subAreas.length === 0) return null;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", mb: 2, pl: 2, mt: 3 }}>
        {subAreas.map((sub) => (
          <Typography
            key={sub._id}
            variant="body2"
            onClick={() => handleSubAreaClick(sub._id)}
            sx={{ 
              cursor: "pointer", 
              mb: 1,
              fontWeight: selectedSubArea === sub._id ? "bold" : "normal"
            }}
          >
            {sub.name}
          </Typography>
        ))}
      </Box>
    );
  };
  

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {renderAreaMenu()}
      {renderSubAreaList()}
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between", // Alinea el contenido a los extremos
        alignItems: "center", // Centra verticalmente los elementos
      }}
    >
      <Box>
        
      </Box>
      {renderNotificationBell()} {/* La campana aparecerá a la derecha */}
    </Box>
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchPosts}
        hasMore={hasMore}
        loader={<Typography align="center">Cargando...</Typography>}
        endMessage={<Typography align="center">No hay más posts</Typography>}
      >
        {posts.map((post, index) => (
          <Card
            key={post._id}
            sx={{
              mb: 5,
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            <CardContent sx={{ p: 2 }}>
              {/* Header del Post */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                  {post.area && typeof post.area === "object"
                    ? post.area.name.charAt(0).toUpperCase()
                    : areasMap[post.area]
                    ? areasMap[post.area].charAt(0).toUpperCase()
                    : "?"}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {post.title} {/* Mostrar el título del post */}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {post.area && typeof post.area === "object"
                      ? post.area.name
                      : areasMap[post.area] || "Área desconocida"}{" "}
                    • {getTimeAgo(post.createdAt)}
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {/* Contenido del Post */}
              <Typography variant="body1" sx={{ mb: 2 }}>
                {renderContentWithLinks(post.content)}
              </Typography>

              {/* Imágenes */}
              {post.images && post.images.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {post.images.length === 1 ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={getImageUrl(post.images[0])}
                        alt="imagen única"
                        style={{
                          maxWidth: "calc(100% - 16px)", // Ocupa el ancho máximo con un margen ligero
                          height: "auto",
                          borderRadius: "8px",
                        }}
                        onClick={() =>
                          handleImageClick(getImageUrl(post.images[0]), post.images, 0)
                        }
                      />
                    </Box>
                  ) : (
                    <QuiltedImageList
                      images={post.images}
                      getImageUrl={getImageUrl}
                      onImageClick={handleImageClick}
                    />
                  )}
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
                      const fileName = doc.split("/").pop(); // Extraer el nombre del archivo
                      return (
                        <ListItem key={index} disablePadding>
                          <ListItemText
                            primary={
                              <a
                                href={getFileUrl(doc)} // Usar la función getFileUrl para la URL
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  textDecoration: "none",
                                  color: "#1976d2",
                                }}
                              >
                                {fileName}{" "}
                                {/* Mostrar el nombre del archivo con extensión */}
                              </a>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}
            </CardContent>
            <CardActions sx={{ borderTop: "1px solid #e0e0e0", p: 1 }}>
              <IconButton onClick={() => handleToggleLike(post._id, index)}>
                {post.likedBy &&
                Array.isArray(post.likedBy) &&
                post.likedBy.map((id) => id.toString()).includes(userId) ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {post.like || 0}
                </Typography>
              </IconButton>
              {/* Botón de eliminar (solo para administradores) */}
              {userRole === "administrador" && (
                <IconButton onClick={() => handleDeleteClick(post._id)}>
                  <DeleteIcon color="error" />
                </IconButton>
              )}
            </CardActions>
          </Card>
        ))}
      </InfiniteScroll>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
         <Box sx={{ position: "relative", outline: "none" }}>
          <img
            src={modalImages[currentImageIndex] ? getImageUrl(modalImages[currentImageIndex]) : ""}
            alt="Ampliada"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "8px" }}
          />
          {/* Botón para retroceder, visible si no es la primera imagen */}
          {modalImages.length > 1 && currentImageIndex > 0 && (
            <IconButton
              onClick={handlePrevImage}
              sx={{
                position: "absolute",
                top: "50%",
                left: 16,
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
              }}
            >
              <ArrowBackIosIcon />
            </IconButton>
          )}
          {/* Botón para avanzar, visible si no es la última imagen */}
          {modalImages.length > 1 && currentImageIndex < modalImages.length - 1 && (
            <IconButton
              onClick={handleNextImage}
              sx={{
                position: "absolute",
                top: "50%",
                right: 16,
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0,0,0,0.5)",
                color: "white",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.7)" },
              }}
            >
              <ArrowForwardIosIcon />
            </IconButton>
          )}
        </Box>
      </Modal>
      {/* Modal de eliminación */}
      <Modal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{ backgroundColor: "white", p: 4, borderRadius: 2, width: 400 }}
        >
          <Typography variant="h6" gutterBottom>
            Motivo de la eliminación
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Escribe el motivo..."
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePost}
            sx={{ mr: 2 }}
          >
            Eliminar
          </Button>
          <Button variant="outlined" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
        </Box>
      </Modal>
    </Container>
  );
}

export default FeedPage;
