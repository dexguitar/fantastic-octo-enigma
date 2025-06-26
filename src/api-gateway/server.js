const express = require('express');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { createLogger } = require('../shared/logger');
const { initProducer } = require('../shared/kafka');
const { initializeConsumer } = require('./config/consumer');
require('dotenv').config();

const logger = createLogger('api-gateway');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        params: req.params,
        query: req.query,
    });
    next();
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'api-gateway',
        timestamp: new Date().toISOString()
    });
});

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
                url: `http://${process.env.API_HOST}:${process.env.API_PORT}`,
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/api-gateway/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const documentRoutes = require('./routes/documents');

app.use('/api/documents', documentRoutes);

app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        },
    });
});

const PORT = process.env.API_PORT || 3000;
const HOST = process.env.API_HOST || 'localhost';

const startServer = async () => {
    try {
        await initProducer();

        await initializeConsumer();

        app.listen(PORT, HOST, () => {
            logger.info(`API Gateway running at http://${HOST}:${PORT}`);
            logger.info(`API Documentation available at http://${HOST}:${PORT}/api-docs`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 