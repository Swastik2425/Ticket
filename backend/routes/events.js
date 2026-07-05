const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const SeatHold = require('../models/seatHold');
const mongoose = require('mongoose');

// Create event with seat map
router.post('/', async (req,res)=>{
  const {title,date,rows,cols} = req.body;
  if(!title||!rows||!cols) return res.status(400).json({error:'missing fields'});
  const event = await Event.createWithSeats({title,date,rows,cols});
  res.json(event);
});

// List events
router.get('/', async (req,res)=>{
  const events = await Event.find().lean();
  res.json(events);
});

// Hold seats
router.post('/:id/hold', async (req,res)=>{
  const eventId = req.params.id;
  const {seats, customerEmail, ttlSeconds} = req.body;
  if(!seats || !Array.isArray(seats) || seats.length===0) return res.status(400).json({error:'no seats'});

  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const event = await Event.findById(eventId).session(session);
    if(!event) throw new Error('event not found');

    // check availability
    for(const s of seats){
      const seat = event.seats.find(x=>x.index===s);
      if(!seat || seat.status!=='available') throw new Error(`seat ${s} not available`);
    }

    // create hold
    const holdTtl = (ttlSeconds || parseInt(process.env.HOLD_TTL_SECONDS) || 600);
    const expiresAt = new Date(Date.now() + holdTtl*1000);
    const hold = await SeatHold.create([{eventId, seats, customerEmail, expiresAt}], {session});

    // mark seats as held
    for(const s of seats){
      const seat = event.seats.find(x=>x.index===s);
      seat.status = 'held';
      seat.holdId = hold[0]._id;
    }
    await event.save({session});

    await session.commitTransaction();
    session.endSession();

    res.json({holdId: hold[0]._id, expiresAt});
  }catch(err){
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({error: err.message});
  }
});

module.exports = router;
