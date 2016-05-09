/*
 * The copyright in this software is being made available under MIT License 
 * MIT License, included below. This software may be subject to other third 
 * party and contributor rights, including patent rights, and no such rights
 * are granted under this license.
 *
 * Copyright (c) 2014-2016, Universite catholique de Louvain (UCL), Belgium
 * Copyright (c) 2014-2016, Professor Benoit Macq
 * Copyright (c) 2014-2016, Aissa Ghouti
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

var fs              = require('fs');
var express         = require('express');
var methodOverride  = require('method-override');
var bodyParser      = require('body-parser');
var favicon         = require('serve-favicon');
var http            = require('http');
var https           = require('https');
var app             = express();
var nconf           = require('nconf');
nconf.file('config/server.json');

nconf.load(function (err, result) {
    if (err) {
        console.log('Error : could not load the config file');
    } else {
        function setDefault(key, defaultValue) {
            if (typeof nconf.get(key) === 'undefined') {
                nconf.set(key, defaultValue);
                return true;
            }
            else return false;
        }
        var changed = false;

        // provide default configuration values :
        //Logs path
        changed |= setDefault("log:path", "/var/log/egle/");

        //Server
        changed |= setDefault("server:ipAddress", "127.0.0.1");
        changed |= setDefault("server:httpsPort", 3001);
        changed |= setDefault("server:httpPort", 3002);

        //Token
        changed |= setDefault("token:secret", "secret");
        changed |= setDefault("token:expiration", 60);
        
        //MongoDB
        changed |= setDefault("mongo", "mongodb://localhost:27017/egle");

        //Redis
        changed |= setDefault("redis:port", 6379);

        //WebRTC and signaling server authentication
        changed |= setDefault("webrtc:secret", "secret");
        changed |= setDefault("webrtc:expiration", 30);
        changed |= setDefault("webrtc:ringingTime", 30);

        //Mailer
        changed |= setDefault("mailer:host", "");
        changed |= setDefault("mailer:port", 0);
        changed |= setDefault("mailer:auth:user", "");
        changed |= setDefault("mailer:auth:pass", "");
        changed |= setDefault("mailer:sender:name", "");
        changed |= setDefault("mailer:sender:address", "");

        //reCAPTCHA
        changed |= setDefault("reCAPTCHA:secret", "");

        // write the config changes to disk and run the server
        if (changed) {
            nconf.save(function (err) {
                if (err) {
                    console.log("Could not write to the configuration file ("+err+")");
                } else {
                    console.log('The configuration file has been created/updated');
                    main();
                }
            });
        } else {
            main();
        }
    }//if (!err)
});


function main() {
    // this must be called BEFORE require('./app/log/log') and
    // AND                 AFTER  the configuration is completely loaded
    require('./app/databases/mongodb');
    
    //the log system needs the log path to be known, the nconf must be properly setup
    var log   = require('./app/log/log');
    var audit = require('./app/audit-log');
    
    // Audit-log
    audit.addTransport("mongoose", {connectionString: nconf.get('mongo'), debug:false});
    
    // Express 4 config
    app.use(express.static(__dirname + '/public'));
    app.use(favicon(__dirname + '/public/img/favicon.ico'));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    
    // MongoDB
    require('./app/databases/mongodb');

    // Routes
    require('./app/routes')(app);

    // Create and start HTTPS server
    https.createServer({
        key: fs.readFileSync('config/certs/my-root-ca.key.pem').toString(),
        cert: fs.readFileSync('config/certs/my-root-ca.crt.pem').toString(),
        passphrase: ''
    }, app).listen(nconf.get('server').httpsPort);
    
    log.info('Eglé started on port ' + nconf.get('server').httpsPort);
    audit.logEvent('[app]', 'main app', 'Start', 'Port', nconf.get('server').httpsPort, 'succeed', 'Server successfully started.');
    
    // Create a server for HTTP -> HTTPS redirection
    var httpApp = express();
    httpApp.all('*', function (req, res, next) {
        res.redirect(301, 'https://' + req.headers.host + req.url);
    });
    http.createServer(httpApp);
    httpApp.listen(nconf.get('server').httpPort);

    exports = module.exports = app;
}
