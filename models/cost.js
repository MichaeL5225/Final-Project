const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the schema for a 'Cost' item
const CostSchema = new Schema({
    description:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true,
        enum: ['food', 'health', 'housing','sports','education']
    },
    userid:{
        type: Number,
        required: true
    },
    sum:{
        type:Number,
        required: true
    },
    created_at: {
        type: Date,
        // Default Value: If no date is provided, the current timestamp is used automatically.
        default: Date.now
    }
});
// Create the model from the schema and export it
const Cost = mongoose.model('Cost', CostSchema);
module.exports = Cost;