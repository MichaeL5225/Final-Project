require('dotenv').config(); // Load environment variables from .env

const express = require('express'); // Express framework
const mongoose = require('mongoose'); // MongoDB ODM
const pino = require('pino'); // Pino logger
const Log = require('./models/log'); // Log model (flexible schema)

const app = express(); // Create Express app
const logger = pino(); // Initialize Pino logger

// Parse JSON request bodies
app.use(express.json());

// Read MongoDB connection string from .env
const MONGO_URI = process.env.MONGO_URI;

// Validate required env var
if (!MONGO_URI)
{
    console.log("Missing MONGO_URI in .env");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB (Logs Service)');
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB (Logs Service)", error);
    });

/*
 * Logging middleware
 * ------------------
 * Requirement: Save a log for every HTTP request the server receives.
 */
app.use(async (req, res, next) => {
    try
    {
        // Log to console using Pino
        logger.info(`request received: ${req.method} ${req.url}`);

        // Save request log to MongoDB (async; do not block response)
        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Logs Service)`
        });

        newLog.save().catch((err) => logger.error("Failed to save log to DB", err));
    }
    catch (error)
    {
        logger.error("Error inside logging middleware", error);
    }

    next();
});

/*
 * GET /api/logs
 * -------------
 * Returns all system logs from the logs collection.
 */
app.get('/api/logs', async (req, res) => {
    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: "Endpoint accessed: GET /api/logs (Logs Service)"
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        // Fetch all logs
        const logs = await Log.find({});

        // Return logs as JSON
        return res.json(logs);
    }
    catch (error)
    {
        // Error response must include at least: id + message
        return res.status(500).json({
            id: 0,
            message: "Error fetching logs",
            error: error.message
        });
    }
});

// Server port (Render/production can set PORT in environment)
const PORT = process.env.PORT || 3003;

// Start listening
app.listen(PORT, () => {
    console.log(`Logs Service is running on port ${PORT}`);
});
