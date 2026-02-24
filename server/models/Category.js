const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  slug: { type: String },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
