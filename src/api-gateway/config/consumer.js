const { createConsumer, initConsumer } = require('../../shared/kafka');
const { createLogger } = require('../../shared/logger');
const { processDocumentResult } = require('../controllers/documents');
require('dotenv').config();

const logger = createLogger('api-gateway-consumer');

const consumer = createConsumer();

const handleMessage = async (topic, message) => {
    try {
        logger.info(`Received message from topic ${topic}`);

        if (topic === process.env.TOPIC_PROCESSING_RESULTS) {
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
        } else {
            logger.warn(`Received message from unexpected topic: ${topic}`);
        }
    } catch (error) {
        logger.error(`Error handling message from topic ${topic}:`, error);
    }
};

const initializeConsumer = async () => {
    try {
        await initConsumer(
            consumer,
            [process.env.TOPIC_PROCESSING_RESULTS],
            handleMessage
        );
        logger.info('API Gateway consumer initialized');
    } catch (error) {
        logger.error('Failed to initialize API Gateway consumer:', error);
        throw error;
    }
};

module.exports = { initializeConsumer }; 