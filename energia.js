var mongoose = require('mongoose');

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

module.exports = mongoose.model('energia', EnergiaSchema);