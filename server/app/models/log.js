var mongoose = require('mongoose');

var logSchema = new mongoose.Schema({
    severity: {type:String},
    date: {type:Date},
    file: {type:String},
    line: {type:Number},
    message: {type:String}
});

logSchema.statics.findAll = function (cb) {
    this.find(cb);
};

var logModel = mongoose.model('Log', logSchema);

exports.logModel = logModel;