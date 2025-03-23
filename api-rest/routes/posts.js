// routes/posts.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const { query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Configuración de multer para almacenamiento en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Obtener la fecha actual en formato YYYYMMDD
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
    // Conservar el nombre original del archivo
    const originalName = path.parse(file.originalname).name; // Nombre sin extensión
    const ext = path.extname(file.originalname); // Extensión del archivo
    // Crear el nombre del archivo: {FECHA}-NOMBREORIGINAL.{EXTENSION}
    const fileName = `${datePrefix}-${originalName}${ext}`;
    cb(null, fileName);
  }
});
const upload = multer({ storage: storage });

/**
 * Endpoint para crear una nueva publicación (solo para encargados)
 * Se utiliza multer para procesar el multipart/form-data y almacenar los archivos en disco.
 */
router.post('/', auth, upload.any(), async (req, res) => {
  try {
    if (req.user.role !== 'encargado') {
      return res.status(403).json({ message: "No tienes permisos para crear publicaciones" });
    }
    // Filtrar archivos: imágenes y documentos
    const imagesFiles = req.files.filter(file => file.mimetype.startsWith('image/'));
    const documentFiles = req.files.filter(file => file.mimetype.startsWith('application/'));
    // Convertir backslashes a forward slashes en las rutas
    const imagesPaths = imagesFiles.map(file => file.path.replace(/\\/g, '/'));
    const documentsPaths = documentFiles.map(file => file.path.replace(/\\/g, '/'));

    // Crear el post usando los campos enviados y las rutas de archivos.
    const newPost = new Post({
      ...req.body,
      images: imagesPaths,
      documents: documentsPaths,
      author: req.user.id
    });
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Endpoint para obtener todas las publicaciones aprobadas (para usuarios finales)
 */
// Endpoint para obtener todas las publicaciones aprobadas (para usuarios finales)
router.get('/approved', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor o igual a 1'),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit debe ser un entero mayor o igual a 1'),
  query('search').optional().isString().trim(),
  query('area').optional().isMongoId().withMessage('area debe ser un ID válido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { search, area, page = 1, limit = 200 } = req.query;
    const userRole = req.user.role; // Obtener el rol del usuario desde el token

    // Filtro base para posts aprobados y no eliminados
    let filter = { status: 'aprobado', deleted: false };

    // Si se especifica un área, filtrar por esa área
    if (area) {
      filter.area = area;
    }

    // Si hay una búsqueda, agregar filtro de búsqueda
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Obtener todos los posts aprobados
    let posts = await Post.find(filter)
      .populate('author', 'name email')
      .populate('area', 'name focus') // Incluir el campo "focus" del área
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación (más reciente primero)

    // Si el usuario no es administrador, aplicar lógica de enfoque (focus)
    if (userRole !== 'administrador') {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Separar los posts en dos grupos:
      // 1. Posts de las últimas 24 horas que coinciden con el enfoque del usuario
      // 2. El resto de los posts
      const postsLast24Hours = posts.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= twentyFourHoursAgo && post.area.focus.includes(userRole);
      });

      const otherPosts = posts.filter(post => {
        const postDate = new Date(post.createdAt);
        return !(postDate >= twentyFourHoursAgo && post.area.focus.includes(userRole));
      });

      // Combinar los dos grupos, con los posts de las últimas 24 horas primero
      posts = [...postsLast24Hours, ...otherPosts];
    }

    // Paginar los resultados
    const paginatedPosts = posts.slice(skip, skip + limitInt);
    const total = posts.length;

    res.json({
      page: pageInt,
      limit: limitInt,
      total,
      posts: paginatedPosts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Endpoint para listar publicaciones pendientes de revisión (solo para jefes)
 */
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'jefe') {
      return res.status(403).json({ message: "No tienes permisos para acceder a esta ruta" });
    }
    const jefeUser = await User.findById(req.user.id);
    if (!jefeUser || !jefeUser.area) {
      return res.status(400).json({ message: "El usuario no tiene asignada un área" });
    }
    // Populamos también el área para mostrar su nombre en el frontend
    const posts = await Post.find({ status: 'pendiente', area: jefeUser.area })
                            .populate('author', 'name email')
                            .populate('area', 'name');
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Endpoint para listar publicaciones del encargado
 */
router.get('/myPosts', auth, async (req, res) => {
  try {
    if (req.user.role !== 'encargado') {
      return res.status(403).json({ message: "No tienes permisos para acceder a esta ruta" });
    }
    const posts = await Post.find({ author: req.user.id });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Endpoint para dar like a un comunicado
 */
router.patch('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post no encontrado' });
    if (post.likedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'Ya has dado like a este post' });
    }
    post.likedBy.push(req.user.id);
    post.like = post.likedBy.length;
    await post.save();
    res.json({ message: 'Post liked', likeCount: post.like });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * Endpoint para quitar like a un comunicado
 */
router.patch('/:id/unlike', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post no encontrado' });
    // Verificar que el usuario ya dio like
    if (!post.likedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'No has dado like a este post' });
    }
    // Quitar el ID del usuario del array likedBy
    post.likedBy = post.likedBy.filter(userId => userId.toString() !== req.user.id);
    post.like = post.likedBy.length;
    await post.save();
    res.json({ message: 'Like removido', likeCount: post.like });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


/**
 * Endpoint para que el jefe de área apruebe o rechace una publicación
 */
// Endpoint para que el jefe de área apruebe o rechace una publicación
// Se añade upload.single('sign') para procesar el archivo de firma (si se envía)
router.patch('/:id/review', auth, upload.single('sign'), async (req, res) => {
  try {
    if (req.user.role !== 'jefe') {
      return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
    }
    // Extraer y limpiar el campo status
    const status = req.body.status ? req.body.status.trim() : '';
    const { feedback } = req.body;
    // Validar que status sea "aprobado" o "rechazado"
    if (!['aprobado', 'rechazado'].includes(status)) {
      return res.status(400).json({ message: "Estado inválido, debe ser 'aprobado' o 'rechazado'" });
    }
    // Asegurarse de que el campo area esté poblado para usar su nombre
    const post = await Post.findById(req.params.id).populate('area', 'name').populate('author', 'name email');;
    if (!post) return res.status(404).json({ message: "Publicación no encontrada" });

    // Validar que el jefe revise publicaciones de su propia área
    const jefeUser = await User.findById(req.user.id);
    // Aquí se compara el área del jefe (que es un ObjectId) con el _id del área poblada en el post
    if (!jefeUser.area || jefeUser.area.toString() !== post.area._id.toString()) {
      return res.status(403).json({ message: "No tienes permisos para revisar publicaciones de otra área" });
    }

    // Actualizar el estado
    post.status = status;
    if (status === 'aprobado') {
      post.approvedBy = req.user.id;
      // Para aprobar se requiere adjuntar la firma
      if (!req.file) {
        return res.status(400).json({ message: "Se requiere la firma para aprobar el comunicado" });
      }
      // Convertir la ruta de la firma a forward slashes
      post.sign = req.file.path.replace(/\\/g, '/');
    } else if (status === 'rechazado') {
      if (!feedback || !feedback.trim()) {
        return res.status(400).json({ message: "Para rechazar, se requiere feedback" });
      }
      post.edits.push(feedback.trim());
    }
    await post.save();

    // Si se aprobó, llamar al endpoint de notificaciones para enviar alertas a los usuarios suscritos
    if (status === 'aprobado') {
      // Construir el payload con el nombre del área y el título del comunicado.
      const payloadData = {
        title: `Nuevo comunicado del ${post.area.name}`,
        body: post.title,
      };

      // Llamar al endpoint de notificaciones (se reusa el token)
      const notifResponse = await fetch('http://localhost:5000/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization,
        },
        body: JSON.stringify({
          area: post.area._id,
          payload: JSON.stringify(payloadData)
        }),
      });
      const notifData = await notifResponse.json();
      console.log("Notificaciones enviadas: ", notifData.message);
    }

    res.json({ message: "Publicación actualizada", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



/**
 * Endpoint para que el encargado edite una publicación rechazada
 */
router.patch('/:id', auth, upload.any(), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar este comunicado' });
    }
    if (post.status !== 'rechazado') {
      return res.status(400).json({ message: 'Solo puedes editar un comunicado rechazado' });
    }

    // Actualizar campos enviados en req.body
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;

    // Procesar imágenes eliminadas
    if (req.body.deletedImages) {
      const deletedImages = JSON.parse(req.body.deletedImages); // Convertir a array
      deletedImages.forEach((imagePath) => {
        // Eliminar la imagen del sistema de archivos
        const fullPath = path.join(__dirname, '..', imagePath); // Ruta completa al archivo
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath); // Eliminar el archivo
        }
      });

      // Eliminar las imágenes del array de imágenes del post
      post.images = post.images.filter((image) => !deletedImages.includes(image));
    }

    // Procesar documentos eliminados
    if (req.body.deletedDocuments) {
      const deletedDocuments = JSON.parse(req.body.deletedDocuments); // Convertir a array
      deletedDocuments.forEach((docPath) => {
        // Eliminar el documento del sistema de archivos
        const fullPath = path.join(__dirname, '..', docPath); // Ruta completa al archivo
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath); // Eliminar el archivo
        }
      });

      // Eliminar los documentos del array de documentos del post
      post.documents = post.documents.filter((doc) => !deletedDocuments.includes(doc));
    }

    // Si se han enviado nuevos archivos, procesarlos
    if (req.files && req.files.length > 0) {
      const imagesFiles = req.files.filter((file) => file.mimetype.startsWith('image/'));
      const documentFiles = req.files.filter((file) => file.mimetype.startsWith('application/'));

      const newImages = imagesFiles.map((file) => file.path.replace(/\\/g, '/'));
      const newDocuments = documentFiles.map((file) => file.path.replace(/\\/g, '/'));

      // Concatenar nuevas imágenes y documentos con los existentes
      post.images = [...post.images, ...newImages];
      post.documents = [...post.documents, ...newDocuments];
    }

    // Actualizar tags (asumiendo que se envían como una cadena separada por comas)
    if (req.body.tags) {
      post.tags = req.body.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '');
    }

    // Reiniciar el estado para enviarlo nuevamente a revisión
    post.status = 'pendiente';

    await post.save();
    res.json({ message: 'Comunicado actualizado y enviado a revisión nuevamente', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * Endpoint para eliminar (soft delete) un post (solo administrador)
 */
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: 'Solo el administrador puede eliminar posts.' });
  }
  
  const { deleteReason } = req.body;
  if (!deleteReason) {
    return res.status(400).json({ message: 'Se requiere un motivo para dar de baja el post.' });
  }
  
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      { deleted: true, deleteReason: deleteReason },
      { new: true }
    );
    
    if (!post) {
      return res.status(404).json({ message: 'Post no encontrado.' });
    }
    
    res.json({ message: 'Post dado de baja exitosamente', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * Endpoint para obtener un post por su ID
 * Este debe ir al final para no interferir con las rutas que usan '/:id'
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email');
    if (!post) {
      return res.status(404).json({ message: "Post no encontrado" });
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
