const API = (path, opts) => fetch(`http://localhost:4000/api${path}`, opts).then(async r=>{
  const txt = await r.text();
  try{ return JSON.parse(txt); }catch{ return txt; }
});

const statusEl = () => document.getElementById('status');

async function load(){
  setStatus('Loading events...');
  try{
    const events = await API('/events');
    const root = document.getElementById('events');
    root.innerHTML = '';
    if(!events || events.length===0){
      root.innerHTML = '<div>No events yet. Click "Create Sample Event" to add one.</div>';
      setStatus('No events');
      return;
    }
    for(const e of events){
      const el = document.createElement('div');
      el.className = 'event';
      el.innerHTML = `<h2>${e.title}</h2><div>Seats: ${e.rows}x${e.cols}</div><button data-id="${e._id}">Open</button>`;
      el.querySelector('button').onclick = ()=>openEvent(e);
      root.appendChild(el);
    }
    setStatus(`Loaded ${events.length} event(s)`);
  }catch(err){
    console.error(err);
    document.getElementById('events').innerHTML = '<div style="color:red">Failed to load events. Is the backend running?</div>';
    setStatus('Error loading events');
  }
}

function setStatus(text){
  const s = statusEl();
  if(s) s.textContent = text;
}

function openEvent(e){
  const w = window.open('', '_blank');
  w.document.write(`<h1>${e.title}</h1><pre>${JSON.stringify(e.seats.slice(0,100),null,2)}</pre>`);
}

async function createSampleEvent(){
  setStatus('Creating sample event...');
  try{
    const payload = {title: 'Sample Concert', date: new Date().toISOString(), rows: 6, cols: 8};
    const res = await API('/events', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    setStatus('Sample event created');
    await load();
  }catch(err){
    console.error(err);
    setStatus('Error creating event');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('create-sample');
  if(btn) btn.addEventListener('click', createSampleEvent);
  load();
});

// Event view and seat-map logic
let currentEvent = null;
let selectedSeats = new Set();
let currentHold = null;

function showEventView(ev){
  currentEvent = ev;
  selectedSeats = new Set();
  document.getElementById('events').style.display = 'none';
  document.getElementById('event-view').style.display = 'block';
  document.getElementById('ev-title').textContent = ev.title;
  document.getElementById('qr-area').innerHTML = '';
  document.getElementById('confirm-booking').style.display = 'none';
  document.getElementById('hold-info').textContent = '';
  renderSeatMap(ev);
}

document.addEventListener('click', (e)=>{
  if(e.target && e.target.id==='back-to-list'){
    document.getElementById('event-view').style.display='none';
    document.getElementById('events').style.display='block';
    load();
  }
});

function renderSeatMap(ev){
  const map = document.getElementById('seat-map');
  map.innerHTML = '';
  map.style.gridTemplateColumns = `repeat(${ev.cols}, 1fr)`;
  ev.seats.forEach(s=>{
    const btn = document.createElement('button');
    btn.className = 'seat '+(s.status||'available');
    btn.dataset.index = s.index;
    btn.textContent = s.index+1;
    if(s.status!=='available') btn.disabled = true;
    btn.onclick = ()=>toggleSelectSeat(s.index, btn);
    map.appendChild(btn);
  });
}

function toggleSelectSeat(index, btn){
  if(!btn) return;
  if(btn.disabled) return;
  if(selectedSeats.has(index)){
    selectedSeats.delete(index);
    btn.classList.remove('selected');
  }else{
    selectedSeats.add(index);
    btn.classList.add('selected');
  }
}

document.getElementById('hold-seats').addEventListener('click', async ()=>{
  if(!currentEvent) return;
  const seats = Array.from(selectedSeats);
  if(seats.length===0) return alert('Select seats first');
  const email = document.getElementById('customer-email').value || '';
  try{
    setStatus('Placing hold...');
    const res = await API(`/events/${currentEvent._id}/hold`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({seats, customerEmail: email})});
    if(res.error) throw new Error(res.error);
    currentHold = res;
    document.getElementById('hold-info').textContent = `Hold placed, expires ${new Date(res.expiresAt).toLocaleTimeString()}`;
    document.getElementById('confirm-booking').style.display = 'inline-block';
    // mark held seats visually
    seats.forEach(i=>{
      const b = document.querySelector(`#seat-map button[data-index='${i}']`);
      if(b){ b.classList.remove('selected'); b.classList.add('held'); b.disabled = true; }
    });
    selectedSeats.clear();
    setStatus('Hold placed');
  }catch(err){
    console.error(err);
    setStatus('Hold failed');
    alert('Failed to place hold: '+err.message);
  }
});

document.getElementById('confirm-booking').addEventListener('click', async ()=>{
  if(!currentHold) return alert('No hold to confirm');
  try{
    setStatus('Confirming booking...');
    const res = await API('/bookings/confirm', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({holdId: currentHold.holdId})});
    if(res.error) throw new Error(res.error);
    const booking = res.booking || res;
    setStatus('Booking confirmed');
    // show QR
    const qrArea = document.getElementById('qr-area');
    qrArea.innerHTML = `<h3>Booking confirmed</h3><img src="${booking.qrPayload}" alt="QR"/>`;
    document.getElementById('confirm-booking').style.display='none';
    document.getElementById('hold-info').textContent = '';
  }catch(err){
    console.error(err);
    setStatus('Booking failed');
    alert('Failed to confirm booking: '+err.message);
  }
});


