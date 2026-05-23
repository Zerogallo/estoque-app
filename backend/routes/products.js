const express = require('express');
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const { readData, writeData } = require('../utils/fileHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configuração do upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', authenticate, (req, res) => {
  const products = readData('products.json');
  res.json(products);
});

router.get('/low-stock', authenticate, (req, res) => {
  const products = readData('products.json');
  const lowStock = products.filter(p => p.quantity <= p.minLimit);
  res.json(lowStock);
});

router.post('/', authenticate, upload.single('photo'), async (req, res) => {
  const { name, price, type, color, description, quantity, minLimit } = req.body;
  const products = readData('products.json');
  
  const newProduct = {
    id: Date.now().toString(),
    name,
    price: parseFloat(price),
    type,
    color,
    description,
    quantity: parseInt(quantity),
    minLimit: parseInt(minLimit),
    photo: req.file ? `/uploads/${req.file.filename}` : null,
    createdAt: new Date().toISOString()
  };
  
  // Gerar QR Code
  const qrData = JSON.stringify({ id: newProduct.id, name: newProduct.name });
  const qrCode = await QRCode.toDataURL(qrData);
  newProduct.qrCode = qrCode;
  
  products.push(newProduct);
  writeData('products.json', products);
  
  res.json(newProduct);
});

router.put('/:id', authenticate, upload.single('photo'), (req, res) => {
  const products = readData('products.json');
  const index = products.findIndex(p => p.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }
  
  const { name, price, type, color, description, quantity, minLimit } = req.body;
  products[index] = {
    ...products[index],
    name: name || products[index].name,
    price: price ? parseFloat(price) : products[index].price,
    type: type || products[index].type,
    color: color || products[index].color,
    description: description || products[index].description,
    quantity: quantity !== undefined ? parseInt(quantity) : products[index].quantity,
    minLimit: minLimit !== undefined ? parseInt(minLimit) : products[index].minLimit,
    photo: req.file ? `/uploads/${req.file.filename}` : products[index].photo
  };
  
  writeData('products.json', products);
  res.json(products[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const products = readData('products.json');
  const filtered = products.filter(p => p.id !== req.params.id);
  writeData('products.json', filtered);
  res.json({ message: 'Produto removido' });
});

module.exports = router;