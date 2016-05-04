var mongoose = require('mongoose');

var auditSchema = new mongoose.Schema({
    actor: {type:String},
    date: {type:Date},
    origin: {type:String},
    action: {type:String},
    label: {type:String},
    object: {type:String},
    status: {type:String},
    description: {type:String}
});

auditSchema.statics.findAll = function (cb) {
    this.find(cb);
};

var auditModel = mongoose.model('auditLog', auditSchema);

exports.auditModel = auditModel;