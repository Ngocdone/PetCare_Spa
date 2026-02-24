const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  category: { type: String, default: 'cham-soc' },
  petType: { type: String, enum: ['cho', 'meo', 'both'], default: 'both' },
  image: { type: String, default: '' },
  rating: { type: Number, default: 4.5 },
  bestSeller: { type: Boolean, default: false },
  description: { type: String, default: '' },
  stock: { type: Number }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

productSchema.virtual('id').get(function () { return this._id?.toString?.() || this._id; });

productSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || 'product-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
