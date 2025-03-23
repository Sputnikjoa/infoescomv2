// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const nodemailer = require('nodemailer');


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, area } = req.body;
    
    // Validar que el correo pertenezca al dominio ipn.mx
    if (!/^[\w-\.]+@(?:[\w-]+\.)?ipn\.mx$/.test(email)) {
      return res.status(400).json({ message: "El correo debe ser del dominio ipn.mx" });
    }
    
    // Buscar si ya existe un usuario con ese correo
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.verified) {
        // Si ya está verificado, se informa que el usuario ya existe
        return res.status(400).json({ message: "El usuario ya existe" });
      } else {
        // Si el usuario existe pero no está verificado, reenviar el correo de verificación
        const verificationToken = jwt.sign(
          { id: existingUser._id },
          process.env.JWT_SECRET,
          { expiresIn: '5m' } // Token expira en 5 minutos
        );

        // Configurar nodemailer
        const transporter = nodemailer.createTransport({
          service: "gmail", // Ajusta según el servicio que utilices
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // Construir el enlace de verificación (ajusta la URL según tu frontend)
        const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Verifica tu cuenta en InfoEscom",
          text: `Hola ${existingUser.name},\n\nTu cuenta aún no ha sido verificada. Para activarla, haz clic en el siguiente enlace:\n${verificationLink}\n\nSi no solicitaste esta cuenta, ignora este mensaje.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error al reenviar el correo de verificación:", error);
          } else {
            console.log("Correo de verificación reenviado:", info.response);
          }
        });

        return res.status(200).json({
          message: "El usuario ya existe pero no ha sido verificado. Se ha reenviado el correo de verificación."
        });
      }
    }

    // Si el usuario no existe, proceder a crear uno nuevo
    const hashedPassword = await bcrypt.hash(password, 10);
    // Crear el usuario con verified en false
    const user = new User({ name, email, password: hashedPassword, role, area, verified: false });
    await user.save();

    // Generar token de verificación (expira en 5 minutos)
    const verificationToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Configurar nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // Ajusta según el servicio que uses
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Construir el enlace de verificación
    const verificationLink = `http://localhost:5173/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verifica tu cuenta en InfoEscom",
      text: `Hola ${name},\n\nPara activar tu cuenta, haz clic en el siguiente enlace:\n${verificationLink}\n\nSi no solicitaste esta cuenta, ignora este mensaje.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error al enviar el correo de verificación:", error);
      } else {
        console.log("Correo de verificación enviado:", info.response);
      }
    });

    res.status(201).json({ message: "Usuario registrado. Por favor, revisa tu correo para verificar tu cuenta." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



// Ruta para inicio de sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    // Verificar que la cuenta esté validada
    if (!user.verified) {
      return res.status(400).json({ message: "La cuenta no ha sido verificada. Revisa tu correo para activar tu cuenta. Si el link expiró regístrate de nuevo." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    // Crear token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        area: user.area 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});



router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: "Token de verificación no proporcionado." });

    // Verificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: "Token inválido o expirado." });
    }

    // Actualizar el usuario, estableciendo verified en true
    const user = await User.findByIdAndUpdate(decoded.id, { verified: true }, { new: true });
    console.log("Usuario verificado:");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

    // En lugar de redirigir, devolvemos un JSON indicando éxito
    res.json({ message: "Tu cuenta ha sido verificada. Ahora puedes iniciar sesión." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor." });
  }
});

module.exports = router;
