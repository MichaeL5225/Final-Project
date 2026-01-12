require('dotenv').config(); // Load environment variables from .env

const express = require('express'); // Express framework
const mongoose = require('mongoose'); // MongoDB ODM
const pino = require('pino'); // Pino logger

// Mongoose models
const User = require('./models/user');
const Cost = require('./models/cost');
const Log = require('./models/log'); // Flexible log schema (strict:false)

const app = express(); // Create Express app
const logger = pino(); // Initialize Pino logger

// Parse JSON request bodies
app.use(express.json());

// Read Mongo connection string from environment
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
        console.log("MongoDB Connected (Users Service)");
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB (Users Service)", error);
    });

/*
 * Logging middleware
 * ------------------
 * Requirement: Save a log for every HTTP request the server receives.
 */
app.use(async (req, res, next) => {
    try
    {
        logger.info(`request received: ${req.method} ${req.url}`);

        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Users Service)`
        });

        // Save log without blocking the response
        newLog.save().catch((err) => logger.error("Failed to save log to DB", err));
    }
    catch (error)
    {
        logger.error("Error inside logging middleware", error);
    }

    next();
});

/*
 * POST /api/add
 * -------------
 * Adds a new user.
 * Requirement: validate input and return errors as JSON with {id, message}.
 */
app.post('/api/add', async (req, res) => {
    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: "Endpoint accessed: POST /api/add (Users Service)"
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        const { id, first_name, last_name, birthday } = req.body;

        // Validate required fields
        if (id === undefined || !first_name || !last_name || !birthday)
        {
            return res.status(400).json({
                id: id || 0,
                message: "Missing parameters: id, first_name, last_name, birthday are required"
            });
        }

        // Validate id is a number
        if (typeof id !== 'number' || Number.isNaN(id))
        {
            return res.status(400).json({
                id: 0,
                message: "Invalid id: must be a Number"
            });
        }

        // Validate birthday is a valid date
        const birthdayDate = new Date(birthday);
        if (Number.isNaN(birthdayDate.getTime()))
        {
            return res.status(400).json({
                id: id,
                message: "Invalid birthday: must be a valid date"
            });
        }

        // Create user document
        const newUser = new User({
            id,
            first_name,
            last_name,
            birthday: birthdayDate
        });

        // Save to database
        const savedUser = await newUser.save();

        // Return the user document itself (same properties as users collection)
        return res.status(201).json(savedUser);
    }
    catch (error)
    {
        console.log("Error creating new user", error);

        // Error response must include at least: id + message
        return res.status(500).json({
            id: (req.body && req.body.id) ? req.body.id : 0,
            message: "Error adding user",
            error: error.message
        });
    }
});

/*
 * GET /api/users/:id
 * ------------------
 * Returns: first_name, last_name, id, total (sum of all costs for this user).
 */
app.get('/api/users/:id', async (req, res) => {
    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: "Endpoint accessed: GET /api/users/:id (Users Service)"
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        const userID = parseInt(req.params.id, 10);
        if (!userID)
        {
            return res.status(400).json({
                id: 0,
                message: "Invalid id in URL"
            });
        }

        // Find the user
        const user = await User.findOne({ id: userID });
        if (!user)
        {
            return res.status(404).json({ id: userID, message: "User not found" });
        }

        // Sum all user costs in JS (safe with Decimal128)
        const userCosts = await Cost.find({ userid: userID });

        let total = 0;
        for (const c of userCosts)
        {
            // Decimal128 -> string -> number
            const value = c.sum ? parseFloat(c.sum.toString()) : 0;
            total += value;
        }

        // Return the required JSON format
        return res.json({
            first_name: user.first_name,
            last_name: user.last_name,
            id: user.id,
            total: total
        });
    }
    catch (error)
    {
        console.log("Error getting user details", error);

        // Error response must include at least: id + message
        return res.status(500).json({
            id: req.params && req.params.id ? parseInt(req.params.id, 10) : 0,
            message: "Error getting user details",
            error: error.message
        });
    }
});

/*
 * GET /api/users
 * -------------
 * Returns a list of all users.
 */
app.get('/api/users', async (req, res) => {
    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: "Endpoint accessed: GET /api/users (Users Service)"
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        const users = await User.find({});
        return res.json(users);
    }
    catch (error)
    {
        console.log("Error fetching users", error);

        // Error response must include at least: id + message
        return res.status(500).json({
            id: 0,
            message: "Error fetching users",
            error: error.message
        });
    }
});

// Server port (Render/production can set PORT in environment)
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, () => {
    console.log(`Users Service is running on port ${PORT}`);
});
