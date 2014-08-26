var application_root = __dirname,
    express = require( 'express' ), 
    child_process = require('child_process'), 
    fs = require('fs');

var app = express();

app.configure(function() {
    app.use(express.bodyParser() );
    app.use(express.methodOverride() );
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

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

// routing
app.post( '/api/:apikey/:script', function(req, res) {
    input = req.body;
    cmdline = "Rscript "+req.params.script+".R";
    if (typeof(input) !== 'undefined') {
      for (var key in input) {
        cmdline += " "+key+"="+input[key];
      }
    }
    run_cmd(cmdline, res);        
});

//Start server
var port = 3001;
app.listen( port, function() {
    console.log( 'Express server listening on port %d in %s mode', port, app.settings.env );
});

// Commands, e.g.:
// curl -i -X POST -d 'n_samp=100' http://localhost:3001/api/i81234/runif