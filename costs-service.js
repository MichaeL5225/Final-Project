require('dotenv').config(); // Load environment variables from .env

const express = require('express'); // Express framework
const mongoose = require('mongoose'); // MongoDB ODM
const pino = require('pino'); // Pino logger

// Mongoose models
const Cost = require('./models/cost');
const User = require('./models/user');
const Report = require('./models/report');
const Log = require("./models/log"); // Flexible log schema (strict:false)

// Create app + logger
const app = express();
const logger = pino();

// Parse JSON request bodies
app.use(express.json());

// Read Mongo connection string
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
        console.log("Connected to MongoDB (Costs Service)");
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB (Costs Service)", error);
    });

/*
 * Logging middleware
 * ------------------
 * Requirement: Save a log for every HTTP request.
 */
app.use(async (req, res, next) => {
    try
    {
        logger.info(`request received: ${req.method} ${req.url}`);

        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Costs Service)`
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
 * Adds a new cost item.
 * Must validate input and must NOT allow adding costs in the past.
 */
app.post('/api/add', async (req, res) => {
    const now = new Date(); // Request receive time (used as default created_at)

    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: "Endpoint accessed: POST /api/add (Costs Service)"
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        const { description, category, userid, sum, created_at } = req.body;

        // Validate required fields
        if (!description || !category || userid === undefined || sum === undefined)
        {
            return res.status(400).json({
                id: userid || 0,
                message: "Missing parameters: description, category, userid, sum are required"
            });
        }

        // Validate userid is a number
        if (typeof userid !== 'number' || Number.isNaN(userid))
        {
            return res.status(400).json({
                id: 0,
                message: "Invalid userid: must be a Number"
            });
        }

        // Validate category
        const categories = ['food', 'health', 'housing', 'sports', 'education'];
        if (!categories.includes(category))
        {
            return res.status(400).json({
                id: userid,
                message: "Invalid category: must be one of food, health, housing, sports, education"
            });
        }

        // Validate sum is numeric (Decimal128 will accept string, but we validate it first)
        const sumAsNumber = Number(sum);
        if (Number.isNaN(sumAsNumber))
        {
            return res.status(400).json({
                id: userid,
                message: "Invalid sum: must be a number"
            });
        }

        // Validate created_at (if provided) and block past dates
        const createdDate = created_at ? new Date(created_at) : now;
        if (Number.isNaN(createdDate.getTime()))
        {
            return res.status(400).json({
                id: userid,
                message: "Invalid created_at: must be a valid date"
            });
        }

        // Requirement: server does not allow adding costs that belong to the past
        if (createdDate < now)
        {
            return res.status(400).json({
                id: userid,
                message: "Cannot add costs in the past"
            });
        }

        // Verify user exists (requirement/Q&A)
        const userExists = await User.findOne({ id: userid });
        if (!userExists)
        {
            return res.status(404).json({ id: userid, message: "User not found" });
        }

        // Create cost document (store sum as Decimal128 by passing it as string)
        const newCost = new Cost({
            description,
            category,
            userid,
            sum: sumAsNumber.toString(),
            created_at: createdDate
        });

        const savedCost = await newCost.save();

        // Response must be the cost item itself (same properties as in costs collection)
        return res.status(201).json(savedCost);
    }
    catch (error)
    {
        console.log("Error adding cost item", error);

        // Error response must include at least: id + message
        return res.status(500).json({
            id: (req.body && req.body.userid) ? req.body.userid : 0,
            message: "Error adding cost item",
            error: error.message
        });
    }
});

/*
 * GET /api/report?id=...&year=...&month=...
 * ---------------------------------------
 * Returns a monthly report grouped by categories.
 * Computed pattern: if the report is for a past month, cache it in the reports collection.
 */
app.get('/api/report', async (req, res) => {
    try
    {
        // Additional log for endpoint access (in addition to request-level log)
        const endpointLog = new Log({
            level: 'info',
            message: "Endpoint accessed: GET /api/report (Costs Service)"
        });
        endpointLog.save().catch((err) => logger.error("Failed to save endpoint log to DB", err));

        const { id, year, month } = req.query;

        const userID = parseInt(id, 10);
        const reportYear = parseInt(year, 10);
        const reportMonth = parseInt(month, 10);

        // Validate required parameters
        if (!userID || !reportYear || !reportMonth)
        {
            return res.status(400).json({
                id: userID || 0,
                message: "Missing parameters: id, year, month are required"
            });
        }

        // Verify user exists
        const userExists = await User.findOne({ id: userID });
        if (!userExists)
        {
            return res.status(404).json({ id: userID, message: "User not found" });
        }

        // Determine if requested month already passed
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const isPastReport =
            (reportYear < currentYear) ||
            (reportYear === currentYear && reportMonth < currentMonth);

        // If past report, try to return cached report from DB
        if (isPastReport)
        {
            const existingReport = await Report.findOne({
                userid: userID,
                year: reportYear,
                month: reportMonth
            });

            if (existingReport)
            {
                return res.json({
                    userid: userID,
                    year: reportYear,
                    month: reportMonth,
                    costs: existingReport.costs
                });
            }
        }

        // Calculate the report (not cached yet / not a past report)
        const startDate = new Date(reportYear, reportMonth - 1, 1);
        const endDate = new Date(reportYear, reportMonth, 1);

        // Fetch relevant costs from DB
        const costs = await Cost.find({
            userid: userID,
            created_at: { $gte: startDate, $lt: endDate }
        });

        // Group the costs by category and format each item as: sum, day, description
        const categories = ['food', 'health', 'housing', 'sports', 'education'];

        const costsResults = categories.map((cat) => {
            const categoryCosts = costs
                .filter((c) => c.category === cat)
                .map((c) => ({
                    sum: c.sum ? parseFloat(c.sum.toString()) : 0,
                    description: c.description,
                    day: c.created_at.getDate()
                }));

            return { [cat]: categoryCosts };
        });

        // Save to cache only if it's a past report
        if (isPastReport)
        {
            try
            {
                const newReport = new Report({
                    userid: userID,
                    year: reportYear,
                    month: reportMonth,
                    costs: costsResults
                });

                await newReport.save();
            }
            catch (saveError)
            {
                // If unique index exists, duplicates may happen under concurrency; ignore and continue
                logger.error("Failed to save cached report (may already exist)", saveError);
            }
        }

        // Return report
        return res.json({
            userid: userID,
            year: reportYear,
            month: reportMonth,
            costs: costsResults
        });
    }
    catch (error)
    {
        console.log("Error generating report", error);

        // Error response must include at least: id + message
        return res.status(500).json({
            id: req.query && req.query.id ? parseInt(req.query.id, 10) : 0,
            message: "Error generating report",
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Costs Service is running on port ${PORT}`);
});
