const mongoose = require('mongoose'); //  MongoDB ODM (Mongoose)
const Schema = mongoose.Schema; //  Shortcut to Mongoose Schema

/*
 * Log Schema
 * ----------
 * We keep logs flexible because Pino (or any logger) may store different fields.
 * strict:false means Mongo documents can include any structure (req/res/time/level/msg/etc.).
 * timestamps:true adds createdAt/updatedAt automatically for easier sorting and debugging.
 */

//  Flexible schema for logs (no fixed fields)
const LogSchema = new Schema(
    {},
    {
        strict: false,   //  Allow any fields (fits Pino output and custom logs)
        timestamps: true //  Adds createdAt / updatedAt automatically
    }
);

//  Create and export the Log model
const Log = mongoose.model('Log', LogSchema);
module.exports = Log;
