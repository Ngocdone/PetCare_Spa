const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  servicePrice: { type: Number, required: true },
  petType: { type: String, enum: ['dog', 'cat'], required: true },
  petWeight: { type: String, required: true },
  petName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  ownerAddress: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
