var application_root = __dirname,
    express = require( 'express' ), 
    child_process = require('child_process'), 
    helmet = require('helmet'),
    _ = require('underscore'),
    fs = require('fs');

var app = express();
var port = 3001;

app.configure(function() {
    app.use(express.bodyParser() );
    app.use(express.methodOverride() );
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(helmet());    // Some security measures
    app.use(helmet.xframe('deny'));
    app.use(helmet.xssFilter());
    app.use(helmet.nosniff());
});

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

// Routing
app.post( '/api/:apikey/:script', function(req, res) {
    input = req.body;
    if (check_api_key(req.params.apikey)) {
        // Create commandline
        cmdline = "Rscript "+req.params.script+".R";
        if (typeof(input) !== 'undefined') {
          for (var key in input) {
            cmdline += " "+key+"="+input[key];
          }
        }
        // and run
        run_cmd(cmdline, res);        
    }
});

// Start server
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});

// Example API calls:
// curl -i -X POST -d 'n_samp=100' http://localhost:3001/api/i81234/runif