const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  author: { type: String, required: true },
  pet: { type: String, default: '' },
  petImage: { type: String, default: '' },
  text: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
