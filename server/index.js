require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
<<<<<<< HEAD
const { connectDB } = require('./config/db');
=======
const connectDB = require('./config/db');
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const bookingRoutes = require('./routes/bookings');
const categoryRoutes = require('./routes/categories');
const galleryRoutes = require('./routes/gallery');
const userRoutes = require('./routes/users');
const publicRoutes = require('./routes/public');
const contentRoutes = require('./routes/content');
<<<<<<< HEAD
const petRoutes = require('./routes/pets');
=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/content', contentRoutes);
<<<<<<< HEAD
app.use('/api/pets', petRoutes);
=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..')));

// Fallback - serve index.html for SPA-like routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const filePath = path.join(__dirname, '..', req.path === '/' ? 'index.html' : req.path);
    res.sendFile(filePath, (err) => {
      if (err) res.sendFile(path.join(__dirname, '..', 'index.html'));
    });
  } else {
    res.status(404).json({ error: 'API không tồn tại' });
  }
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
<<<<<<< HEAD

=======
>>>>>>> 26d0d335f2384c512cbd970085b7db18a1505b8b
