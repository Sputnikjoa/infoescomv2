// routes/areas.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Area = require('../models/Area');

/**
 * Crear una nueva área o subárea (solo para administradores)
 * Si se envía un campo "parent", se crea como subárea y se actualiza el área padre.
 */
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: "No tienes permisos para crear áreas" });
  }
  try {
    const newArea = new Area(req.body);
    const savedArea = await newArea.save();

    // Si se especifica un "parent", actualizamos el área padre para agregar la subárea.
    if (req.body.parent) {
      await Area.findByIdAndUpdate(req.body.parent, { $push: { subareas: savedArea._id } });
    }
    res.status(201).json(savedArea);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Obtener las áreas de nivel superior junto con sus subáreas.
 * Se incluye el campo "focus" en cada área y subárea.
 */
router.get('/', async (req, res) => {
  try {
    // Se buscan áreas sin "parent" (nivel superior)
    const areas = await Area.find({ parent: { $exists: false } })
      .populate({
        path: 'subareas',
        select: 'name focus', // Incluye los campos deseados en las subáreas
      })
      .sort({ name: 1 });
    res.json(areas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Actualizar un área (solo para administradores)
 */
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: "No tienes permisos para actualizar áreas" });
  }
  try {
    const updatedArea = await Area.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedArea) {
      return res.status(404).json({ message: "Área no encontrada" });
    }
    res.json(updatedArea);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * Eliminar un área (solo para administradores)
 * Se elimina el área y, si tiene un "parent", se remueve su ID de la lista de subáreas del padre.
 */
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ message: "Solo el administrador puede eliminar áreas" });
  }
  try {
    const deletedArea = await Area.findByIdAndDelete(req.params.id);
    if (!deletedArea) {
      return res.status(404).json({ message: "Área no encontrada" });
    }
    // Si el área tiene un padre, eliminar su referencia del array de subáreas.
    if (deletedArea.parent) {
      await Area.findByIdAndUpdate(deletedArea.parent, { $pull: { subareas: deletedArea._id } });
    }
    res.json({ message: "Área eliminada", area: deletedArea });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
