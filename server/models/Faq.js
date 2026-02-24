const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  q: { type: String, required: true },
  a: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Faq', faqSchema);
