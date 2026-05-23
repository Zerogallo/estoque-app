const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = 3000;

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Verificar e criar diretório uploads se não existir
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log(`${colors.yellow}📁 Diretório uploads criado${colors.reset}`);
}

// Verificar e criar diretório data se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log(`${colors.yellow}📁 Diretório data criado${colors.reset}`);
  
  // Criar arquivos JSON iniciais se não existirem
  const initialFiles = ['users.json', 'products.json', 'transactions.json', 'carts.json'];
  initialFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
      console.log(`${colors.yellow}📄 Arquivo ${file} criado${colors.reset}`);
    }
  });
}

// Rotas
console.log(`${colors.cyan}📡 Configurando rotas...${colors.reset}`);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cart', cartRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor está rodando perfeitamente!',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n${colors.bright}${colors.green}✅ SERVIDOR INICIADO COM SUCESSO!${colors.reset}\n`);
  console.log(`${colors.cyan}🚀 Servidor rodando em:${colors.reset}`);
  console.log(`${colors.bright}   http://localhost:${PORT}${colors.reset}`);
  console.log(`   http://192.168.${getLocalIp()}:${PORT}\n`);
  
  console.log(`${colors.yellow}📋 Rotas disponíveis:${colors.reset}`);
  console.log(`   ${colors.blue}POST${colors.reset}   /api/auth/register     - Cadastro de usuário`);
  console.log(`   ${colors.blue}POST${colors.reset}   /api/auth/login        - Login de usuário`);
  console.log(`   ${colors.blue}GET${colors.reset}    /api/products          - Listar produtos`);
  console.log(`   ${colors.blue}POST${colors.reset}   /api/products          - Criar produto`);
  console.log(`   ${colors.blue}PUT${colors.reset}    /api/products/:id      - Atualizar produto`);
  console.log(`   ${colors.blue}DELETE${colors.reset} /api/products/:id      - Deletar produto`);
  console.log(`   ${colors.blue}GET${colors.reset}    /api/products/low-stock - Produtos com estoque baixo`);
  console.log(`   ${colors.blue}GET${colors.reset}    /api/transactions      - Últimas transações`);
  console.log(`   ${colors.blue}POST${colors.reset}   /api/transactions      - Registrar saída`);
  console.log(`   ${colors.blue}GET${colors.reset}    /api/cart              - Ver carrinho`);
  console.log(`   ${colors.blue}POST${colors.reset}   /api/cart/add          - Adicionar ao carrinho`);
  console.log(`   ${colors.blue}DELETE${colors.reset} /api/cart/remove/:id   - Remover do carrinho`);
  console.log(`   ${colors.blue}GET${colors.reset}    /api/health            - Health check\n`);
  
  console.log(`${colors.green}💾 Persistência de dados:${colors.reset}`);
  console.log(`   📁 ${path.join(__dirname, 'data')}`);
  console.log(`   📁 ${path.join(__dirname, 'uploads')}\n`);
  
  console.log(`${colors.cyan}✨ Servidor pronto para receber requisições!${colors.reset}\n`);
});

// Função para obter IP local
function getLocalIp() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}