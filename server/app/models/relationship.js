var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Contact schema
var Relationship  = new Schema({
    userID_1 : { type: String, required: true },//userID_1 is always smaller than userID_2
    userID_2 : { type: String, required: true },
    status : { type: String, required: true }, //0: Pending, 1: Accepted, 2: Declined
    actionUserID : { type: String, required: true }//userID who has performed the last status update.
});

//Define Model
var relationshipModel = mongoose.model('Relationship', Relationship);

// Export Model
exports.relationshipModel = relationshipModel;