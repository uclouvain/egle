
var db              = require('../models/entry');
var dbUser          = require('../models/user');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');

var entryType = "glycaemia";

/**
 * Compute the estimated glycated hemoglobin value over the
 * past 120 days of glycaemia entries.
 */
exports.computeValue = function(req, res) {
 var token = tokenManager.getToken(req.headers);
 if(token != null){
     var actorID = jsonwebtoken.decode(token).id;
     if (req.originalUrl.indexOf("/hemoglobin") === 4) {
         //The actor is the patient
    	 var patientCondition = jsonwebtoken.decode(token).condition;
         computeValue(actorID, actorID, patientCondition, function(err, entries){
             if (err){
                 res.status(500).send(err);
             } else {
                 return res.json(entries);
             }
         });
     } else {
         //The actor is the doctor
         if(!req.forbidden){
             if(req.params.username !== undefined){
                 dbUser.userModel.findOne({
                     username : req.params.username
                 }, {_id:1})
                 .exec(function(err, user) {
                     if (err){
                         console.log(err);
                         audit.logEvent('[mongodb]', 'Hemoglobin', 'ComputeValue', '', '', 'failed', 'Mongodb attempted to retrieve a user');
                         res.status(500).send(err);
                     }
                     else{  
                         computeValue(actorID, user._id, user.condition, function(err, entries){
                             if (err){
                                 res.status(500).send(err);
                             } else {
                                 return res.json(entries);
                             }
                         });
                     }
                  });
             }
             else{
                 audit.logEvent(actorID, 'Hemoglobin', 'ComputeValue', '', '', 'failed',
                                'The user could not retrieve entries because one or more params of the request was not defined');
                 return res.sendStatus(400); 
             }
         } else {
             return res.sendStatus(403);
         }
     }
 } else {
     audit.logEvent('[anonymous]', 'Hemoglobin', 'ComputeValue', '', '', 'failed','The user was not authenticated');
     return res.sendStatus(401); 
 }
}

/**
 * Take all the glycaemia entries from the past 120 days.<br>
 * Compute the mean value from those entries.<br>
 * Estimate the glycated hemoglobin from this mean and send it back.<br>
 * Formula used : eAG(mg/dl)= (28.7*HbA1c)-46.7<br>
 * Reversed to have: HbA1c = (eAG + 46.7) / 28.7
 */
var computeValue = function(actorID, patientID, patientCondition, callback){
 var query = {
     userID : patientID,
     type: entryType
 };

 // 120 days ago =>
 var threeMonthsAgo = new Date();
 threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 120);

 db.entryModel.find(query)
 .where('datetimeAcquisition').gt(threeMonthsAgo)
 .sort({"datetimeAcquisition" : 1})
 .exec(function(err, entries) {
     if (err) {
         console.log(err);
         audit.logEvent('[mongodb]', 'Hemoglobin', 'ComputeValue', '', '', 'failed', 'Mongodb attempted to retrieve entries');
         callback(err);
     } else {
    	 var len = entries.length;
    	 var glycHemo = 0;
    	 var divider = 0; 
    	 var dateFirstEntry = new Date();
    	 var isValueGood = false;
    	 
    	 if(len > 0){
	    	 // Compute the mean.
	    	 	// Sum
	    	 var sum = 0.0;
	    	
	    	 var foundFirst = false;
	    	 for(var i = 0; i < len; ++i){
	    		 if(entries[i].value !== undefined && entries[i].value !== 'undefined'){
		    		 sum += parseFloat(entries[i].value);
		    		 ++divider;
		    		 if(!foundFirst){
		    			 dateFirstEntry = entries[i].datetimeAcquisition;
		    			 foundFirst = true;
		    		 }
	    		 }
	    	 }
	    	 	// Divide
	    	if(divider > 0){
		    	 var mean = sum / divider;	    
		    	 // Estimate the glycated hemoglobin.
		    	 glycHemo = (mean + 46.7) / 28.7;
	    	}
	    	// Is the value good ?
	    	if(patientCondition.indexOf("d1") > -1){
	    		if(glycHemo < 8.0)
	    			isValueGood = true;
	    	}
	    	if(patientCondition.indexOf("d2") > -1){
	    		if(glycHemo < 6.5 && glycHemo > 6.0)
	    			isValueGood = true;
	    	}
	    	
    	 }
    	 // Send back the estimated glycated hemoglobin value.
         callback(null, {value : glycHemo, nbEntries: divider, start: dateFirstEntry, isGood : isValueGood, condition : patientCondition});
     }
 });
}