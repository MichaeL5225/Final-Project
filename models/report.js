const mongoose = require('mongoose'); // Import Mongoose (MongoDB ODM)
const Schema = mongoose.Schema; // Shortcut to Mongoose Schema

/*
 * Report Schema (Computed Design Pattern)
 * --------------------------------------
 * This collection stores a cached monthly report per user.
 * When a report is requested for a month that has already passed, the server can save it here
 * and return it quickly on future requests.
 */

// Define the schema for a 'Report' document
const ReportSchema = new Schema(
    {
        // User id (NOT MongoDB _id) - Number as required
        userid: {
            type: Number,
            required: true
        },

        // Report year (e.g., 2026)
        year: {
            type: Number,
            required: true
        },

        // Report month (1-12)
        month: {
            type: Number,
            required: true
        },

        // The report content grouped by categories, as required by the project JSON format
        costs: {
            type: Array,
            required: true
        }
    }
);

// Prevent saving multiple cached reports for the same user+year+month
ReportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true });

// Create the model from the schema
const Report = mongoose.model('Report', ReportSchema);

// Export the model so services can use it
module.exports = Report;
