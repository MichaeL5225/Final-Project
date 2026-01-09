require('dotenv').config();
// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
// Import mongoose models
const Cost = require('./models/cost');
const User = require('./models/user');
const Report = require('./models/report');

// Initialize logging with Pino
const Log = require("./models/log");
const pino = require('pino');
const logger = pino();


const app = express();
app.use(express.json());
const MONGO_URI = process.env.MONGO_URI;

// Connecting to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB(Costs Service)");
    })
    .catch((error) => {
        console.log("Failed to connect to MongoDB(Costs Service)", error);
    });

//log for every incoming request

app.use(async (req, res, next) => {
    try {
        logger.info(`request received: ${req.method} ${req.url}`);

        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Costs Service)`
        });
        //Save log to DB without blocking the response
        newLog.save().catch(err => logger.error("Failed to save log to DB", err));
    } catch(error) {
        logger.error("Error inside logging middleware", error);
    }
    next();
});
// Add a new cost item
app.post('/api/add', async (req, res) => {
    try{


    const {description, category, userid, sum, created_at} = req.body;
    const userExists = await User.findOne({id: userid});

    if (!userExists) {
        return res.status(404).json({message: "User not found. Cannot add cost."});
    }
//Create a cost document
    const newCost = new Cost({
        description,
        category,
        userid,
        sum,
        created_at : created_at ? new Date(created_at) : new Date()
    });

    const savedCost = await newCost.save();
    res.status(201).json({savedCost});
    } catch (error) {
        console.log("Error adding cost item", error);
        res.status(500).json({message: "Error adding cost item", error: error.message});
    }
});
/*
Computed pattern implementation
checking if the requested report is for a past month,
if it is trying to fetch a pre-calculated report from reports collection
if not found calculate the report .
 */
app.get('/api/report', async (req, res) => {
    try {
        const {id, year , month} = req.query;
        const userID = parseInt(id);
        const reportYear = parseInt(year);
        const reportMonth = parseInt(month);

        // Validate required parameters
        if(!userID || !reportYear || !reportMonth) {
            return res.status(404).json({message: "Missing parameters : id, year and month are required."});
        }
        // Checking if the requested report in for a past month
        const currentDate = new Date();
        const isPastReport = (reportYear < currentDate.getFullYear()) || (reportYear === currentDate.getFullYear() && reportMonth < (currentDate.getMonth() + 1));
        // Checking if there is a pre-calculated report in cache
        if (isPastReport) {
            const existingReport = await Report.findOne({userid: userID,year: reportYear,month: reportMonth});

            if (existingReport) {
                return res.json({
                    userid: userID,
                    year: reportYear,
                    month: reportMonth,
                    costs: existingReport.costs
                });
            }
        }
        // calculate the report if not in cache
        const startDate = new Date(reportYear, reportMonth - 1,1);
        const endDate = new Date(reportYear, reportMonth,1);
        // fetch relevant costs from the DB
        const costs = await Cost.find({
            userid: userID,
            created_at: { $gte: startDate, $lt: endDate}
        });
        // Group the costs by category
        const categories = ['food', 'health', 'housing', 'sports', 'education'];
        const costsResults = categories.map(category => {
            const categoryCost = costs.filter(c => c.category ===category).map(c => ({
                sum: c.sum,
                description: c.description,
                day: c.created_at.getDate()
            }));
            return {[category]: categoryCost};
        });
        // saving the report in the cache
        if (isPastReport) {
            const newReport = new Report({
                userid: userID,
                year: reportYear,
                month: reportMonth,
                costs: costsResults,
            });
            await newReport.save();
        }
        res.json({
            userid: userID,
            year: reportYear,
            month: reportMonth,
            costs: costsResults,
        });
    } catch (error){
        console.log("Error generating report", error);
        res.status(500).json({message: "Error generating report", error: error.message});
    }
})

const PORT =  process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Costs Service is running on port ${PORT}`);
})