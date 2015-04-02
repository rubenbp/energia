var async = require('async');
var request = require('request');
var moment = require('moment-timezone');

var Energia = require('./energia');

module.exports = function populate(date, callback) {
  var sourceBaseUrl = "https://demanda.ree.es/WSvisionaMovilesPeninsulaRest/resources/demandaGeneracionPeninsula?callback=cb&curva=DEMANDA&fecha=";
  var dataUrl = sourceBaseUrl + date;
  console.log("Guardando datos del día " + date);

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
      valorEnHora.ts = moment.tz(valorEnHora.ts, "Europe/Madrid").toDate();

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