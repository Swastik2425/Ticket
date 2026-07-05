const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const eventsRouter = require('./routes/events');
const bookingsRouter = require('./routes/bookings');
const holdCleaner = require('./utils/holdCleaner');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/events', eventsRouter);
app.use('/api/bookings', bookingsRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ticketdb';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // start hold cleanup job
  holdCleaner.start();

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
