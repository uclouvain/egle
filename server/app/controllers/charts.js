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

var dbEntry         = require('../models/entry');
var dbUser          = require('../models/user');
var audit           = require('../audit-log');
var tokenManager    = require('../token_manager');
var jsonwebtoken    = require('jsonwebtoken');
var cardsList       = require('../dashboard/cards.json');
var _               = require('underscore');


// Build a chart with a specified patient id, a type of entry and a date range
exports.build = function(req, res) {
    var token = tokenManager.getToken(req.headers);
    if(token !== null){
    	var user = jsonwebtoken.decode(token);
        var actorID = user.id;
        if (req.originalUrl.indexOf("/charts") === 4) {
            //The actor is the patientvar 
        	var patientCondition = user.condition;
            if(req.params.type !== undefined && req.params.from !== undefined && req.params.to !== undefined){
                if(req.params.type === 'glycaemia'){
                    standardDay(actorID, actorID, {type: req.params.type, from: req.params.from, to: req.params.to}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                } else if(req.params.type === 'sport'){
                    sport(actorID, actorID, {from: req.params.from, to: req.params.to}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                } else if(req.params.type === 'meal'){
                    meals(actorID, actorID, patientCondition, {from: req.params.from, to: req.params.to, type: req.params.type}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                } else if(req.params.type === 'morning' || req.params.type === 'snack10' || req.params.type === 'midday' || req.params.type === 'snack4' || req.params.type === 'evening'|| req.params.type === 'bedtime'){
                    insulin(actorID, actorID, {from: req.params.from, to: req.params.to, type: req.params.type}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                } else if(req.params.type === 'mobility'){
                    mobility(actorID, actorID, {from: req.params.from, to: req.params.to}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                }else if(req.params.type === 'symptoms'){
                    symptoms(actorID, actorID, {from: req.params.from, to: req.params.to}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                } else {
                    classic(actorID, actorID, {type: req.params.type, from: req.params.from, to: req.params.to}, function(err, chart){
                        if (err){
                            res.status(500).send(err);
                        } else {
                            return res.json(chart);
                        }
                    });
                }
            } else {
                audit.logEvent(actorID, 'Charts', 'Build', '', '', 'failed',
                               'The user could not build a chart because one or more params of the request was not defined');
                return res.sendStatus(400); 
            }
        } else {
            //The actor is the doctor
            if(!req.forbidden){
                if(req.params.username !== undefined && req.params.type !== undefined && req.params.from !== undefined && req.params.to !== undefined){
                    dbUser.userModel.findOne({
                        username : req.params.username
                    }, {_id: 1})
                    .exec(function(err, user) {
                        if (err){
                            console.log(err);
                            audit.logEvent('[mongodb]', 'Charts', 'Build', '', '', 'failed', 'Mongodb attempted to retrieve a user');
                            res.status(500).send(err);
                        } else {
                            if(req.params.type === 'glycaemia'){
                                standardDay(actorID, user._id, {type: req.params.type, from: req.params.from, to: req.params.to}, function(err, chart){
                                    if (err){
                                        res.status(500).send(err);
                                    } else {
                                        return res.json(chart);
                                    }
                                });
                            } else{
                                classic(actorID, user._id, {type: req.params.type, from: req.params.from, to: req.params.to}, function(err, chart){
                                    if (err){
                                        res.status(500).send(err);
                                    } else {
                                        return res.json(chart);
                                    }
                                });
                            }
                        }
                     });
                } else {
                    audit.logEvent(actorID, 'Charts', 'Build', '', '', 'failed',
                                   'The user could not build a chart because one or more params of the request was not defined');
                    return res.sendStatus(400); 
                }
            } else {
                return res.sendStatus(403);
            }
        }
    } else {
        audit.logEvent('[anonymous]', 'Charts', 'Build', '', '', 'failed','The user was not authenticated');
        return res.sendStatus(401); 
    }
}


//Build a classic chart
var classic = function(actorID, patientID, config, callback){
    dbEntry.entryModel.find({
        userID : patientID,
        type : config.type,
        datetimeAcquisition: {
            $gt: new Date(config.from), 
            $lt: new Date(config.to).setHours(23,59,59,999)
        }
    })
    .sort({"datetimeAcquisition" : 1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Charts', 'Build classic chart', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
            var chart = [];
            entries.forEach(function(item){
                if(item.value){
                    chart.push([new Date(item.datetimeAcquisition).getTime(), parseFloat(item.value)]);
                }
            });
            callback(null, chart);
        }
    });
}

//Build a glycaemia chart (standard day)
var standardDay = function(actorID, patientID, config, callback) {
    // Define the chart data structure
    var result = {
        series: [],
        mean: 0
    };
    var nb = 0, total = 0;
    
    function myLoop(d) {
        if (d <= new Date(config.to)) {
            classic(actorID, patientID, {
                type: config.type,
                from: new Date(d).setHours(0,0,0,0),
                to: new Date(d).setHours(23,59,59,999)
            }, function(err, data){
                if (err){
                    callback(err);
                } else {
                    if(data.length > 0){
                        var tooltips = [];
                        var chart = [];
                        for(var i = 0; i<data.length; i++){
                            // Calculate mean 
                            total = total + data[i][1];
                            nb++;
                            
                            // Build the new chart
                            chart.push({
                                x: new Date(2015, 0, 1, new Date(data[i][0]).getHours(), new Date(data[i][0]).getMinutes(), 0, 0).getTime(),
                                y: data[i][1],
                                origdate: new Date(data[i][0])
                            })
                        }
                        // Add this new serie to the main result structure
                        result.series.push({
                            data: chart,
                            color: '#D32F2F',
                            marker: {symbol: 'circle'}
                        });
                    }
                    myLoop(new Date(d.setDate(d.getDate() + 1)));
                }
            });
        } else {
            if(nb>0){
                result.mean = total/nb;
            }
            callback(null, result);
        }
    }
    myLoop(new Date(config.from));
}

// Build a weight chart
var weight = function(actorID, patientID, config, callback) {
    classic(actorID, patientID, {type: 'weight', from: config.from, to: config.to}, function(err, chart){
        if (err){
            callback(err);
        } else {
            var average = 0;
            for(var i=0; i < chart.length; i++){
                average += chart[i][1];
            }
            callback(null, [average / chart.length]);
        }
    });
}

//Build a steps chart
var steps = function(actorID, patientID, config, callback) {
 classic(actorID, patientID, {type: 'steps', from: config.from, to: config.to}, function(err, chart){
     if (err){
         callback(err);
     } else {
         var average = 0;
         for(var i=0; i < chart.length; i++){
             average += chart[i][1];
         }
         callback(null, [average / chart.length]);
     }
 });
}

// Build a sport chart
var sport = function(actorID, patientID, config, callback) {
    var from = new Date(new Date(config.from).setHours(0,0,0,0));
    var to = new Date(new Date(config.to).setHours(23,59,59,999));
    if((Math.floor(( to - from ) / 86400000)) > 31){
        from = new Date(from.getFullYear(), from.getMonth(), 1);
    }
    
    // Retrieve sport entries
    dbEntry.entryModel.find({
        userID : patientID,
        type : 'activity',
        subType: 'sport',
        datetimeAcquisition: {
            $gt: from, 
            $lt: to
        }
    })
    .sort({"datetimeAcquisition" : 1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Charts', 'Build sport', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
            // Define the chart data structure
            var result = {
                categories: [],
                series: [{
                    name: '1',
                    data: [],
                    color: '#E1BEE7'
                },{
                    name: '2',
                    data: [],
                    color: '#CE93D8'
                },{
                    name: '3',
                    data: [],
                    color: '#BA68C8'
                },{
                    name: '4',
                    data: [],
                    color: '#AB47BC'
                },{
                    name: '5',
                    data: [],
                    color: '#9C27B0'
                }]
            };
            
            // If there is any entry
            if(entries.length > 0){
                var chart = [];
                // The actor asked for a view per WEEK
                if((Math.floor(( to - from ) / 86400000)) < 31){
                    var weeks = [];
                    // Loop over entries array and build result array 
                    for (i=0;i<entries.length;i++){
                        // If init OR If the datetime week number of curent entry is the same as the last treated entry
                        if((i === 0) || (new Date(entries[i].datetimeAcquisition).getWeekNumber() === 
                                         new Date(weeks[weeks.length-1].datetime).getWeekNumber())){
                            weeks.push({
                                datetime: new Date(entries[i].datetimeAcquisition).getTime(),
                                value: parseFloat(entries[i].value),
                                intensity: entries[i].values[0].value
                            });
                        } else {
                            chart.push({
                                rangeOfWeek: getDateRangeOfWeek(
                                    new Date(weeks[weeks.length-1].datetime).getWeekNumber(),
                                    new Date(weeks[weeks.length-1].datetime).getFullYear()
                                ),
                                data: weeks
                            });
                            
                            // Restart with a new weeks array
                            weeks = [];
                            weeks.push({
                                datetime: new Date(entries[i].datetimeAcquisition).getTime(),
                                value: parseFloat(entries[i].value),
                                intensity: entries[i].values[0].value
                            });
                        }
                        
                        // For the last entry
                        if(i === entries.length - 1){
                            chart.push({
                                rangeOfWeek: getDateRangeOfWeek(
                                    new Date(weeks[weeks.length-1].datetime).getWeekNumber(),
                                    new Date(weeks[weeks.length-1].datetime).getFullYear()
                                ),
                                data: weeks
                            });
                        }
                    }
                    
                    // Found the week number max
                    var max;
                    if(new Date(config.to).getWeekNumber() === 1){
                        max = weeksInYear(new Date(config.from).getFullYear()) + 2;
                    } else {
                        max = new Date(config.to).getWeekNumber() + 1;
                    }
                    
                    // Build chart categories
                    for (i = new Date(config.from).getWeekNumber()+1; i<max; i++){
                        result.categories.push(getDateRangeOfWeek(i, new Date(config.from).getFullYear()));
                        for (j=0;j<result.series.length;j++){
                            result.series[j].data.push(0);
                        }
                    }
                    
                    // Loop over categories
                    for (i=0;i<result.categories.length;i++){
                        for (j=0;j<chart.length;j++){
                            if(result.categories[i] === chart[j].rangeOfWeek){
                                for (k=0;k<chart[j].data.length;k++){
                                    var value = chart[j].data[k].value;
                                    switch(chart[j].data[k].intensity){
                                        case '1':
                                            result.series[0].data[i] += value;
                                        break;
                                        case '2':
                                            result.series[1].data[i] += value;
                                        break;
                                        case '3':
                                            result.series[2].data[i] += value;
                                        break;
                                        case '4':
                                            result.series[3].data[i] += value;
                                        break;
                                        case '5':
                                            result.series[4].data[i] += value;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // The actor asked for a view per MONTH
                    var months = [];
                    for (i=0;i<entries.length;i++){
                        if((i === 0) || (new Date(entries[i].datetimeAcquisition).getMonth()+1 === 
                                         new Date(months[months.length-1][0]).getMonth()+1)){
                            months.push({
                                datetime: new Date(entries[i].datetimeAcquisition).getTime(),
                                value: parseFloat(entries[i].value),
                                intensity: entries[i].values[0].value
                            });
                        } else {
                            chart.push({
                                monthNumber: new Date(months[months.length-1].datetime).getMonth()+1,
                                data: months
                            });
                            
                            // Restart with a new months array
                            months = [];
                            months.push({
                                datetime: new Date(entries[i].datetimeAcquisition).getTime(),
                                value: parseFloat(entries[i].value),
                                intensity: entries[i].values[0].value
                            });
                        }

                        if(i === entries.length - 1){
                            chart.push({
                                monthNumber: new Date(months[months.length-1].datetime).getMonth()+1,
                                data: months
                            });
                        }
                    };
                    
                    // Build chart categories
                    for (i = new Date(new Date(config.from).setMonth(new Date(config.from).getMonth() + 1));
                         i <= new Date(new Date(config.to).setMonth(new Date(config.to).getMonth() + 1)); 
                         i = new Date(new Date(i).setMonth(i.getMonth() + 1))) {
                        result.categories.push(i.getMonth() + 1);
                        for (j=0;j<result.series.length;j++){
                            result.series[j].data.push(0);
                        }
                    }
                    
                    // Loop over categories
                    for (i=0;i<result.categories.length;i++){
                        for (j=0;j<chart.length;j++){
                            if(result.categories[i] === chart[j].monthNumber){
                                for (k=0;k<chart[j].data.length;k++){
                                    var value = chart[j].data[k].value;
                                    switch(chart[j].data[k].intensity){
                                        case '1':
                                            result.series[0].data[i] += value;
                                        break;
                                        case '2':
                                            result.series[1].data[i] += value;
                                        break;
                                        case '3':
                                            result.series[2].data[i] += value;
                                        break;
                                        case '4':
                                            result.series[3].data[i] += value;
                                        break;
                                        case '5':
                                            result.series[4].data[i] += value;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Calculate mean value
                    for (i=0;i<result.series.length;i++){
                        for (j=0;j<result.series[i].data.length;j++){
                            result.series[i].data[j] = result.series[i].data[j]/4;
                        }
                    }
                }
            }
            callback(null, result);
        }
    });
}

// Build a meal chart
var meals = function(actorID, patientID, condition, config, callback) {
    dbEntry.entryModel.find({
        userID : patientID,
        type : 'meal',
        datetimeAcquisition: {
            $gt: new Date(config.from), 
            $lt: new Date(config.to).setHours(23,59,59,999)
        }
    }, {
        'values': 1, 'datetimeAcquisition': 1, _id:0
    })
    .sort({"datetimeAcquisition" : 1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Charts', 'Build meals', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
            var result = {
                categories: ['Morning', 'Midday', 'Evening'],
                series: []
            };
            if(condition.indexOf('d1') > -1 || condition.indexOf('d2') > -1){
            	result.series.push({
                    name: 'Fats',
                    data: [0,0,0],
                    color: '#B2EBF2',
                    stack: 'calorie',
                    score: 1
                });
            	result.series.push({
                    name: 'Fast sugars',
                    data: [0,0,0],
                    color: '#00BCD4',
                    stack: 'calorie',
                    score: 1
                });
            	result.series.push({
                    name: 'Slow sugars',
                    data: [0,0,0],
                    color: '#00838F',
                    stack: 'calorie',
                    score: 2
                });
            }
            
            if(condition.indexOf('hf') > -1){
            	result.series.push({
            		name: 'Salt',
            		data: [0,0,0],
            		color: '#bdbdbd',
                    stack: 'salt',
            		score: 1
            	});
            }
            
            if(entries.length > 0){
                var totalMorning = 0, totalMidday = 0, totalEvening = 0;
                var from, to;
                for(i=0;i<entries.length;i++){
                	var isMorning = false;
                	var isMidday = false;
                	var isEvening = false;
                    if(entries[i].datetimeAcquisition >= new Date(entries[i].datetimeAcquisition).setHours(0, 0, 0) && entries[i].datetimeAcquisition < new Date(entries[i].datetimeAcquisition).setHours(11, 0, 0)){
                    	isMorning = true;
                    	totalMorning++;
                    }else if(entries[i].datetimeAcquisition >= new Date(entries[i].datetimeAcquisition).setHours(11, 0, 0) && entries[i].datetimeAcquisition < new Date(entries[i].datetimeAcquisition).setHours(15, 0, 0)){
                    	isMidday = true;
                    	totalMidday++;
                    } else if(entries[i].datetimeAcquisition >= new Date(entries[i].datetimeAcquisition).setHours(15, 0, 0) && entries[i].datetimeAcquisition < new Date(entries[i].datetimeAcquisition).setHours(23, 59, 59)){
                    	isEvening = true;
                    	totalEvening++;
                    }
                    for(j=0;j<entries[i].values.length;j++){
                    	var k = -1;
                        if((condition.indexOf('d1') > -1 || condition.indexOf('d2') > -1) && entries[i].values[j].type === 'slow'){
                            k = 2;
                        } else if ((condition.indexOf('d1') > -1 || condition.indexOf('d2') > -1)&& entries[i].values[j].type === 'fast'){
                        	k = 1;
                        } else if ((condition.indexOf('d1') > -1 || condition.indexOf('d2') > -1) && entries[i].values[j].type === 'fats'){
                        	k = 0;
                        } else if (condition.indexOf('hf') > -1 && entries[i].values[j].type === 'salt'){
                            if(condition.indexOf('d1') > -1 || condition.indexOf('d2') > -1)
                            	k = 3;  
                            else k = 0;
                        }
                        if(k > -1 && k < result.series.length){
	                        if(isMorning)
	                        	result.series[k].data[0] += isNaN(parseInt(entries[i].values[j].value)) ? 0 : parseInt(entries[i].values[j].value);
	                        else if(isMidday)
	                        	result.series[k].data[1] += isNaN(parseInt(entries[i].values[j].value)) ? 0 : parseInt(entries[i].values[j].value);
	                        else if(isEvening)
	                        	result.series[k].data[2] += isNaN(parseInt(entries[i].values[j].value)) ? 0 : parseInt(entries[i].values[j].value);
                        }  
                    }
                }

                //Mean morning
                for(i=0;i<result.series.length;i++){
                    result.series[i].data[0] = (result.series[i].data[0] / totalMorning) * result.series[i].score;
                }
                
                //Mean midday
                for(i=0;i<result.series.length;i++){
                    result.series[i].data[1] = (result.series[i].data[1] / totalMidday) * result.series[i].score;
                }
                
                //Mean evening
                for(i=0;i<result.series.length;i++){
                    result.series[i].data[2] = (result.series[i].data[1] / totalEvening) * result.series[i].score;
                }
            }
            callback(null, result);
        }
    });
}

var symptoms = function(actorID, patientID, config, callback) {
	var symptomsTypes = ['dyspnea','fatigue','swellings','weight','abdomen'];
	dbEntry.entryModel.find({
        userID : patientID,
        type : { $in: symptomsTypes },
        datetimeAcquisition: {
            $gt: new Date(config.from), 
            $lt: new Date(config.to).setHours(23,59,59,999)
        }
    }, {
        'values': 1, 'datetimeAcquisition': 1, _id:0
    })
    .sort({"datetimeAcquisition" : 1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Charts', 'Build symptoms', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
        	var result = {
    			series : [{
	                name: 'Symptoms',
	                data: [0, 0, 0, 0, 0],
	                pointPlacement: 'on'
	            }],
	            categories: ['Dyspnea','Fatigue','Swellings','Weight','Abdominal Pain']
        	};
        	 if(entries.length > 0){
        		 // Compute the mean for each type
        		 // (and the standard deviation for the weight)
                 var totals = [0, 0, 0, 0, 0];
                 var from, to;
                 // sum
                 for(var i = 0; i < entries.length; i++){
                	 var k = symptomsTypes.indexOf(entries[i].type);
                	 if(k > -1){
                		 result.series[0].data[k] += entries[i].value;
                		 totals[k]++;
                	 }
                 }
                 // mean
                 for(var i = 0; i < result.series[0].data; ++i)
                	 if(totals[i] > 0)
                		 result.series[0].data[i] = result.series[0].data[i] / totals[i];
                 
                 // now the standard deviation
                 var sd = 0;
                 // variance
                 for(var i = 0; i < entries.length; i++){
                	 if(entries.type == 'weight'){
                		 var temp = entries.value - result.series[0].data[3];
                		 sd += (temp * temp);
                	 }
                 }
                 if(totals[3] > 1)
                	 sd = sd / (totals[3] - 1);
                 // standard deviation
                 sd = Math.sqrt(sd);
                 
                 // now find what % of the mean weight the sd represent
                 var percent = (sd / result.series[0].data[3]) * 100;
                 
                 // let's say 25% is the worst possible and 1% is good
                 result.series[0].data[3] = percent * 4;
                 
                 callback(null, result);
        	 }        	
        }
    });
};

// Build an insulin chart
var insulin = function(actorID, patientID, config, callback) {
    dbEntry.entryModel.find({
        userID : patientID,
        type : 'insulin',
        datetimeAcquisition: {
            $gt: new Date(config.from).setHours(0,0,0,0), 
            $lt: new Date(config.to).setHours(23,59,59,999)
        }
    },{
        _id:0
    })
    .sort({"datetimeAcquisition" : 1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Charts', 'Build insulin', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
            var timeslot = _.findWhere(_.findWhere(cardsList, {name: 'insulin'}).subitems, {name: config.type}).params.timeslot;
            var result = {
                categories: [],
                series: [{
                    name: 'long',
                    title: 'Long',
                    data: [0,0,0,0,0,0,0],
                    color: '#1565C0'
                },{
                    name: 'intermediate',
                    title: 'Intermediate',
                    data: [0,0,0,0,0,0,0],
                    color: '#1E88E5'
                },{
                    name: 'mixed',
                    title: 'Mixed',
                    data: [0,0,0,0,0,0,0],
                    color: '#E0E0E0'
                },{
                    name: 'rapid',
                    title: 'Rapid',
                    data: [0,0,0,0,0,0,0],
                    color: '#42A5F5'
                },{
                    name: 'short',
                    title: 'Short',
                    data: [0,0,0,0,0,0,0],
                    color: '#90CAF9'
                }],
                glycaemias: [0,0,0,0,0,0,0]
            };

            function myLoopJ(j) {
                if(j >= 0) {
                    result.categories[j] = new Date(new Date(config.to).setDate(new Date(config.to).getDate() - j)).getDay();
                    function myLoopI(i) {
                        if(i < entries.length) {
                            if(entries[i].datetimeAcquisition >= new Date(entries[i].datetimeAcquisition).setHours(
                                timeslot.from[0],
                                timeslot.from[1],
                                timeslot.from[2],
                                timeslot.from[3]
                            ) && entries[i].datetimeAcquisition < new Date(entries[i].datetimeAcquisition).setHours(
                                timeslot.to[0],
                                timeslot.to[1],
                                timeslot.to[2],
                                timeslot.to[3]
                            ) && !entries[i].isSkipped){
                                if(entries[i].datetimeAcquisition >= new Date(new Date(config.to).setDate(new Date(config.to).getDate() - j)).setHours(0,0,0,0) && entries[i].datetimeAcquisition < new Date(new Date(config.to).setDate(new Date(config.to).getDate() - j)).setHours(23,59,59,999)){
                                    var value = isNaN(parseInt(entries[i].value)) ? 0 : parseInt(entries[i].value);
                                    switch(entries[i].values[0].type){
                                        case 'short':
                                            result.series[4].data[j] += value;
                                        break;
                                        case 'rapid':
                                            result.series[3].data[j] += value;
                                        break;
                                        case 'mixed':
                                            result.series[2].data[j] += value;
                                        break;
                                        case 'intermediate':
                                            result.series[1].data[j] += value;
                                        break;
                                        case 'long':
                                            result.series[0].data[j] += value;
                                        break;
                                    }
                                    
                                    dbEntry.entryModel.findOne({
                                        userID : patientID,
                                        type : 'glycaemia',
                                        datetimeAcquisition: {
                                            $gt: new Date(new Date(config.to).setDate(new Date(config.to).getDate() - j)).setHours(0,0,0,0), 
                                            $lt: new Date(new Date(config.to).setDate(new Date(config.to).getDate() - j)).setHours(23,59,59,999)
                                        }
                                    }).exec(function(err, entry) {
                                        if (err){
                                            console.log(err);
                                            audit.logEvent('[mongodb]', 'Charts', 'Build insulin', '', '', 'failed',
                                                           'Mongodb attempted to retrieve glycaemia entries');
                                            callback(err);
                                        } else {
                                            if(entry){
                                                result.glycaemias[j] = parseInt(entry.value);
                                            }
                                            myLoopI(i+1);
                                        }
                                    });
                                } else {
                                    myLoopI(i+1);
                                }
                            } else {
                                myLoopI(i+1);
                            }
                        } else {
                            myLoopJ(j-1);
                        }
                    }
                    myLoopI(0);
                } else {
                    callback(null, result);
                }
            }
            myLoopJ(6);
        }
    });
}

// Build a mobility chart
var mobility = function(actorID, patientID, config, callback) {
    dbEntry.entryModel.find({
        userID : patientID,
        type : 'mobility',
        datetimeAcquisition: {
            $gt: new Date(config.from), 
            $lt: new Date(config.to).setHours(23,59,59,999)
        }
    }, {
        'values': 1,
        _id:0
    })
    .sort({"datetimeAcquisition" : 1})
    .exec(function(err, entries) {
        if (err){
            console.log(err);
            audit.logEvent('[mongodb]', 'Charts', 'Build mobility', '', '', 'failed', 'Mongodb attempted to retrieve entries');
            callback(err);
        } else {
            var result = [];
            if(entries.length > 0){
                result = [['Motor vehicule', 0], ['Public transports', 0], ['Bike', 0], ['Walking', 0]];
                for(i=0;i<entries.length;i++){
                    for(j=0;j<entries[i].values.length;j++){
                        if(entries[i].values[j].type === 'motor'){
                            result[0][1] += parseFloat(entries[i].values[j].value);
                        } else if (entries[i].values[j].type === 'public'){
                            result[1][1] += parseFloat(entries[i].values[j].value);
                        } else if (entries[i].values[j].type === 'bike'){
                            result[2][1] += parseFloat(entries[i].values[j].value);
                        } else {
                            result[3][1] += parseFloat(entries[i].values[j].value);
                        }
                    }
                }
                for(i=0;i<result.length;i++){
                    result[i][1] = result[i][1] / entries.length;
                }
            }
            callback(null, result);
        }
    });
}


Date.prototype.getWeekNumber = function(){
    var d = new Date(+this);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
}

function weeksInYear(year) {
    var d = new Date(year, 11, 31);
    var week = getWeekNumber(d)[1];
    return week == 1? getWeekNumber(d.setDate(24))[1] : week;
}

function getDateRangeOfWeek(w, y) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    var ISOweekEnd = new Date();
    if (dow <= 4) {
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
    return ((ISOweekStart.getDate()) + '-' + ((ISOweekEnd.getDate()) + '/' +(ISOweekStart.getMonth()+1)));
}