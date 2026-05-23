const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readData, writeData } = require('../utils/fileHandler');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'employee' } = req.body;
  
  const users = readData('users.json');
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    role
  };
  
  users.push(newUser);
  writeData('users.json', users);
  
  const token = jwt.sign({ id: newUser.id, name, role }, SECRET_KEY);
  res.json({ token, user: { id: newUser.id, name, email, role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const users = readData('users.json');
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ error: 'Usuário não encontrado' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ error: 'Senha inválida' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, SECRET_KEY);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

module.exports = router;