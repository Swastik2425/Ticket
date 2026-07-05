const mongoose = require('mongoose');

const SeatHoldSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  seats: [Number],
  customerEmail: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('SeatHold', SeatHoldSchema);
