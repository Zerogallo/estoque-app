const express = require('express');
const { readData, writeData } = require('../utils/fileHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const carts = readData('carts.json');
  let userCart = carts.find(c => c.userId === req.user.id && !c.completed);
  
  if (!userCart) {
    userCart = { userId: req.user.id, items: [], completed: false };
    carts.push(userCart);
    writeData('carts.json', carts);
  }
  
  res.json(userCart);
});

router.post('/add', authenticate, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const carts = readData('carts.json');
  const products = readData('products.json');
  
  let cart = carts.find(c => c.userId === req.user.id && !c.completed);
  if (!cart) {
    cart = { userId: req.user.id, items: [], completed: false };
    carts.push(cart);
  }
  
  const product = products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado' });
  }
  
  const existingItem = cart.items.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      quantity,
      photo: product.photo
    });
  }
  
  writeData('carts.json', carts);
  res.json(cart);
});

router.delete('/remove/:productId', authenticate, (req, res) => {
  const carts = readData('carts.json');
  const cart = carts.find(c => c.userId === req.user.id && !c.completed);
  
  if (cart) {
    cart.items = cart.items.filter(item => item.productId !== req.params.productId);
    writeData('carts.json', carts);
  }
  
  res.json(cart);
});

router.delete('/clear', authenticate, (req, res) => {
  const carts = readData('carts.json');
  const cart = carts.find(c => c.userId === req.user.id && !c.completed);
  
  if (cart) {
    cart.items = [];
    writeData('carts.json', carts);
  }
  
  res.json(cart);
});

module.exports = router;