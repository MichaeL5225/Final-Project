require('dotenv').config();
// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
// Import the Log model to access the 'logs' collection
const Log = require('./models/log');

const app = express();
app.use(express.json());
//Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI).then(() => {
    console.log('Connected to MongoDB(Logs Service)');
})
.catch((error) => {
    console.log("Failed to connect to MongoDB", error);
});

//Get all system logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await Log.find({});
        res.json(logs);
    } catch (error) {
        res.status(500).json({message: "Error fetching logs", error});
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Logs Service is running on port ${PORT}`);
});