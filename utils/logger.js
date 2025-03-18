const winston = require("winston");
const morgan = require("morgan");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({ filename: "logs/app.log" }), // General logs
        new winston.transports.File({ filename: "logs/error.log", level: "error" }) // Error logs
    ]
});

// Middleware for logging requests
const requestLogger = morgan("combined", {
    stream: { write: message => logger.info(message.trim()) }
});

module.exports = { logger, requestLogger };
