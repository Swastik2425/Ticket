const SeatHold = require('../models/seatHold');
const Event = require('../models/event');

let timer = null;

async function cleanupExpired(){
  const now = new Date();
  const expired = await SeatHold.find({expiresAt: {$lte: now}});
  for(const h of expired){
    // release seats
    const event = await Event.findById(h.eventId);
    if(event){
      for(const s of h.seats){
        const seat = event.seats.find(x=>x.index===s);
        if(seat && seat.status==='held' && seat.holdId?.toString() === h._id.toString()){
          seat.status = 'available';
          seat.holdId = null;
        }
      }
      await event.save();
    }
    await SeatHold.deleteOne({_id: h._id});
  }
}

module.exports = {
  start(){
    const interval = parseInt(process.env.HOLD_CLEAN_INTERVAL_MS || '5000');
    timer = setInterval(()=>{
      cleanupExpired().catch(err=>console.error('holdCleaner',err));
    }, interval);
  },
  stop(){
    if(timer) clearInterval(timer);
  }
}
