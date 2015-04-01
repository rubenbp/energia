#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var mongoose = require('mongoose');
var request = require('request');
var moment = require('moment');
var async = require('async');

var EnergiaSchema = mongoose.Schema({
  ts: Date,
  dem: Number,
  nuc: Number,
  gf: Number,
  car: Number,
  cc: Number,
  hid: Number,
  eol: Number,
  aut: Number,
  inter: Number,
  icb: Number,
  sol: Number
});

var Energia = mongoose.model('energia', EnergiaSchema);

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

    self.app.get('/populate/:date', function(req, res) {
      populateRequest(req.params.date, req, res);
    });

    self.app.get('/populate/', function(req, res) {
      var today = moment().format('YYYY-MM-DD');
      console.log("Obteniendo datos de fecha: " + today);

      populateRequest(today, req, res);
    });

    self.app.get('/populate/year/:year', function(req, res) {
      console.log("Petición para obtener datos del año " + req.params.year);

      var currentDay = moment(req.params.year);
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
      var currentDay = moment(req.params.year + "-" + req.params.month).startOf('month');

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
      var desde = moment().subtract(24, 'hours');
      var hasta = moment();

      Energia
        .where('ts').gte(desde).lte(hasta)
        .sort({ ts: 'desc' })
        .exec(function(err, data) {
          res.send(data);
        });
    });

    self.app.get('/data/:desde/:hasta', function(req, res) {
      var desde = moment.utc(req.params.desde).startOf('day');
      var hasta = moment.utc(req.params.hasta).endOf('day');
      Energia
        .where('ts').gte(desde.toDate()).lte(hasta.toDate())
        .sort({ ts: 'desc' })
        .exec(function(err, data) {
          res.send(data);
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

  function populate(date, callback) {
    var sourceBaseUrl = "https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=cb&curva=DEMANDA&fecha=";
    var dataUrl = sourceBaseUrl + date;
    console.log("Guardando datos de " + dataUrl);

    request(dataUrl, function(error, response, body) {
      if (error || response.statusCode != 200) {
        res.send({ error: error, response: response, body: body });
        return;
      }
      if (body == "formato de fecha invalido") {
        console.log('No hay datos aún para el día ' + date);
        return callback();
      }
      var dataRaw = body.substring(3, body.length - 2);
      var data = JSON.parse(dataRaw);

      async.forEach(data.valoresHorariosGeneracion, function(valorEnHora, callback) {
        valorEnHora.ts = moment.utc(valorEnHora.ts).toDate();

        Energia.findOneAndUpdate(
          { ts: valorEnHora.ts },
          valorEnHora,
          { upsert: true }, 
          function(err) {
            if (err) callback(err);
            callback();
          });
      }, function(err) {
        if (err) return callback(err); 
        return callback();
      });

    });
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


