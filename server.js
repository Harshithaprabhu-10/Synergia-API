// server.js
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import Booking from './models/Booking.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());

// Connect to MongoDB
connectDB();

// Root
app.get('/', (req, res) => {
  res.send('Synergia Event Booking API (MongoDB)');
});

/**
 * 1. GET /api/bookings - get all bookings
 *    Supports optional query params like ?limit=10&skip=0
 */
app.get('/api/bookings', async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * 2. POST /api/bookings - create a new booking
 *    Required: name, email, event
 */
app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, event, ticketType } = req.body;
    if (!name || !email || !event) {
      return res.status(400).json({ message: 'name, email and event are required' });
    }
    const newBooking = new Booking({ name, email, event, ticketType });
    await newBooking.save();
    res.status(201).json({ message: 'Booking created', booking: newBooking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


/**
 * 3. PUT /api/bookings/:id - update booking
 *    Partial updates allowed
 */
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const updates = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking updated', booking });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data or ID', error: err.message });
  }
});

/**
 * 4. DELETE /api/bookings/:id - delete booking
 */
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted', booking });
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID or server error', error: err.message });
  }
});

/**
 * 5. GET /api/bookings/search?email=xyz  - search by email
 */
app.get('/api/bookings/search', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'email query param is required' });
    const booking = await Booking.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });

    if (!booking) return res.status(404).json({ message: 'Booking not found for this email' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * 6. GET /api/bookings/filter?event=Synergia - filter by event name (exact or partial)
 */
app.get('/api/bookings/filter', async (req, res) => {
  try {
    const { event } = req.query;
    if (!event) return res.status(400).json({ message: 'event query param is required' });
    // Case-insensitive partial match
    const bookings = await Booking.find({ event: { $regex: event, $options: 'i' } }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * 7. GET /api/bookings/:id - get booking by ID
 */
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: 'Invalid ID or server error', error: err.message });
  }
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
