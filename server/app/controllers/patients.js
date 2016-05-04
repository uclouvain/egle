var dbUser  = require('../models/user');
var audit   = require('../audit-log');

// Retrieve a patient
exports.read = function(req, res) {
    if(!req.forbidden){
        var medicalRecord = fs.readFileSync("./medicalRecord/patients.json").toString();
        var patients = JSON.parse(medicalRecord);
        var count = 0;
        if (req.params.username !== undefined) {
            dbUser.userModel.findOne({
                username : req.params.username
            }, {
                _id:1
            })
            .exec(function(err, user) {
                if (err){
                    console.log(err);
                    audit.logEvent('[mongodb]', 'Patients ctrl', 'Read', '', '', 'failed', 'Mongodb attempted to retrieve a tip');
                    return res.status(500).send(err);
                } else {
                    patients.forEach(function(patient) {
                        if (patient !== undefined) {
                            if (patient.id == user._id) {
                                return res.json(patient);
                            }
                        } else {
                            return res.json({
                                ok: false,
                                err: "error in a patient structure: " + JSON.stringify(patient)
                            });
                        }
                        count++;
                    });
                    if(count == patients.length){
                        return res.json({
                            ok: false,
                            err: "Patient not found."
                        });
                    }
                }
            });
        } else {
            return res.json({
                ok: false,
                err: "Bad request."
            });
        }
    } else {
        return res.sendStatus(403);
    }
};