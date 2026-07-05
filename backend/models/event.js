const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
  index: Number,
  status: { type: String, enum: ['available','held','booked'], default: 'available' },
  holdId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeatHold', default: null }
});

const EventSchema = new mongoose.Schema({
  title: String,
  date: Date,
  rows: Number,
  cols: Number,
  seats: [SeatSchema],
  createdAt: { type: Date, default: Date.now }
});

EventSchema.statics.createWithSeats = function({title, date, rows, cols}){
  const total = rows * cols;
  const seats = Array.from({length: total}).map((_,i)=>({index:i}));
  return this.create({title,date,rows,cols,seats});
}

module.exports = mongoose.model('Event', EventSchema);
