const mongoose = require('mongoose'); // Import Mongoose (MongoDB ODM)
const Schema = mongoose.Schema; // Shortcut to Mongoose Schema

/*
 * User Schema
 * -----------
 * Stores user details.
 * IMPORTANT: 'id' is NOT MongoDB '_id'. It must be a Number (project requirement).
 */

// Define the schema for a 'User' document
const UserSchema = new Schema(
    {
        // Unique user id (Number). This is separate from MongoDB '_id'.
        id: {
            type: Number,
            required: true,
            unique: true
        },

        // User's first name
        first_name: {
            type: String,
            required: true
        },

        // User's last name
        last_name: {
            type: String,
            required: true
        },

        // User's birthday (Date)
        birthday: {
            type: Date,
            required: true
        }
    }
);

// Create the model from the schema
const User = mongoose.model('User', UserSchema);

// Export the model so services can use it
module.exports = User;
