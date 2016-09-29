/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Aissa Ghouti
 * All rights reserved.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

var dbUser  = require('../models/user');
var audit   = require('../audit-log');
var fs		= require('fs');

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