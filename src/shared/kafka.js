const { Kafka } = require('kafkajs');
const config = require('../api-gateway/config/environment');
const { createLogger } = require('./logger');

const logger = createLogger('kafka');

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
});

const producer = kafka.producer();

const createConsumer = (groupId) => {
  return kafka.consumer({ groupId: groupId || config.kafka.groupId });
};

const initProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
    return producer;
  } catch (error) {
    logger.error('Error initializing Kafka producer:', error);
    throw error;
  }
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    logger.info(`Message sent to topic ${topic}`);
  } catch (error) {
    logger.error(`Error sending message to topic ${topic}:`, error);
    throw error;
  }
};

const initConsumer = async (consumer, topics, messageHandler) => {
  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');

    await Promise.all(
      topics.map(async (topic) => {
        await consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`Subscribed to topic ${topic}`);
      })
    );

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const parsedMessage = JSON.parse(message.value.toString());
          logger.debug(`Received message from topic ${topic}`);
          await messageHandler(topic, parsedMessage);
        } catch (error) {
          logger.error(`Error processing message from topic ${topic}:`, error);
        }
      },
    });

    return consumer;
  } catch (error) {
    logger.error('Error initializing Kafka consumer:', error);
    throw error;
  }
};

module.exports = {
  kafka,
  producer,
  createConsumer,
  initProducer,
  sendMessage,
  initConsumer,
};
