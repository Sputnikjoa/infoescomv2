// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importamos las rutas
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const areaRoutes = require('./routes/areas');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

const app = express();


const path = require('path');


// Middlewares
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("Conectado a MongoDB"))
.catch(err => console.error("Error conectando a MongoDB:", err));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);


app.use((err, req, res, next) => {
  console.error("Error global:", err.stack);
  res.status(500).json({ message: "Algo salió mal en el servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
