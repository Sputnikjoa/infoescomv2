// models/Area.js
const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subareas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Area' }],
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
  focus: { type: [String], required: true, enum: ['alumno', 'docente', 'paae'] }
}, { timestamps: true });

module.exports = mongoose.model('Area', areaSchema);
