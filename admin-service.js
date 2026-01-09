require('dotenv').config();
// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const app = express();
// Import the Log model to save request history
const Log = require("./models/log");
// Initialize Pino logger
const pino = require('pino');
const logger = pino();

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected (Admin Service)");
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB", error);
    });
//log for every incoming request
app.use(async (req, res, next) => {
    try {
        logger.info(`request received: ${req.method} ${req.url}`);

        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Admin Service)`
        });
        // Save asynchronously to avoid blocking the response
        newLog.save().catch(err => logger.error("Failed to save log to DB", err));
    } catch(error) {
        logger.error("Error inside logging middleware", error);
    }
    next();
});
// Get Developers Details
app.get('/api/about', (req, res) => {
    try {
        const developers = [
            {
                first_name: "Michael",
                last_name: "Yehoshua"
            },
            {
                first_name: "Shaked",
                last_name: "Avdar"
            }

        ];

        res.json(developers);
    } catch (error) {
        console.log("Error fetching developers details", error);
        res.status(500).json({message: "Error fetching developers details", error: error.message});
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Admin Service is running on port ${PORT}`);
});