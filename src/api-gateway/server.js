const express = require('express');
const cors = require('cors');
const { createLogger } = require('../shared/logger');
const { initProducer } = require('../shared/kafka');
const { initializeConsumer } = require('./config/consumer');
const { setupSwagger } = require('./config/swagger');
const config = require('./config/environment');

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

setupSwagger(app);

const documentRoutes = require('./routes/documents');
app.use('/api/documents', documentRoutes);

app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(config.nodeEnv !== 'production' && { stack: err.stack }),
        },
    });
});

const startServer = async () => {
    try {
        await initProducer();
        await initializeConsumer();

        app.listen(config.api.port, config.api.host, () => {
            logger.info(`API Gateway running at http://${config.api.host}:${config.api.port}`);
            logger.info(`API Documentation available at http://${config.api.host}:${config.api.port}/api-docs`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 