// models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  images: [{ type: String }], // Rutas de imágenes
  documents: [{ type: String }], // Rutas de documentos (p.ej., PDF)
  tags: [{ type: String }],
  area: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Area' },
  author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  status: { type: String, enum: ['pendiente', 'aprobado', 'rechazado'], default: 'pendiente' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  edits: [{ type: String }],
  sign: { type: String },// Ya no es obligatorio en la creación
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  like: { type: Number, default: 0 },
  deleted: { type: Boolean, default: false },         // Nuevo campo para baja
  deleteReason: { type: String, default: '' }           // Motivo de baja
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
