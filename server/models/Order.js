const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  discount: {
    tierAmount: Number,
    tier: String,
    promoCode: String,
    promoAmount: Number
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  payment: { type: String, default: 'cod' },
  carrier: { type: String, default: 'PetCare Express' },
  carrierPhone: { type: String, default: '1900 1234' },
  status: { type: String, enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
