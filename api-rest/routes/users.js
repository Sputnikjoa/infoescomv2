// routes/users.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");


// Obtener el perfil del usuario autenticado
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Actualizar el perfil del usuario autenticado (solo campos editables)
router.patch('/me', auth, async (req, res) => {
  try {
    // Impedir la actualización del correo
    if (req.body.email) delete req.body.email;

    // Si se envía una nueva contraseña, encriptarla
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      req.body.password = hashedPassword;
    }

    // Actualizar solo los campos permitidos (nombre y contraseña)
    const updates = {};
    if (req.body.name) updates.name = req.body.name; // Actualizar el nombre si está presente
    if (req.body.password) updates.password = req.body.password; // Actualizar la contraseña si está presente

    // Actualizar el usuario y retornar el documento actualizado (excluyendo la contraseña)
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Perfil actualizado', user: updatedUser });
  } catch (err) {
    console.error('Error al actualizar el perfil:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});



// recuperacion de contraseña
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });

    // Generar un token de restablecimiento con expiración corta (ej. 1 hora)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Configurar el transporte con nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // o el servicio que uses
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Construir el enlace de restablecimiento (ajusta la URL al dominio de tu frontend)
    const resetLink = `https://infoescom.site/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Recuperación de Contraseña",
      text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetLink}\nEl enlace expirará en 1 hora.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al enviar el correo" });
      } else {
        res.json({ message: "Correo de recuperación enviado" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validar que el token y la nueva contraseña estén presentes
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token y nueva contraseña son requeridos' });
    }

    // Validar la longitud de la contraseña
    if (newPassword.length < 7) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 7 caracteres' });
    }

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido o expirado' });
    }

    // Buscar al usuario
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Encriptar la nueva contraseña y actualizar el usuario
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en reset-password:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});
  
/**
 * Endpoint para obtener todos los usuarios (solo para administradores)
 */
router.get("/", auth, async (req, res) => {
  // Solo el administrador puede obtener la lista completa de usuarios
  if (req.user.role !== "administrador") {
    return res.status(403).json({ message: "No tienes permisos para acceder a esta ruta" });
  }
  try {
    // Se excluye la contraseña y se hace populate del área para mostrar el nombre
    const users = await User.find().select("-password").populate("area", "name");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


// Endpoint ADMIN PARA CREAR USUARIO
router.post('/', async (req, res) => {
  
  try {
    const { name, email, password, role, area} = req.body;
    // Validación del dominio de correo
    if (!/^[\w-\.]+@(?:[\w-]+\.)?ipn\.mx$/.test(email)) {
      return res.status(400).json({ message: "El correo debe ser del dominio ipn.mx" });
    }
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "El usuario ya existe" });
    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role, area, verified:true });
    await user.save();
    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});


// Endpoint ADMIN para actualizar datos de un usuario (por ejemplo, cambiar rol y asignar área)
router.patch("/:id", auth, async (req, res) => {
  // Solo el administrador puede actualizar los datos de otros usuarios
  if (req.user.role !== "administrador") {
    return res
      .status(403)
      .json({ message: "No tienes permisos para realizar esta acción" });
  }
  try {
    // Se reciben los datos a actualizar en el body (por ejemplo, role, area, etc.)
    const updates = req.body;
    // Actualizamos el usuario y devolvemos el nuevo documento
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario actualizado", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Endpoint ADMIN para eliminar un usuario
router.delete("/:id", auth, async (req, res) => {
  // Solo el administrador puede eliminar usuarios
  if (req.user.role !== "administrador") {
    return res
      .status(403)
      .json({ message: "No tienes permisos para eliminar usuarios" });
  }
  try {
    // Buscar y eliminar el usuario por ID
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



module.exports = router;
