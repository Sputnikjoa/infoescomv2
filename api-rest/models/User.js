// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[\w-\.]+@(?:[\w-]+\.)?ipn\.mx$/, 'El correo debe ser del dominio ipn.mx']
  },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['administrador', 'jefe', 'encargado', 'alumno', 'docente', 'paae'], 
    default: 'alumno'
  },
  suscribed: [{ type: String }], // IDs de las áreas a las que está suscrito
  area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
  verified: { type: Boolean, default: false } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
