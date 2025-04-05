const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Habilita CORS para permitir chamadas entre portas diferentes
app.use(cors());

// Middleware para servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Inicia o servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
