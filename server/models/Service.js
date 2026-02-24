const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String },
  description: { type: String, default: '' },
  priceDog: { type: Number, required: true },
  priceCat: { type: Number, required: true },
  duration: { type: Number, default: 60 },
  unit: { type: String, default: 'phút' },
  image: { type: String, default: '' },
  featured: { type: Boolean, default: true },
  category: { type: String, default: 'grooming' },
  petType: { type: String, enum: ['cho', 'meo', 'both'], default: 'both' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

serviceSchema.virtual('id').get(function () { return this._id?.toString?.() || this._id; });

serviceSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'service-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
