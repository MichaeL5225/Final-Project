const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the Log schema
const LogSchema = new Schema({
    level: {
        type: String,
        required: true,
        enum: ['info', 'warn', 'error','fatal','debug', 'trace']
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        // Default Value: Automatically records the exact time the log was created.
        default: Date.now
    }
});
// Create and export the Log model
const Log = mongoose.model('Log', LogSchema);
module.exports = Log;