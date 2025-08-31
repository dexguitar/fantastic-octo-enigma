const { createLogger } = require('../../shared/logger');
const { sendMessage } = require('../../shared/kafka');
const config = require('../../api-gateway/config/environment');

const logger = createLogger('text-processor');

const processText = async (document) => {
  logger.info(`Processing text document: ${document.documentId}`);

  try {
    // Simulate text processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

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
          score: (Math.random() * 2 - 1).toFixed(2),
          label: Math.random() > 0.5 ? 'positive' : 'negative',
        },
        language: 'English',
        processingTime: `${Math.random() * 1.5 + 0.5}s`,
      },
    };

    await sendMessage(config.topics.processingResults, result);
    logger.info(
      `Text processing result sent for document: ${document.documentId}`
    );

    return true;
  } catch (error) {
    logger.error(
      `Error processing text document ${document.documentId}:`,
      error
    );
    return false;
  }
};

module.exports = {
  processText,
};
