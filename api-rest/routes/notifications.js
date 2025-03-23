// routes/notifications.js
const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');

// Configurar las claves VAPID usando variables de entorno
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:joaquin.ros.sed15@gmail.com', // Cambia esto por el correo de contacto del responsable
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Endpoint para registrar la suscripción de notificaciones para un área específica
router.post('/subscribe', auth, async (req, res) => {
  const { area, subscription } = req.body;
  if (!area || !subscription) {
    return res.status(400).json({ message: "Se requieren 'area' y 'subscription'" });
  }
  try {
    let sub = await Subscription.findOne({ user: req.user.id, area });
    if (sub) {
      sub.subscription = subscription;
      await sub.save();
    } else {
      sub = new Subscription({
        user: req.user.id,
        area,
        subscription
      });
      await sub.save();
    }
    // Actualizar el campo "suscribed" en el usuario (añadiendo el área, sin duplicados)
    await require('../models/User').findByIdAndUpdate(req.user.id, { $addToSet: { suscribed: area } });
    res.status(201).json({ message: "Suscripción registrada correctamente", sub });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar la suscripción" });
  }
});


// Endpoint para retirar la suscripción de notificaciones para un área específica
router.delete('/unsubscribe', auth, async (req, res) => {
  const { area } = req.body;
  if (!area) {
    return res.status(400).json({ message: "Se requiere 'area'" });
  }
  try {
    const result = await Subscription.findOneAndDelete({ user: req.user.id, area });
    if (!result) {
      return res.status(404).json({ message: "No se encontró suscripción para el área especificada" });
    }
    // Remover el área del campo "suscribed" del usuario
    await require('../models/User').findByIdAndUpdate(req.user.id, { $pull: { suscribed: area } });
    res.json({ message: "Suscripción eliminada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al desuscribir" });
  }
});



// Endpoint para enviar notificaciones a todos los usuarios suscritos a un área
router.post('/send', auth, async (req, res) => {
  const { area, payload } = req.body;
  if (!area || !payload) {
    return res.status(400).json({ message: "Se requieren 'area' y 'payload'" });
  }
  try {
    // Buscar todas las suscripciones para el área especificada
    const subscriptions = await Subscription.find({ area });
    // Enviar notificaciones a cada suscripción encontrada
    const sendPromises = subscriptions.map(sub => {
      return webpush.sendNotification(sub.subscription, payload)
        .catch(err => console.error("Error enviando notificación a un usuario:", err));
    });
    await Promise.all(sendPromises);
    res.json({ message: "Notificaciones enviadas" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar notificaciones" });
  }
});

module.exports = router;
