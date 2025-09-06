const express = require('express');
const { createLogger } = require('../shared/logger');
const {
  createConsumer,
  initConsumer,
  initProducer,
} = require('../shared/kafka');
const { handleMessage } = require('./handlers/messageHandler');
const config = require('../api-gateway/config/environment');

const logger = createLogger('image-service');

const consumer = createConsumer('image-service-group');

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'image-service',
    timestamp: new Date().toISOString(),
  });
});

const startService = async () => {
  try {
    // Start HTTP server first
    app.listen(config.imageService.port, config.imageService.host, () => {
      logger.info(
        `Image service health check available at http://${config.imageService.host}:${config.imageService.port}/health`
      );
    });

    // Try to initialize Kafka, but don't fail if it's not available
    try {
      await initProducer();
      logger.info('Kafka producer initialized');

      await initConsumer(
        consumer,
        [config.topics.imageProcessing],
        handleMessage
      );
      logger.info('Image service started and listening for messages');
    } catch (kafkaError) {
      logger.warn('Kafka not available, running without message processing:', kafkaError.message);
      logger.info('Image service started (HTTP only - Kafka disabled)');
    }
  } catch (error) {
    logger.error('Failed to start image service:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  try {
    logger.info('Shutting down image service...');
    await consumer.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startService();
