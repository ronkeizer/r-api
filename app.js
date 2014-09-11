// Example API call:
// curl -i -X POST -d 'n_samp=100' http://localhost:3001/api/i81234/runif

// Libraries
var express          = require('express'),    // server framework
    debug            = require('debug'),
    morgan           = require('morgan'),     // logging
    bodyParser       = require('body-parser'),
    methodOverride   = require('method-override'),
    child_process    = require('child_process'),
    helmet = require('helmet'), // protection against attacks
    _ = require('underscore'),  // nifty library for arrays / objects
    fs = require('fs');         // file system actions

// Define the APIs and .R scripts you want use in the file r_apis.json
var apis = require('./r_apis.json');

// Server (Express >4.0)
var app  = express();
var port = 3001;
app.use(morgan('dev')); 			        // logging
app.use(bodyParser.urlencoded({ extended: true })); 	// pull information from html in POST
// app.use(bodyParser.json());                          // if you want to parse json requests
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

// calling R with arguments
function call_R (req, res, apis) {
    input = req.body;
    if (check_api_key(req.params.apikey)) {
	if (_.has(apis, req.params.script)) {
            var api = apis[req.params.script];
            if (api.available) {
                // check if all reqd arguments were specified
		var reqd_args = true;
                for (i in api.required_arguments) {
		    if (! _.has(input, api.required_arguments[i])) {
			reqd_args = false;
		    }
		}
		if (reqd_args) {
		    cmdline = "Rscript api/" + api.file;
		    if (typeof(input) !== 'undefined') {
			for (var key in input) {
			    cmdline += " "+key+"="+input[key];
			}
		    }
		    run_cmd(cmdline, res);
		} else {
		    res.send({ error: "Error: Not all required arguments were specified in the API call. Required arguments: " + api.required_arguments.join()});
		}
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
    console.log( 'R API server listening on port %d in %s mode', port, app.settings.env );
});
