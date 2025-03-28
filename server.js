const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const webpush = require('web-push');
const keys = require('./keys.json');
const path = require('path');


const app = express();
//const PORT = 5000;
const PORT = process.env.PORT || 5000;


// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect(
  'mongodb+srv://axel123:axel123@clustervite.q7s1q.mongodb.net/dbpwa?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error(err));

// Esquema y modelo de usuario
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Esquema y modelo para la suscripción de push notifications
const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  }
});
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Rutas
// Registro de usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    res.status(400).json({ error: 'Error registrando usuario', details: error });
  }
});

// Inicio de sesión de usuario
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && user.password === password) {
      res.status(200).json({ message: 'Inicio de sesión correcto' });
    } else {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión', details: error });
  }
});

// Ruta para guardar la suscripción en la base de datos
app.post('/save-subscription', async (req, res) => {
  try {
    const subscription = req.body.subscription;
    const newSubscription = new Subscription(subscription);
    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción guardada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la suscripción', details: error });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor funcionando 🚀');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
//app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


webpush.setVapidDetails(
  'mailto:prueba@gmail.com',
  keys.publicKey,
  keys.privateKey
);

async function sendPush(req, res) {
  const sub = { /*suscripción*/ };
  webpush.sendNotification(sub, "mensaje")
    .then(success => {
      res.json({ mensaje: "ok" });
    })
    .catch(async error => {
      if (error.body.includes('expired') && error.statusCode === 410) {
        console.log('sub expirada');
      }
      res.json({ mensaje: "error" });
    });
}
