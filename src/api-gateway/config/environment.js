require('dotenv').config();

const config = {
  api: {
    port: process.env.API_PORT || 3000,
    host: process.env.API_HOST || '0.0.0.0',
  },

  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'document-processor',
    brokers: process.env.KAFKA_BROKERS
      ? process.env.KAFKA_BROKERS.split(',')
      : ['localhost:9092'],
    groupId: process.env.KAFKA_GROUP_ID || 'document-processing-group',
  },

  topics: {
    imageProcessing:
      process.env.TOPIC_IMAGE_PROCESSING || 'document-image-processing',
    textProcessing:
      process.env.TOPIC_TEXT_PROCESSING || 'document-text-processing',
    processingResults:
      process.env.TOPIC_PROCESSING_RESULTS || 'document-processing-results',
  },

  nodeEnv: process.env.NODE_ENV || 'development',

  imageService: {
    port: process.env.IMAGE_SERVICE_PORT || 3001,
    host: process.env.IMAGE_SERVICE_HOST || '0.0.0.0',
  },

  textService: {
    port: process.env.TEXT_SERVICE_PORT || 3002,
    host: process.env.TEXT_SERVICE_HOST || '0.0.0.0',
  },
};

module.exports = config;
