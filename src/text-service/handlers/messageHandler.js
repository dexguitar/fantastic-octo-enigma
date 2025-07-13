const { createLogger } = require('../../shared/logger');
const { processText } = require('../processors/textProcessor');
const config = require('../../api-gateway/config/environment');

const logger = createLogger('text-message-handler');

const handleMessage = async (topic, message) => {
    try {
        logger.info(`Received message from topic ${topic}`);

        if (topic !== config.topics.textProcessing) {
            logger.warn(`Received message from unexpected topic: ${topic}`);
            return;
        }

        const { documentId, name, type, content } = message;

        if (!documentId || !type || !content) {
            logger.error('Invalid message format: missing required fields');
            return;
        }

        if (type !== 'text') {
            logger.error(`Invalid document type for text service: ${type}`);
            return;
        }

        const success = await processText(message);

        if (success) {
            logger.info(`Successfully processed text document ${documentId}`);
        } else {
            logger.error(`Failed to process text document ${documentId}`);
        }
    } catch (error) {
        logger.error(`Error handling message from topic ${topic}:`, error);
    }
};

module.exports = {
    handleMessage,
}; 