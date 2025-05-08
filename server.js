const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Pizzaria Dona Maria',
      version: '1.0.0',
      description: 'Documentação da API para o sistema de delivery',
    },
    servers: [{
      url: 'http://localhost:3001',
      description: 'JSON Server'
    }],
    components: {
      schemas: {
        Client: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            phone: { type: 'string' },
            cep: { type: 'string' },
            address: { type: 'string' },
            neighborhood: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            category: { type: 'string' },
            description: { type: 'string' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            clientId: { type: 'string' },
            clientName: { type: 'string' },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            status: { type: 'string' },
            total: { type: 'number' },
            date: { type: 'string', format: 'date-time' }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'number' }
          }
        }
      }
    }
  },
  apis: ['./app.js'], // Certifique-se que este caminho está correto
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota de redirecionamento
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Swagger UI em: http://localhost:${PORT}/api-docs`);
  console.log(`API de dados (json-server) em: http://localhost:3001`);
});