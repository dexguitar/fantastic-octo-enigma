const { Kafka } = require('kafkajs');
require('dotenv').config();

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS.split(','),
});

const producer = kafka.producer();

const createConsumer = (groupId) => {
    return kafka.consumer({ groupId: groupId || process.env.KAFKA_GROUP_ID });
};

const initProducer = async () => {
    try {
        await producer.connect();
        console.log('Kafka producer connected');
        return producer;
    } catch (error) {
        console.error('Error connecting Kafka producer:', error);
        throw error;
    }
};

const sendMessage = async (topic, message) => {
    try {
        await producer.send({
            topic,
            messages: [{ value: JSON.stringify(message) }],
        });
        console.log(`Message sent to topic ${topic}`);
        return true;
    } catch (error) {
        console.error(`Error sending message to topic ${topic}:`, error);
        throw error;
    }
};

const initConsumer = async (consumer, topics, messageHandler) => {
    try {
        await consumer.connect();
        console.log('Kafka consumer connected');

        await Promise.all(
            topics.map(async (topic) => {
                await consumer.subscribe({ topic, fromBeginning: false });
                console.log(`Subscribed to topic ${topic}`);
            })
        );

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const parsedMessage = JSON.parse(message.value.toString());
                    console.log(`Received message from topic ${topic}`);
                    await messageHandler(topic, parsedMessage);
                } catch (error) {
                    console.error(`Error processing message from topic ${topic}:`, error);
                }
            },
        });

        return consumer;
    } catch (error) {
        console.error('Error initializing Kafka consumer:', error);
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