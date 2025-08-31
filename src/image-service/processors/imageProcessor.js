const { createLogger } = require('../../shared/logger');
const { sendMessage } = require('../../shared/kafka');
const config = require('../../api-gateway/config/environment');

const logger = createLogger('image-processor');

const processImage = async (document) => {
  logger.info(`Processing image document: ${document.documentId}`);

  try {
    // Simulate image processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

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
          {
            name: 'person',
            confidence: 0.92,
            boundingBox: { x: 10, y: 20, width: 100, height: 200 },
          },
          {
            name: 'car',
            confidence: 0.87,
            boundingBox: { x: 150, y: 200, width: 300, height: 150 },
          },
        ],
        processingTime: `${Math.random() * 2 + 1}s`,
      },
    };

    await sendMessage(config.topics.processingResults, result);
    logger.info(
      `Image processing result sent for document: ${document.documentId}`
    );

    return true;
  } catch (error) {
    logger.error(
      `Error processing image document ${document.documentId}:`,
      error
    );
    return false;
  }
};

module.exports = {
  processImage,
};
