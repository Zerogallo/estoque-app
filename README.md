<div align="center">


  <img src="https://github.com/Zerogallo/estoque-app/blob/main/app/assets/est3.jpeg" style="width: 300px; height: 600px" />
    
 <img src="https://github.com/Zerogallo/estoque-app/blob/main/app/assets/est2.jpeg" style="width: 300px; height: 600px" />
 <img src="https://github.com/Zerogallo/estoque-app/blob/main/app/assets/est1.jpeg" style="width: 300px; height: 600px" />
 
 </div>
 
###  📦 Sistema de Controle de Estoque - App Mobile + Backend
---
Sistema completo de gestão de estoque desenvolvido para uma empresa, com aplicativo mobile e backend integrados. O projeto está finalizado e aguardando apenas a implantação no ambiente do cliente.

---

## 🚀 Tecnologias Utilizadas

# Frontend (Mobile):
```
· React Native + TypeScript
· Expo
· React Navigation
· Expo Vector Icons
· Axios
```
# Backend:
```
· Node.js
· Express
· JWT (Autenticação)
· Multer (Upload de imagens)
· QRCode (Geração de QR Codes)
· Persistência em arquivos JSON
```
---

## ✅ Funcionalidades Implementadas

## Autenticação
```
· Login e cadastro de funcionários
· Autenticação com JWT
```
## Dashboard (Home)
```
· Resumo do estoque
· Últimos produtos cadastrados
· Produtos em falta/estoque baixo
· Últimas saídas realizadas
· Atalho rápido para criar produtos
```
## Produtos (CRUD completo)
```
· Cadastro com foto (câmera ou galeria)
· Campos: nome, preço, tipo, cor, descrição
· Controle de quantidade e limite mínimo
· Edição e exclusão de produtos
· Geração automática de QR Code para cada produto
```
## Controle de Estoque
```
· Visualização de todos os produtos
· Indicador visual por cores:
  · 🟢 Verde: estoque normal
  · 🟠 Laranja: estoque baixo
  · 🔴 Vermelho: esgotado
· Ajuste manual de quantidades
```
## Carrinho e Saídas
```
· Leitor de QR Code para adicionar produtos
· Carrinho com ajuste de quantidades
· Finalização com nome do cliente
· Baixa automática no estoque
```
## Histórico
```
· Registro completo de todas as saídas
· Detalhamento por transação
· Impressão/geração de comprovante em PDF
```
## QR Code
```
· Geração automática na criação do produto
· Leitura para adicionar ao carrinho
· Etiqueta de identificação do produto
```
---

### 📱 Telas do Aplicativo
```
Tela Funcionalidade
Login Autenticação de funcionários
Cadastro Registro de novos usuários
Home Dashboard com resumo e atalhos
Produtos CRUD completo com fotos e QR Codes
Estoque Controle visual com indicadores de cor
Carrinho Itens separados, ajuste de quantidade
Histórico Saídas realizadas com comprovante
Leitor QR Code Escaneamento para adicionar produtos
```
---

### 🛠️ Como Executar o Projeto

# Backend:

```bash
cd backend
npm install
npm run dev
```

# Frontend:

```bash
cd estoque-app
npm install
npm start
```

# Configuração do IP:

· Altere o IP no arquivo src/services/api.ts para o IP do seu computador na rede
· Padrão: http://192.168.1.100:3000/api

---

### 📂 Estrutura do Projeto

```
estoque-app/
├── backend/
│   ├── data/           # Arquivos JSON de persistência
│   ├── middleware/     # Autenticação JWT
│   ├── routes/         # Rotas da API
│   ├── uploads/        # Imagens dos produtos
│   └── server.js       # Servidor Express
│
├── frontend/
│   ├── src/
│   │   ├── contexts/   # Contexto de autenticação
│   │   ├── screens/    # Telas do aplicativo
│   │   ├── navigation/ # Configuração de rotas
│   │   ├── services/   # Configuração do Axios
│   │   └── components/ # Componentes reutilizáveis
│   └── App.tsx         # Ponto de entrada
```

---

### 🔧 Status do Projeto

✅ Desenvolvimento finalizado
✅ Testes realizados
⏳ Aguardando implantação na empresa

---

### 📞 Contato

Estou disponível para novos projetos e oportunidades.
Desenvolvido por 📫 (21) 97274-5455 · [renan.grenslist@gmail.com](mailto:renan.grenslist@gmail.com) · [LinkedIn](https://www.linkedin.com/in/renan-ferreira-full-stack)

---


