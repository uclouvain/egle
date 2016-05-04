var mongoose = require('mongoose');

// Entry schema
var Schema = mongoose.Schema;
var Entry = new Schema({
    userID: { type: String, required: true },
    type: { type: String, required: true },
    subType: { type: String, required: false },
    value: { type: String, required: false },
    values: [{
        type: { type: String, required: false },
        value : { type: String, required: false }
    }],
    datetimeAcquisition : { type: Date, default: Date.now },
    comments : String,
    datetime : { type: Date, default: Date.now },
    isSkipped: { type: Boolean, default: false },
	isValidated : { type: Boolean, default: false }
});


//Define Models
var entryModel = mongoose.model('Entry', Entry);

// Export Models
exports.entryModel = entryModel;