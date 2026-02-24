const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  src: { type: String, required: true },
  title: { type: String, default: '' },
  category: { type: String, default: 'gallery' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
