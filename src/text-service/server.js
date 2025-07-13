const express = require('express');
const { createLogger } = require('../shared/logger');
const { createConsumer, initConsumer, initProducer } = require('../shared/kafka');
const { handleMessage } = require('./handlers/messageHandler');
const config = require('../api-gateway/config/environment');

const logger = createLogger('text-service');

const consumer = createConsumer('text-service-group');

const app = express();

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'text-service',
        timestamp: new Date().toISOString()
    });
});

const startService = async () => {
    try {
        await initProducer();
        logger.info('Kafka producer initialized');

        await initConsumer(
            consumer,
            [config.topics.textProcessing],
            handleMessage
        );
        logger.info('Text service started and listening for messages');

        app.listen(config.textService.port, config.textService.host, () => {
            logger.info(`Text service health check available at http://${config.textService.host}:${config.textService.port}/health`);
        });

    } catch (error) {
        logger.error('Failed to start text service:', error);
        process.exit(1);
    }
};

process.on('SIGINT', async () => {
    try {
        logger.info('Shutting down text service...');
        await consumer.disconnect();
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

startService();