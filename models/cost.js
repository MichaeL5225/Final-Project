const mongoose = require('mongoose'); //  MongoDB ODM (Mongoose)
const Schema = mongoose.Schema; //  Shortcut to Mongoose Schema

/* 
 * Cost Schema
 * -----------
 * Holds a single cost item.
 * Note: 'sum' is stored as Decimal128 to match the "Double" requirement and avoid floating-point issues.
 * created_at defaults to now if not provided by the client.
 */
function decimalToString(i_Value) //  Convert Decimal128 to string for clean JSON output
{
    return i_Value ? i_Value.toString() : i_Value; //  Prevent undefined/null issues
}

//  Define the schema for a 'Cost' document in MongoDB
const CostSchema = new Schema(
    {
        //  Short description of the cost item
        description: {
            type: String,
            required: true
        },

        //  Category must be one of the allowed categories from the project requirements
        category: {
            type: String,
            required: true,
            enum: ['food', 'health', 'housing', 'sports', 'education']
        },

        //  User id (NOT Mongo _id) - must be Number according to requirements
        userid: {
            type: Number,
            required: true
        },

        //  Sum stored as Decimal128 ("Double") - getter makes JSON readable
        sum: {
            type: mongoose.Schema.Types.Decimal128,
            required: true, get: decimalToString
        },

        //  Creation time; if not provided by the request, server uses request receive time (Date.now)
        created_at: {
            type: Date,
            default: Date.now
        }
    },
    {
        //  Ensure getters (Decimal128 -> string) are applied when converting to JSON/Object
        toJSON: {
            getters: true
        },
        toObject: {
            getters: true
        }
    }
);

//  Create the model from the schema
const Cost = mongoose.model('Cost', CostSchema);

//  Export the model so services can use it
module.exports = Cost;
