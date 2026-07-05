const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const SeatHold = require('../models/seatHold');
const Booking = require('../models/booking');
const qrcode = require('qrcode');
const mongoose = require('mongoose');

// confirm booking for a hold
router.post('/confirm', async (req,res)=>{
  const {holdId} = req.body;
  if(!holdId) return res.status(400).json({error:'missing holdId'});

  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const hold = await SeatHold.findById(holdId).session(session);
    if(!hold) throw new Error('hold not found');
    if(hold.expiresAt < new Date()) throw new Error('hold expired');

    const event = await Event.findById(hold.eventId).session(session);
    if(!event) throw new Error('event not found');

    // mark seats booked
    for(const s of hold.seats){
      const seat = event.seats.find(x=>x.index===s);
      if(!seat || seat.holdId?.toString() !== hold._id.toString()) throw new Error('seat not held by this hold');
      seat.status = 'booked';
      seat.holdId = null;
    }

    await event.save({session});

    const payload = JSON.stringify({eventId: event._id, seats: hold.seats, email: hold.customerEmail});
    const qr = await qrcode.toDataURL(payload);

    const booking = await Booking.create([{eventId: event._id, seats: hold.seats, customerEmail: hold.customerEmail, qrPayload: qr}], {session});

    // remove hold
    await SeatHold.deleteOne({_id: hold._id}).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({booking: booking[0]});
  }catch(err){
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({error: err.message});
  }
});

module.exports = router;
