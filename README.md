# Ticket Booking (Minimal Scaffold)

This repository contains a minimal scaffold for the Ticket Booking System (backend + simple frontend demo).

Backend
- Location: `backend`
- Start (after installing dependencies):

```bash
cd backend
npm install
cp .env.example .env
# set MONGO_URI in .env if needed
npm run dev
```

API endpoints (basic)
- `POST /api/events` - create event with `{title, date, rows, cols}`
- `GET /api/events` - list events
- `POST /api/events/:id/hold` - hold seats `{seats:[indices], customerEmail, ttlSeconds?}`
- `POST /api/bookings/confirm` - confirm a hold `{holdId}` -> returns booking with `qrPayload`

Frontend
- Location: `frontend`
- Open `frontend/index.html` in a browser (it queries `http://localhost:4000/api`).

Notes
- Seat hold TTL is implemented with a `SeatHold` collection and a cleanup job that releases expired holds.
- This is a minimal starting point — production concerns like authentication, email delivery, scalability, and robust concurrency protections should be added.
