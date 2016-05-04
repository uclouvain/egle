var mongoose = require('mongoose');

// Entry schema
var Schema = mongoose.Schema;
var Objective = new Schema({
    userID: { type: String, required: true },
    type: { type: String, required: true },
    values: [{
        type: { type: String, required: false },
        value : { type: Number, required: false },
        subType: { type: String, required: false },
    }],
    datetime : { type: Date, default: Date.now }
});


//Define Models
var objectiveModel = mongoose.model('Objective', Objective);

// Export Models
exports.objectiveModel = objectiveModel;