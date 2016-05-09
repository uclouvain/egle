/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Benoît Dereck-Tricot
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

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Chat schema
var chatSchema = new Schema({
    participants : [{
        userID: { type: String, required: true },
        readDate: { type: Date, required: true},
        deleteDate: { type: Date, required: true, default: new Date(0)},
        unreadCount: { type: Number, required: false, default: 0},
        archive: { type: Boolean }
    }],
    messages : [{
        userID: { type: String, required: true },
        msg: { type: String, required: true },
        datetime : { type: Date, default: Date.now }
    }],
    calls : [{
        userID: { type: String, required: true },
        creationDatetime : { type: Date, required: true, default: Date.now },
        // beginning of the call, the WebRTC connection has been established between the peers
        startDatetime : { type: Date },
        /* status list :
         *  0 - ringing                     initial state for any new call
         *  1 - calling                     the other user asked to call
         *  2 - refused                     the callee hung up before the end of the ringing period
         *  3 - missed                      there were no action performed during the ringing period
         *  4 - cancelled                   the caller hung up before the end of the ringing period and before any answer from the callee         
         *  5 - error                       the call has been terminated because of an (missing webrtc, locked webrtc, missing micro or webcam, connectivity error, timeouts etc)
         *  6 - terminated by callee        the call has been properly terminated
         *  7 - terminated by caller        the call has been properly terminated
         */
        status : { type: Number, required: true },
        // time elapsed since startDatetime, this field is regularly updated during the call
        duration : { type: Number }
    }],
    // lastCall is a separate field holding only the last call (or current call if active), it is pushed into the calls table above when a new call is issued
    lastCall: {
        userID:             { type: String, required: false },
        creationDatetime :  { type: Date,   required: false },
        startDatetime :     { type: Date,   required: false },
        status :            { type: Number, required: false },
        duration :          { type: Number } 
    },
    lastMessageDate : { type: Date, required: true},
    frequency: {
        counter: { type: String, required: false },
        lastTime: { type: Date, required: false }
    }
});

//Define Models
var chatModel = mongoose.model('Chat', chatSchema);

// Export Models
exports.chatModel = chatModel;