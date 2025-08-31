const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./environment');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Document Processing API',
      version: '1.0.0',
      description: 'API for processing documents (images and text)',
    },
    servers: [
      {
        url: `http://${config.api.host}:${config.api.port}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/api-gateway/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = {
  setupSwagger,
  swaggerDocs,
};
