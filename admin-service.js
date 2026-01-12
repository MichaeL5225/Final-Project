require('dotenv').config(); // Load environment variables from .env

const express = require('express'); // Express framework
const mongoose = require('mongoose'); // MongoDB ODM
const pino = require('pino'); // Pino logger
const Log = require("./models/log"); // Log model (flexible schema)

const app = express(); // Create Express app
const logger = pino(); // Initialize Pino logger

// Parse JSON request bodies
app.use(express.json());

// Read Mongo URI from environment
const MONGO_URI = process.env.MONGO_URI;

// Validate required environment variables
if (!MONGO_URI)
{
    console.log("Missing MONGO_URI in .env");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected (Admin Service)");
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB", error);
    });

/*
 * Logging middleware
 * ------------------
 * Requirement: A log message should be written for every HTTP request.
 * We write a log to console (Pino) and also save a log document to MongoDB.
 */
app.use(async (req, res, next) => {
    try
    {
        // Log request to console
        logger.info(`request received: ${req.method} ${req.url}`);

        // Save request log to MongoDB (async; do not block response)
        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Admin Service)`
        });

        newLog.save().catch((err) => logger.error("Failed to save log to DB", err));
    }
    catch (error)
    {
        // If logging fails, do not block the request handling
        logger.error("Error inside logging middleware", error);
    }

    next();
});

/*
 * GET /api/about
 * --------------
 * Returns only first_name and last_name of developers.
 * These names must NOT be stored in the DB (requirement).
 */
app.get('/api/about', async (req, res) => {
    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: `Endpoint accessed: GET /api/about (Admin Service)`
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        // Developers list (hardcoded as required)
        const developers = [
            { first_name: "Michael", last_name: "Yehoshua" },
            { first_name: "Shaked", last_name: "Avdar" }
        ];

        // Return only first_name + last_name (no extra data)
        res.json(developers);
    }
    catch (error)
    {
        console.log("Error fetching developers details", error);

        // Error response must include at least: id + message
        res.status(500).json({
            id: 0,
            message: "Error fetching developers details",
            error: error.message
        });
    }
});

// Server port (Render/production can set PORT in environment)
const PORT = process.env.PORT || 3002;

// Start listening
app.listen(PORT, () => {
    console.log(`Admin Service is running on port ${PORT}`);
});
