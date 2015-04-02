#!/bin/env node

var mongoose = require('mongoose');
var populate = require('./populate');
var moment = require('moment-timezone');
var mongoUrl  = (process.env.OPENSHIFT_MONGODB_DB_URL || "mongodb://localhost:27017/") + "energia";


console.log(moment.tz("Europe/Madrid").format() + "---------------------------------------------");
console.log("Iniciando tarea CRON de rellenado de datos");

var today = moment().tz("Europe/Madrid").format('YYYY-MM-DD');
console.log("Obteniendo datos de fecha: " + today);


mongoose.connect(mongoUrl, function(err) {
  if (err) {
    console.error('Could not connect to MongoDB!');
    console.log(err);
    return;
  } 

  populate(today, function(err) {
    if (err) console.error("Error al obtener o guardar los datos: " + err);
    console.log("Finalizada tarea CRON");
    process.exit();
  });
});