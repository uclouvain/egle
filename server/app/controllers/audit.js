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

var dbAudit         = require('../models/audit');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');

// Retrieve audit logs with a specified daterange
exports.listByDate = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token != null){
        var actorID = jsonwebtoken.decode(token).id;
        if(req.params.from !== undefined && req.params.to !== undefined){
            dbAudit.auditModel.find({
                date: {
                    $gt: new Date(req.params.from), 
                    $lt: new Date(req.params.to).setHours(23,59,59,999)
                }
            })
            .sort({"date" : 1})
            .exec(function(err, logs) {
                if (err){
                    audit.logEvent('[mongodb]', 'Audit', 'List by date', '', '', 'failed', 'Mongodb attempted to retrieve logs');
                    console.log(err);
                    return res.status(500).send(err);
                } else {
                    return res.json(logs);
                }
            });
        } else {
            audit.logEvent(actorID, 'Audit', 'List by date', '', '', 'failed',
                           'The user could not retrieve audit logs because one or more params of the request is not defined');
            return res.sendStatus(400); 
        }
    } else {
        audit.logEvent('[anonymous]', 'Audit', 'List by date', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}