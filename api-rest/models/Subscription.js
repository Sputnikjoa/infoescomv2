// models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area', required: true },
  subscription: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
