const express = require('express');
const { createLogger } = require('../shared/logger');
const { createConsumer, initConsumer, initProducer, sendMessage } = require('../shared/kafka');
require('dotenv').config();

const logger = createLogger('image-service');

const consumer = createConsumer('image-service-group');

const app = express();

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'image-service',
        timestamp: new Date().toISOString()
    });
});

const processImage = async (document) => {
    logger.info(`Processing image document: ${document.documentId}`);

    try {
        // Simulate image processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock analysis result
        const result = {
            documentId: document.documentId,
            result: {
                analysis: 'Image analysis complete',
                metadata: {
                    format: 'JPEG',
                    dimensions: '1024x768',
                    size: '2.3MB',
                },
                detectedObjects: [
                    { name: 'person', confidence: 0.92, boundingBox: { x: 10, y: 20, width: 100, height: 200 } },
                    { name: 'car', confidence: 0.87, boundingBox: { x: 150, y: 200, width: 300, height: 150 } },
                ],
                processingTime: `${Math.random() * 2 + 1}s`,
            }
        };

        await sendMessage(process.env.TOPIC_PROCESSING_RESULTS, result);
        logger.info(`Image processing result sent for document: ${document.documentId}`);

        return true;
    } catch (error) {
        logger.error(`Error processing image document ${document.documentId}:`, error);
        return false;
    }
};

const handleMessage = async (topic, message) => {
    try {
        logger.info(`Received message from topic ${topic}`);

        if (topic === process.env.TOPIC_IMAGE_PROCESSING) {
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
        } else {
            logger.warn(`Received message from unexpected topic: ${topic}`);
        }
    } catch (error) {
        logger.error(`Error handling message from topic ${topic}:`, error);
    }
};

const startService = async () => {
    try {
        await initProducer();
        logger.info('Kafka producer initialized');

        await initConsumer(
            consumer,
            [process.env.TOPIC_IMAGE_PROCESSING],
            handleMessage
        );
        logger.info('Image service started and listening for messages');

        const PORT = process.env.IMAGE_SERVICE_PORT || 3001;
        const HOST = process.env.IMAGE_SERVICE_HOST || 'localhost';

        app.listen(PORT, HOST, () => {
            logger.info(`Image service health check available at http://${HOST}:${PORT}/health`);
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