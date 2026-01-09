const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the User schema
const UserSchema = new Schema({
    id:{
        type:Number,
        required:true,
        // Validation: Ensures that every user has a unique ID in the database.
        unique:true
    },
    first_name:{
        type:String,
        required:true
    },
    last_name:{
        type:String,
        required:true
    },
    birthday:{
        type:Date,
        required:true
    }
});
// Create the model from the schema and export it
const User = mongoose.model('User', UserSchema);
module.exports = User;