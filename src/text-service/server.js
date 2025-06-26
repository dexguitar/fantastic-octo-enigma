const express = require('express');
const { createLogger } = require('../shared/logger');
const { createConsumer, initConsumer, initProducer, sendMessage } = require('../shared/kafka');
require('dotenv').config();

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

const processText = async (document) => {
    logger.info(`Processing text document: ${document.documentId}`);

    try {
        // Simulate text processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate mock analysis result
        const result = {
            documentId: document.documentId,
            result: {
                analysis: 'Text analysis complete',
                statistics: {
                    wordCount: Math.floor(Math.random() * 1000) + 100,
                    characterCount: Math.floor(Math.random() * 5000) + 500,
                    sentenceCount: Math.floor(Math.random() * 50) + 5,
                    paragraphCount: Math.floor(Math.random() * 10) + 1,
                },
                keywords: ['sample', 'document', 'analysis', 'text', 'processing'],
                sentiment: {
                    score: (Math.random() * 2 - 1).toFixed(2), // Range from -1 to 1
                    label: Math.random() > 0.5 ? 'positive' : 'negative',
                },
                language: 'English',
                processingTime: `${Math.random() * 1.5 + 0.5}s`,
            }
        };

        // Send result back to API Gateway
        await sendMessage(process.env.TOPIC_PROCESSING_RESULTS, result);
        logger.info(`Text processing result sent for document: ${document.documentId}`);

        return true;
    } catch (error) {
        logger.error(`Error processing text document ${document.documentId}:`, error);
        return false;
    }
};

const handleMessage = async (topic, message) => {
    try {
        logger.info(`Received message from topic ${topic}`);

        if (topic === process.env.TOPIC_TEXT_PROCESSING) {
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
            [process.env.TOPIC_TEXT_PROCESSING],
            handleMessage
        );
        logger.info('Text service started and listening for messages');

        const PORT = process.env.TEXT_SERVICE_PORT || 3002;
        const HOST = process.env.TEXT_SERVICE_HOST || 'localhost';

        app.listen(PORT, HOST, () => {
            logger.info(`Text service health check available at http://${HOST}:${PORT}/health`);
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