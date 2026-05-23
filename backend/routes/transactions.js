const express = require('express');
const { readData, writeData } = require('../utils/fileHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const transactions = readData('transactions.json');
  const recent = transactions.slice(-5).reverse();
  res.json(recent);
});

router.get('/all', authenticate, (req, res) => {
  const transactions = readData('transactions.json');
  res.json(transactions.reverse());
});

router.post('/', authenticate, (req, res) => {
  const { products, customerName, totalValue, employeeName } = req.body;
  const transactions = readData('transactions.json');
  
  const transaction = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    products,
    customerName,
    totalValue,
    employeeName,
    employeeId: req.user.id
  };
  
  transactions.push(transaction);
  writeData('transactions.json', transactions);
  
  // Atualizar estoque
  const allProducts = readData('products.json');
  products.forEach(soldProduct => {
    const productIndex = allProducts.findIndex(p => p.id === soldProduct.id);
    if (productIndex !== -1) {
      allProducts[productIndex].quantity -= soldProduct.quantity;
    }
  });
  writeData('products.json', allProducts);
  
  res.json(transaction);
});

module.exports = router;