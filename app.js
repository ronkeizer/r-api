// Libraries
var application_root = __dirname,
    express = require( 'express' ), // uses >4.0
    morgan         = require('morgan'), // logger
    bodyParser     = require('body-parser'),
    methodOverride = require('method-override'),
    child_process = require('child_process'),
    helmet = require('helmet'),
    _ = require('underscore'),
    fs = require('fs');

// Define the APIs in r_apis.json
var apis = require('./r_apis.json');

// Server (Express 4.0)
var app  = express();
var port = 3001;
app.use(express.static(__dirname + '/public')); 	// set the static files location /public/img will be /img for users
app.use(morgan('dev')); 			        // log every request to the console
app.use(bodyParser()); 					// pull information from html in POST
app.use(methodOverride()); 				// simulate DELETE and PUT
app.use(helmet());                                      // Some security measures
app.use(helmet.xframe('deny'));
app.use(helmet.xssFilter());
app.use(helmet.nosniff());

// implement some kind of apikey check here
function check_api_key (apikey) {
    valid_apikeys = [ apikey ];
    return(_.indexOf(valid_apikeys, apikey) >= 0)
}

// Run on command line
function run_cmd (cmdline, res) {
    var child = child_process.exec (cmdline, { cwd: "R" }, function (error, stdout, stderr) {
      if (/^[\],:{}\s]*$/.test(stdout.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
          res.send(stdout);
      } else {
          res.send({ error: "Invalid JSON object received from script."});
      }
    });
    child.on('error', function (err) {
      res.send({ error: "Error encountered while running script. Please check installation of R."});
    });
};

// Function to call R
call_R = function(req, res, apis) {
    input = req.body;
    if (check_api_key(req.params.apikey)) {
        // Create commandline
	if (_.has(apis, req.params.script)) {
            var api = apis[req.params.script];
            var open = apis[req.params.script].file;
	    if (api.available) {
		cmdline = "Rscript " + api.file;
		if (typeof(input) !== 'undefined') {
		    for (var key in input) {
			cmdline += " "+key+"="+input[key];
		    }
		}
		// and run
		run_cmd(cmdline, res);
	    } else {
	      res.send({ error: "Error: Requested API not available for use at this moment."});
	    }
	} else {
	  res.send({ error: "Error: Requested API not found."});
	}
    }
};

// API accessible from both GET and POST
app.get( '/api/:apikey/:script', function (req,res) { call_R (req, res, apis) } );
app.post( '/api/:apikey/:script', function (req,res) { call_R(req, res, apis) } );

// Start server
app.listen( port, function() {
    console.log( 'API server listening on port %d in %s mode', port, app.settings.env );
});

// Example API call:
// curl -i -X POST -d 'n_samp=100' http://localhost:3001/api/i81234/runif
