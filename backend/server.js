const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});