const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const createLogger = (serviceName) => {
    return winston.createLogger({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: logFormat,
        defaultMeta: { service: serviceName },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
                        return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''
                            }`;
                    })
                ),
            }),

            new winston.transports.File({
                filename: path.join('logs', `${serviceName}-error.log`),
                level: 'error'
            }),
            new winston.transports.File({
                filename: path.join('logs', `${serviceName}-combined.log`)
            }),
        ],
    });
};

const fs = require('fs');
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

module.exports = { createLogger }; 