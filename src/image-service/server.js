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
    await initProducer();
    logger.info('Kafka producer initialized');

    await initConsumer(
      consumer,
      [config.topics.imageProcessing],
      handleMessage
    );
    logger.info('Image service started and listening for messages');

    app.listen(config.imageService.port, config.imageService.host, () => {
      logger.info(
        `Image service health check available at http://${config.imageService.host}:${config.imageService.port}/health`
      );
    });
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
