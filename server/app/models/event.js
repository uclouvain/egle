var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Event schema
var Event = new Schema({
    userID: { type: String, required: true },
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    where: {
        place: { type: String, required: false },
        latitude: { type: String, required: false },
        longitude: { type: String, required: false }
    },
    type: { type: String, required: false },
    relatedEntryID: { type: String, required: false }
});

// Define Models
var eventModel = mongoose.model('Event', Event);

// Exports Models
exports.eventModel = eventModel;