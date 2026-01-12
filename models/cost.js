const mongoose = require('mongoose'); // MongoDB ODM (Mongoose)
const Schema = mongoose.Schema; // Shortcut to Mongoose Schema

/*
 * Cost Schema
 * -----------
 * Holds a single cost item.
 * NOTE: MongoDB stores JS Number as BSON Double, which matches the "Double" requirement.
 * created_at defaults to now if not provided by the client.
 */
const CostSchema = new Schema(
    {
        // Short description of the cost item
        description: {
            type: String,
            required: true
        },

        // Category must be one of the allowed categories from the project requirements
        category: {
            type: String,
            required: true,
            enum: ['food', 'health', 'housing', 'sports', 'education']
        },

        // User id (NOT Mongo _id) - must be Number according to requirements
        userid: {
            type: Number,
            required: true
        },

        // Sum stored as Number (BSON Double in MongoDB)
        sum: {
            type: Number,
            required: true
        },

        // Creation time; if not provided by the request, server uses request receive time (Date.now)
        created_at: {
            type: Date,
            default: Date.now
        }
    }
);

// Create the model from the schema
const Cost = mongoose.model('Cost', CostSchema);

// Export the model so services can use it
module.exports = Cost;
