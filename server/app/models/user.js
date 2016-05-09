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

var mongoose        = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var bcrypt          = require('bcrypt');

var SALT_WORK_FACTOR = 10;
var Schema = mongoose.Schema;

// User schema
var User = new Schema({
    email: { type: String, required: true, unique: true },
    activationToken: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    role: { type: String, required: true },
    language: { type: String, required: true, default: 'EN' },
    gender: { type: String, required: false },
    condition: { type: String, required: false },
    homeAddress: { type: String, required: false },
    phone: { type: String, required: false },
    birthdate: { type: Date, required: false },
    preferences: { 
        disabledCards: [{
            name: { type: String, required: false },
            subitems : [{
                name: { type: String, required: false }
            }]
        }],
        app_tips: { type: [String], required: false },
        tips: { type: [String], required: false },
        avatar: { type: String, required: false }
    },
    frequency: {
        counter: { type: String, required: false },
        lastTime: { type: Date, required: false }
    },
    created: { type: Date, default: Date.now }
});

// Apply the uniqueValidator plugin to schema
User.plugin(uniqueValidator);

// Bcrypt middleware on UserSchema
User.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);
            user.password = hash;
            next();
        });
    });
});

//Password verification
User.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(isMatch);
    });
};


//Define Models
var userModel = mongoose.model('User', User);


// Export Models
exports.userModel = userModel;