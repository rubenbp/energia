#!/bin/env node

var populate = require('./populate');
var moment = require('moment-timezone');

console.log(moment.tz("Europe/Madrid").toDate() + "---------------------------------------------");
console.log("Iniciando tarea CRON de rellenado de datos");

var today = moment().tz("Europe/Madrid").format('YYYY-MM-DD');
console.log("Obteniendo datos de fecha: " + today);

populate(today, function(err) {
  if (err) console.error("Error al obtener o guardar los datos: " + err);
});

console.log("Finalizada tarea CRON");