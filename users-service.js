require('dotenv').config();

// Import required packages
const express = require('express');
const mongoose = require('mongoose');

// Import Mongoose models
const User = require('./models/user');
const Cost = require('./models/cost');
// Initialize logging with Pino
const pino = require('pino');
const Log = require('./models/log');
const logger = pino();

const app = express();

app.use(express.json());
const MONGO_URI = process.env.MONGO_URI;
// Connecting to MongoDB
mongoose.connect(MONGO_URI).then(() =>{
    console.log("MongoDB Connected(Users Service)");
})
.catch((error) =>{
    console.log("Failed to connect to MongoDB (Users Service)", error);
});
//log for every incoming request
app.use(async (req, res, next) => {
    try {
        logger.info(`request received: ${req.method} ${req.url}`);

        const newLog = new Log({
            level: 'info',
            message: `Request received: ${req.method} ${req.url} (Users Service)`
        });
        //Save log to DB without blocking the response
        newLog.save().catch(err => logger.error("Failed to save log to DB", err));
    } catch(error) {
        logger.error("Error inside logging middleware", error);
    }
    next();
});
//Create a new user
app.post('/api/add', async (req, res) => {
    try {
        const {id, first_name, last_name, birthday} = req.body;
        const newUser = new User({
            id,
            first_name,
            last_name,
            birthday
        });
        // Save to database
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch(error){
        console.log("error in creating new user", error);
        res.status(500).json({message:"Error adding user",error:error.message});
    }
});
//Get user details including total costs
app.get('/api/users/:id', async (req, res) => {
    try {
        const userID = parseInt(req.params.id);
        // find the user
        const user = await User.findOne({ id: userID });

        if(!user){
            return res.status(404).json({message: "User not found", id : userID});
        }
        // calculate total costs for this user
        const totalCosts = await Cost.aggregate([
            {$match: {userid: userID}},
            {$group: {_id: null, total: {$sum: "$sum"}}}
        ]);
        // extract total if user has no costs default to 0
        const total = totalCosts.length > 0 ? totalCosts[0].total : 0;
        //Return combined data
        res.json({
            first_name: user.first_name,
            last_name: user.last_name,
            id: user.id,
            total: total
        });

    } catch(error) {
        console.log("error getting user details", error);
        res.status(500).json({message:"Error getting user details", error: error.message});
    }
});
//Get all users
app.get('/api/users', async (req,res) => {
    try {
        const users = await User.find ({});
        res.json(users);
    } catch (error) {
        console.log("error fetching users", error);
        res.status(500).json({message:"Error fetching users", error: error.message});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Users Service is running on port ${PORT}`);
});