#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');

var moment = require('moment-timezone');
var async = require('async');
var cors = require('cors');

var Energia = require('./energia');
var populate = require('./populate');

/**
 *  Define the sample application.
 */
var SampleApp = function() {

  //  Scope.
  var self = this;


  /*  ================================================================  */
  /*  Helper functions.                                                 */
  /*  ================================================================  */

  /**
   *  Set up server IP address and port # using env variables/defaults.
   */
  self.setupVariables = function() {
    //  Set the environment variables we need.
    self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
    self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
    self.mongoUrl  = (process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://localhost:27017/") + "energia";

    if (typeof self.ipaddress === "undefined") {
      //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
      //  allows us to run/test the app locally.
      console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
      self.ipaddress = "127.0.0.1";
    };
  };

  /**
   *  terminator === the termination handler
   *  Terminate server on receipt of the specified signal.
   *  @param {string} sig  Signal to terminate on.
   */
  self.terminator = function(sig){
    if (typeof sig === "string") {
       console.log('%s: Received %s - terminating sample app ...',
             Date(Date.now()), sig);
       process.exit(1);
    }
    console.log('%s: Node server stopped.', Date(Date.now()) );
  };


  /**
   *  Setup termination handlers (for exit and a list of signals).
   */
  self.setupTerminationHandlers = function(){
    //  Process on exit and signals.
    process.on('exit', function() { self.terminator(); });

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
     'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function(element, index, array) {
      process.on(element, function() { self.terminator(element); });
    });
  };

  self.setupMongoose = function(callback) {
    self.db = mongoose.connect(self.mongoUrl, function(err) {
      if (err) {
        console.error('Could not connect to MongoDB!');
        console.log(err);
        callback(err);
      } else {
        callback(null);
      }

    });
  }

  /**
   *  Initialize the server (express) and create the routes and register
   *  the handlers.
   */
  self.initializeServer = function() {
    self.app = express();

    self.app.use(cors());

    self.app.use(express.static('public'));

    self.app.get('/populate/:date', function(req, res) {
      populateRequest(req.params.date, req, res);
    });

    self.app.get('/populate/', function(req, res) {
      var today = moment().tz("Europe/Madrid").format('YYYY-MM-DD');
      console.log("Obteniendo datos de fecha: " + today);

      populateRequest(today, req, res);
    });

    self.app.get('/populate/year/:year', function(req, res) {
      console.log("Petición para obtener datos del año " + req.params.year);

      var currentDay = moment.tz(req.params.year, "Europe/Madrid");
      console.log("Primer día: " + currentDay.toDate());

      res.set('Content-Type', 'text/html');

      async.until(
        function() { return currentDay.year().toString() != req.params.year; },
        function(callback) {
          populate(currentDay.format('YYYY-MM-DD'), function(err) {
            if (err) return callback(err);

            res.write('<div>Guardados datos del día: ' + currentDay.format('YYYY-MM-DD') + '</div>');

            currentDay = currentDay.add(1, 'days');
            callback();
          });
        },
        function(err) {
          if (err) {
            res.write('<div>ERROR: ' + JSON.stringify(err));
          }
          res.end();
        });
    });

    self.app.get('/populate/month/:year/:month', function(req, res) {
      var currentDay = moment.tz(req.params.year + "-" + req.params.month, "Europe/Madrid");

      res.set('Content-Type', 'text/html');

      async.until(
        function() { return (currentDay.month() + 1).toString() != req.params.month; },
        function(callback) {
          populate(currentDay.format('YYYY-MM-DD'), function(err) {
            if (err) return callback(err);

            res.write('<div>Guardados datos del día: ' + currentDay.format('YYYY-MM-DD') + '</div>');

            currentDay = currentDay.add(1, 'days');
            callback();
          });
        },
        function(err) {
          if (err) {
            res.write('<div>ERROR: ' + JSON.stringify(err));
          }
          res.end();
        });
    });

    self.app.get('/data/last24h', function(req, res) {
      var desde = moment().tz("Europe/Madrid").subtract(24, 'hours');
      var hasta = moment().tz("Europe/Madrid");

      console.log("desde: " + desde.toDate());
      console.log("hasta: " + hasta.toDate());

      Energia
        .find({})
        //.where('ts').gte(desde.toDate()).lte(hasta.toDate())
        .sort({ ts: 'desc' })
        .limit(144)
        .exec(function(err, data) {
          res.json(data);
        });
    });

    self.app.get('/data/:desde/:hasta', function(req, res) {
      var desde = moment.tz(req.params.desde, "Europe/Madrid").startOf('day');
      var hasta = moment.tz(req.params.hasta, "Europe/Madrid").endOf('day');

      console.log("desde: " + desde.toDate());
      console.log("hasta: " + hasta.toDate());

      Energia
        .where('ts').gte(desde.toDate()).lte(hasta.toDate())
        .sort({ ts: 'desc' })
        .exec(function(err, data) {
          res.json(data);
        });
    });
  };

  function populateRequest(date, req, res) {
    populate(date, function(err) {
      if (err) {
        res.send({ status: error, error: err });
        return;
      }
      res.send({ status: "success"});
    })
  }

    /**
   *  Initializes the sample application.
   */
  self.initialize = function(callback) {
    self.setupVariables();
    self.setupTerminationHandlers();
    self.setupMongoose(function() {
      // Create the express server and routes.
      self.initializeServer();    
      callback();
    });
  };


  /**
   *  Start the server (starts up the sample application).
   */
  self.start = function() {
    //  Start the app on the specific interface (and port).
    self.app.listen(self.port, self.ipaddress, function() {
      console.log('%s: Node server started on %s:%d ...',
            Date(Date.now() ), self.ipaddress, self.port);
    });
  };

};   /*  Sample Application.  */

/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize(function() {
  zapp.start();    
});


