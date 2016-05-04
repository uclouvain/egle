var mongoose = require('mongoose');

// Notification schema
var Schema = mongoose.Schema;
var Notification = new Schema({
    userID : { type: String, required: true },
    type : { type: String, required: true },
    objectiveID : { type: String, required: false },
    lastEntryID : { type: String, required: false },
    subType : { type: String, required: false },
    authorID : { type: String, required: false },
    content : { type: String, required: true },
    datetime : { type: Date, default: Date.now },
    datetimeRead : { type: Date },
});

//Define Models
var notificationModel = mongoose.model('Notification', Notification);

// Export Models
exports.notificationModel = notificationModel;