const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the report schema
const ReportSchema = new Schema ({
    userid:{
        type: Number,
        required: true
    },
    year:{
        type: Number,
        required: true
    },
    month:{
        type: Number,
        required: true
    },
    cost:{
        type: Array, // Stores the array of categories (food, health, etc.)
        required: true
    }
});
// Create the model from the schema and export it
const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;