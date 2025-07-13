const { createLogger } = require('../../shared/logger');
const { processImage } = require('../processors/imageProcessor');
const config = require('../../api-gateway/config/environment');

const logger = createLogger('image-message-handler');

const handleMessage = async (topic, message) => {
    try {
        logger.info(`Received message from topic ${topic}`);

        if (topic !== config.topics.imageProcessing) {
            logger.warn(`Received message from unexpected topic: ${topic}`);
            return;
        }

        const { documentId, name, type, content } = message;

        if (!documentId || !type || !content) {
            logger.error('Invalid message format: missing required fields');
            return;
        }

        if (type !== 'image') {
            logger.error(`Invalid document type for image service: ${type}`);
            return;
        }

        const success = await processImage(message);

        if (success) {
            logger.info(`Successfully processed image document ${documentId}`);
        } else {
            logger.error(`Failed to process image document ${documentId}`);
        }
    } catch (error) {
        logger.error(`Error handling message from topic ${topic}:`, error);
    }
};

module.exports = {
    handleMessage,
}; 