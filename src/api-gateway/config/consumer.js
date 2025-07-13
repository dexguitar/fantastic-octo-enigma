const { createLogger } = require('../../shared/logger');
const { createConsumer, initConsumer } = require('../../shared/kafka');
const { processDocumentResult } = require('../controllers/documents');
const config = require('./environment');

const logger = createLogger('api-gateway-consumer');

const consumer = createConsumer();

const handleMessage = async (topic, message) => {
    try {
        logger.info(`Received message from topic ${topic}`);

        if (topic !== config.topics.processingResults) {
            logger.warn(`Received message from unexpected topic: ${topic}`);
            return;
        }

        const { documentId, result } = message;

        if (!documentId || !result) {
            logger.error('Invalid message format: missing documentId or result');
            return;
        }

        const success = processDocumentResult(documentId, result);

        if (success) {
            logger.info(`Successfully processed result for document ${documentId}`);
        } else {
            logger.error(`Failed to process result for document ${documentId}`);
        }
    } catch (error) {
        logger.error(`Error handling message from topic ${topic}:`, error);
    }
};

const initializeConsumer = async () => {
    try {
        await initConsumer(
            consumer,
            [config.topics.processingResults],
            handleMessage
        );
        logger.info('API Gateway consumer initialized');
    } catch (error) {
        logger.error('Failed to initialize API Gateway consumer:', error);
        throw error;
    }
};

module.exports = {
    initializeConsumer,
}; 