const express = require('express');
const cors = require('cors');
require('dotenv').config();
const initializeDatabase = require('./init-db');

const app = express();

// Permitir CORS en desarrollo desde cualquier origen
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/premium', require('./routes/premium'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/moderation', require('./routes/moderation'));

app.get('/', (req, res) => {
  res.send('API funcionando correctamente');
});

// Inicializar la base de datos y luego iniciar el servidor
initializeDatabase().then(() => {
  app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});