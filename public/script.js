(function() {

    vis = {}
    vis.init = function() {


    }

    var VEL_INTERFAZ = 600,
        radio = 250,
        radioHours = radio + 12,
        pi = Math.PI,
        demanda,
        consumoMaximo,
        consumoMinimo,
        consumoMedio;

    var canvasWidth = 768,
        canvasHeight = 600;

    var centerX = canvasWidth / 2;
    var centerY = canvasHeight / 2;


    function grados_a_radianes(grados) {

        return 2 * Math.PI / 360 * grados;
    }

    function rd3(maxi, dato, medida) {

        var mx = +maxi;
        // la variable medida es la que marca. 180 es un hemiciclo, 360 es un circulo completo
        var med = (medida) ? medida : 100;
        var resultado = (dato * med) / mx;

        return resultado;
    }

    //SUMA LOS ELEMENTOS DEL ARRAY
    Array.prototype.sum = function() {
        var sum = 0,
            ln = this.length,
            i;

        for (i = 0; i < ln; i++) {
            if (typeof(this[i]) === 'number') {
                sum += this[i];
            }
        }

        return sum;

    }

    function arraySum(arr) {
        var sum = 0,
            ln = arr.length,
            i;

        for (i = 0; i < ln; i++) {
            sum += arr[i];
        }

        return sum;
    }

    function calcArrayPercents(arr) {

        var sum = arraySum(arr),
            parciales = [],
            ln = arr.length,
            i;

        for (i = 0; i < ln; i++) {
            parciales.push((arr[i] * 100) / sum);
        }

        return parciales;
    }



    var es_ES = {
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["€", ""],
        "dateTime": "%a %b %e %X %Y",
        "date": "%d/%m/%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
        "shortDays": ["Dom", "Lun", "Mar", "Mi", "Jue", "Vie", "Sab"],
        "months": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
        "shortMonths": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    };

    var ES = d3.locale(es_ES);

    var iso = d3.time.format.utc("%Y-%m-%dT%H:%M:%S.%LZ");
    var tooltipDateFormat = ES.timeFormat("%A %d, %H:%M");


    var getCanvasCenterX = function() {
        return canvasWidth / 2;
    }
    var getCanvasCenterY = function() {
        return canvasHeight / 2;
    }


    var tablaIdsOrdenados = ['eol', 'hid', 'sol', 'aut', 'gf', 'nuc', 'car', 'cc'];

    var tablaIdsInfo = {
        'eol': {
            'id': 'eol',
            'nombre': 'Eólica',
            'color': '7EAADD',
            'highlightColor': 'c6d1dd',
            'icon': '\\e82b'
        },
        'hid': {
            'id': 'hid',
            'nombre': 'Hidraúlica',
            'color': '33537A',
            'highlightColor': '446fa4',
            'icon': '\\e82d'
        },
        'sol': {
            'id': 'sol',
            'nombre': 'Solar/Solar Térmica',
            'color': 'F5A623',
            'highlightColor': 'f5cc89',
            'icon': '\\e82c'
        },
        'aut': {
            'id': 'aut',
            'nombre': 'Régimen Especial',
            'color': '9B9B9B',
            'highlightColor': 'bdbdbd',
            'icon': '\\e800'
        },
        'gf': {
            'id': 'gf',
            'nombre': 'Gas + Fuel',
            'color': '55361A',
            'highlightColor': 'd18540',
            'icon': '\\e806'
        },
        'nuc': {
            'id': 'nuc',
            'nombre': 'Nuclear',
            'color': 'BD10E0',
            'highlightColor': 'd712ff',
            'icon': '\\e807'
        },
        'car': {
            'id': 'car',
            'nombre': 'Carbón',
            'color': '453535',
            'highlightColor': '795d5d',
            'icon': '\\e805'
        },
        'cc': {
            'nombre': 'Ciclo Combinado',
            'color': '3D4163',
            'highlightColor': '686fa9',
            'icon': '\\e804'
        }
    };

    var tablaEmisiones = {
        "icb": 0,
        "inter": 0,
        "car": 0.95,
        "aut": 0.27,
        "sol": 0,
        "cc": 0.37,
        "hid": 0,
        "gf": 0.7,
        "nuc": 0,
        "eol": 0
    }

    var parametrosUsados = {
        'dem': true,
        'icb': true,
        'inter': true,
        'car': true,
        'aut': true,
        'sol': true,
        'cc': true,
        'hid': true,
        'gf': true,
        'nuc': true,
        'eol': true,
        'ts': true
    };

    var energiasMostradas = {
        'icb': true,
        'inter': true,
        'car': true,
        'aut': true,
        'sol': true,
        'cc': true,
        'hid': true,
        'gf': true,
        'nuc': true,
        'eol': true
    };


    //DIBUJO BASE 



var svg = d3.select("#chart").append('svg')
    .attr('width', canvasWidth)
    .attr('height', canvasHeight)
    //.attr("viewBox", "0 0 "+ canvasWidth +" "+ canvasHeight)
    //.attr("preserveAspectRatio", "xMinYMin meet");

    var defs = svg.append("defs");

    svg.append("symbol")
        .attr("id", "symbol_rayito")
        .attr('viewBox', '0 0 6.88 10.13')
        .append('path')
        .attr("d", "M2.669,6.257 L6.882,0.727 L5.122,0 L0,7.622 L3.843,6.96 L1.723,10.131 L2.26,10.133 L6.533,5.355 L2.669,6.257 z")
        .attr('fill', '#fff');

    svg.append('rect')
        .attr('id', 'bg')
        .attr({
            'x': 0,
            'y': 0,
            'width': canvasWidth,
            'height': canvasHeight,
            'fill': '#2f2f2f'
        });

    svg.append('g').attr('id', 'base');

    svg.append('circle')
        .attr('id', 'circleBG')
        .attr('r', radio)
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('fill', '#222222');


    // CREO LOS HOST PARA LOS 'RADIOS'

    svg.append('g').attr('id', 'horas');

    var hostRads = svg.append('g').attr('id', 'hostRads');

    var groupCircle = svg.append('g').attr('id', 'consumo');
    var consumoCircle = groupCircle.append('circle')
        .attr('r', radio)
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('stroke', '#990000')
        .attr('fill', 'none')
        .attr('stroke-dasharray', 3)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0)

    var groupConsumo = svg.append('g').attr('id', 'consumo-dot');
    var consumoDot = groupConsumo.append('circle')
        .attr('r', 5)
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('stroke', 'none')
        .attr('fill', '#900')
        .attr('fill-opacity', 0);


    var grupoHoras = d3.select("svg #horas")
        .attr('transform', 'translate(' + (centerX) + ',' + (centerY) + ')');

    // PASAR MINUTOS 24*60 
    var horaRotation = d3.scale.linear()
        .domain([0, 24 * 60])
        .range([0, 360]);

    var hoy = new Date();
    var currentHourRotation = horaRotation((60 * hoy.getHours()) + hoy.getMinutes());
    //var currentHourRotation = horaRotation((60 * 15) + 10); // 13:25 horas

    svg.append('circle')
        .attr('id', 'circleHour')
        .attr('r', 3)
        .attr('cx', (centerX) + (radio + 12) * Math.sin(grados_a_radianes(180 + 360 - currentHourRotation)))
        .attr('cy', (centerY) + (radio + 12) * Math.cos(grados_a_radianes(180 + 360 - currentHourRotation)))
        .attr('stroke-width', '2')
        .attr('stroke', '#666')
        .attr('fill', '#666');

    var clockTimer = setInterval(function() {

        var date = new Date(),
            currentHourRotation = horaRotation((60 * date.getHours()) + date.getMinutes()),
            calc = grados_a_radianes(180 + 360 - currentHourRotation);

        //console.log('updated clock', date)

        d3.select('#circleHour').transition()
            .attr('cx', (centerX) + radioHours * Math.sin(calc))
            .attr('cy', (centerY) + radioHours * Math.cos(calc))
            .attr('r', function() {
                var that = d3.select(this);
                return ((that.attr('r') != 3) ? 3 : 1);
            });
    }, 1000);


    // DIBUJO LAS 24 HORAS

    var rotation,
        n,
        lnHoras = 24;

    for (n = 0; n < lnHoras; n++) {
        rotation = 180 - (360 / lnHoras) * n; //24h
        //console.log (rotation)
        grupoHoras.append('text')
            .text(((n > 9) ? n : "0" + n) + ':00')
            .attr('x', (radio + 33) * Math.sin(grados_a_radianes(rotation)))
            .attr('y', (radio + 33) * Math.cos(grados_a_radianes(rotation)) + 7)
            .attr('text-anchor', 'middle')
            .style('font-size', '14')
            .style('font-family', 'Roboto Slab, Helvetica Neue, Helvetica, sans-serif')
            .style('fill', '#666')
    }


    //PINTO EL TOOLTIP
    var tooltipWidth = 120,
        tooltipHeight = 28,
        currentTooltipFormat;

    var tooltip = svg.append('g').attr('id', 'dem-tooltip').attr('opacity', 0);

    var tooltip_shadow = tooltip.append('rect')
        .attr({
            'width': tooltipWidth + 4,
            'height': tooltipHeight + 4,
            'fill': 'black',
            'fill-opacity': .15
        })

    var tooltip_rect = tooltip.append('rect')
        .attr({

            'width': tooltipWidth,
            'height': tooltipHeight
        })


    /*var tooltip_arrow = tooltip.append('path')
        .attr('d', 'M7.532,20.852 L11.744,15.321 L9.984,14.594 L4.863,22.217 L8.706,21.554 L6.586,24.725 L7.123,24.727 L11.395,19.949 L7.532,20.852 z')
        .attr('fill', 'white')*/



    var tooltip_fecha = tooltip.append('text')
        .attr('id', 'fecha')
        .attr('x', 5)
        .attr('y', 11)
        .attr('text-anchor', 'start')
        .style('font-size', '11')
        .style('font-family', 'Roboto Slab, Helvetica Neue, Helvetica, sans-serif')
        .style('fill', 'black')
        .style('fill-opacity', .75);


    var tooltip_mw = tooltip.append('text')
        .text('')
        .attr('x', 15)
        .attr('y', 24)
        .style('font-size', '13')
        .style('font-family', 'Roboto Slab, Helvetica Neue, Helvetica, sans-serif')
        .style('fill', 'white');

    /*var tooltip_arrow = tooltip.append('use')
        .attr('id', 'arrow')
        .attr('x',-3.4 - 5 )
        .attr('y',-5 - 5)
        .attr('width',6.8 )
        .attr('height',10.1 )
        .attr('xlink:href', '#symbol_rayito')
        .attr('fill', 'white')
    */

    var outRadio = 0;

    function setTooltip(name) {


        if (name == 'fmt_0_0') {

            tooltip_shadow.attr({
                'x': -(tooltipWidth + 2),
                'y': -(tooltipHeight + 2)
            });

            tooltip_rect
                .attr({
                    'x': -tooltipWidth,
                    'y': -tooltipHeight

                });

            tooltip_fecha
                .attr({
                    'x': -4,
                    'y': -16,
                    'text-anchor': 'end'
                });

            tooltip_mw
                .attr({
                    'x': -4,
                    'y': -4,
                    'text-anchor': 'end'
                });

            /*                tooltip_arrow
                                .attr({
                                    'x': 0,
                                    'y': 0
                                });*/

        }

        if (name == 'fmt_1_0') {

            tooltip_shadow.attr({

                'x': -2,
                'y': -(tooltipHeight + 2)
            });

            tooltip_rect
                .attr({
                    'x': 0,
                    'y': -tooltipHeight
                });

            tooltip_fecha
                .attr({
                    'x': 5,
                    'y': -16,
                    'text-anchor': 'start'
                });

            tooltip_mw
                .attr({
                    'x': 5,
                    'y': -4,
                    'text-anchor': 'start'
                });

            /*                tooltip_arrow
                                .attr({
                                    'x': 0,
                                    'y': 0
                                });*/
        }
        if (name == 'fmt_1_1') {
            tooltip_shadow.attr({

                'x': -2,
                'y': -2
            });

            tooltip_rect
                .attr({
                    'x': 0,
                    'y': 0
                });

            tooltip_fecha
                .attr({
                    'x': 5,
                    'y': 11,
                    'text-anchor': 'start'
                });

            tooltip_mw
                .attr({
                    'x': 5,
                    'y': 24,
                    'text-anchor': 'start'
                });

            /*                tooltip_arrow
                                .attr({
                                    'x': 0,
                                    'y': 0
                                });*/
        }
        if (name == 'fmt_0_1') {
            tooltip_shadow.attr({
                'x': -(tooltipWidth + 2),
                'y': -2
            });

            tooltip_rect
                .attr({
                    'x': -tooltipWidth,
                    'y': 0
                });

            tooltip_fecha
                .attr({
                    'x': -4,
                    'y': 11,
                    'text-anchor': 'end'
                });

            tooltip_mw
                .attr({
                    'x': -4,
                    'y': 24,
                    'text-anchor': 'end'
                });

            /*                tooltip_arrow
                                .attr({
                                    'x': 0,
                                    'y': 0
                                });*/
        }


    }

    function mousemove(d, i) {

        var coords = d3.mouse(this),
            x = coords[0],
            y = coords[1],
            xs = (centerX) - x,
            ys = (centerY) - y;

        xs = xs * xs;
        ys = ys * ys;

        var sqrt = Math.sqrt(xs + ys)

        if (sqrt > radio) {
            outRadio = 0;
        } else {
            outRadio = 1;
        }
        var p = document.getElementById('chart'),
            offset = {
                'left': p.offsetLeft,
                'top': p.offsetTop
            },
            halfWidth = canvasWidth / 2,
            halfHeight = canvasHeight / 2;


        var xsign = (x > halfWidth) ? 1 : 0,
            ysign = (y > halfHeight) ? 1 : 0;





        var tooltipFmtName = ['fmt_', xsign, '_', ysign].join("");

        if (tooltipFmtName != currentTooltipFormat) {
            setTooltip('fmt_' + xsign + '_' + ysign);
            currentTooltipFormat = tooltipFmtName;
        }


        groupCircle.transition(100).style('opacity', outRadio);
        groupConsumo.transition(100).style('opacity', outRadio);
        tooltip.transition(100).style('opacity', outRadio);

    }

    d3.select('#chart')
        .on('mousemove', mousemove)



    function demFn(d) {
        return +d.dem;
    }

    function idFn(d) {
        return d.id;
    }

    var sizes = d3.scale.linear()
        .range([10, 24]);

    var opacityScale = d3.scale.linear()
        .range([.5, 1]);

    var colorDemand = d3.scale.linear()
        .range(['#996A00', '#990000']);

    // ESTA ESCALA ME PERMITE ESTABLECER EL MÁXIMO Y MÍNIMO CONSUMO EN FUNCIÓN DE LA DEMANDA
    // Y VARIAR EL MÁXIMO PORCENTAJE DE RADIO

    var scaleRadius = d3.scale.linear()
        .range([0, radio]);

    function getData(path) {

        //console.log('get', path)
            //d3.json("datos/demandaGeneracionPeninsula.24.3.2015.json", function(data) {

        d3.json(path, function(data) {

            // LIMPIO LOS DATOS DEL JSON NO UTILIZADOS

            var datosJson = data.map(function(obj) {
                // REMAPEO EL OBJETO PARA ELIMINAR ALGUNOS DATOS NO UTILIZADOS DEL JSON
                var tmpObj = {},
                    key;

                for (key in obj) {

                    if (parametrosUsados[key]) {
                        tmpObj[key] = obj[key];
                    }

                }

                return tmpObj;

            });


            datosJson.reverse();

            var maxDemand = d3.max(datosJson, demFn),
                minDemand = d3.min(datosJson, demFn)

            console.log('min', minDemand, 'max', maxDemand, 'length', datosJson.length);

            // ACTUALIZO DOMAINS SCALES
            sizes.domain([minDemand, maxDemand])
            opacityScale.domain([0, datosJson.length])
            colorDemand.domain([minDemand, maxDemand])

            // ESTA ESCALA ME PERMITE ESTABLECER EL MÁXIMO Y MÍNIMO CONSUMO EN FUNCIÓN DE LA DEMANDA
            // Y VARIAR EL MÁXIMO PORCENTAJE DE RADIO
            scaleRadius.domain([0, maxDemand])


            var now = new Date(),
                currentHourDate = iso.parse(datosJson[datosJson.length - 1].ts),
                currentHourDateRotation = horaRotation((currentHourDate.getHours() * 60) + (currentHourDate.getMinutes())),
                arcoPorcion = 360 / datosJson.length;


            // SELECCIONO LOS RADIOS QUE ALBERGAN CADA UNA DE LAS FRANJAS DE TIEMPO

            var rads = svg.select('#hostRads').selectAll('.rad')
                .data(datosJson, function(d) {
                    return d.ts;
                });

            // ENTER

            rads.enter().append('g')
                .attr('class', 'rad')
                .attr('id', function(d) {
                    var ts = iso.parse(d.ts)
                    return 'id-' + ts.getHours() + ':' + ts.getMinutes() + '-dia-' + (ts.getDate());
                })
                .on('mouseenter', function(d) {
                    var tsDate = iso.parse(d.ts),
                        h = tsDate.getHours(),
                        m = tsDate.getMinutes(),
                        angle = horaRotation((h * 60) + m),
                        offset = 180,
                        a = grados_a_radianes(offset - angle),
                        consumoRadio = scaleRadius(d.dem),
                        sinA = Math.sin(a),
                        cosA = Math.cos(a);

                    consumoDot
                        .attr('cx', centerX + (consumoRadio * sinA))
                        .attr('cy', centerY + (consumoRadio * cosA))
                        .transition(150)
                        .attr('fill', colorDemand(d.dem))
                        .attr('fill-opacity', 1);

                    tooltip
                        .attr('transform', 'translate(' + (centerX + ((consumoRadio + 0) * sinA)) + ',' + (centerY + ((consumoRadio + 0) * cosA)) + ')')
                    tooltip_fecha
                        .text(function() {

                            var tsDate = iso.parse(d.ts);
                            return tooltipDateFormat(tsDate);
                        });

                    tooltip_mw
                        .text(function() {
                            return ES.numberFormat(",.")(d.dem) + "Mwh";
                        });

                    tooltip_rect
                        .transition(150)
                        .attr('fill', colorDemand(d.dem))
                        .attr('fill-opacity', 1);

                    // console.log (this)
                })
                .each(function(d) {
                    //CREO LOS 'HUECOS'
                    var group = d3.select(this),
                        ln = 8,
                        n = 0;

                    group.selectAll('path')
                        .data(tablaIdsOrdenados)
                        .enter().append('path')

                    .on('click', function() {
                            var that = d3.select(this);
                            //console.log("click", iso.parse(d.ts), that.datum().nombre, d[that.datum().id])
                            console.log("click", iso.parse(d.ts), that.datum(), d[that.datum()])
                        })
                        .on('mouseover', function() {
                            var that = d3.select(this),
                                c = consumoCircle
                                .transition()
                                .attr({
                                    'r': function() {
                                        return scaleRadius(d.dem);
                                    },
                                    'stroke': function() {
                                        return colorDemand(d.dem);
                                    },
                                    'stroke-opacity': .9
                                })

                            //console.log(c)


                            that.transition()
                                .attr('fill', '#' + tablaIdsInfo[that.datum()].highlightColor);
                        })
                        .on('mouseout', function() {

                            var that = d3.select(this);
                            d3.select(this).transition()
                                //.attr('fill', '#' + d3.select(this).datum().color);
                                .attr('fill', '#' + tablaIdsInfo[that.datum()].color);
                        })
                        .attr('fill', function(d, n) {
                            var that = d3.select(this)
                            return '#' + tablaIdsInfo[that.datum()].color;
                        })


                    n++;



                })
                .attr('opacity', 0)
                .attr('transform', 'translate(' + centerX + ',' + centerY + ')')

            ;

            // UPDATE

            rads.each(function(d, i) {

                //console.log ('rad',i, this.id);
                paths = d3.select(this).selectAll('path')

                // CALCULAMOS LA SUMA DE LAS DIFERENTES ENERGÍAS PROVEEDORAS
                var generadoras = [d.eol, d.hid, d.sol, d.aut, d.gf, d.nuc, d.car, d.cc];
                // CALCULAMOS LOS PORCENTAJES PARCIALES
                var porcentajesDemanda = calcArrayPercents(generadoras);
                //DEMANDA REAL, ES DECIR POR MEDIO GENERATIVO SUMANDO TODO (PROTOTIPO de ARRAY)
                var demandaHora = generadoras.sum();
                //console.log('demandaHora', demandaHora, porcentajesDemanda)

                var acumuladoInner = 0,
                    grosorGeneradora = 0,
                    ln = porcentajesDemanda.length,
                    n = 0,
                    arc = d3.svg.arc(),
                    tsDate = iso.parse(d.ts),
                    h = tsDate.getHours(),
                    m = tsDate.getMinutes(),
                    angle = horaRotation((h * 60) + m),
                    path;



                paths.each(function() {

                    grosorGeneradora = porcentajesDemanda[n] / 100 * scaleRadius(d.dem);

                    d3.select(this).attr('d', arc.startAngle(function() {
                        return grados_a_radianes(angle);
                    }).endAngle(function() {
                        return grados_a_radianes(angle + arcoPorcion);
                    }).outerRadius(function() {
                        return grosorGeneradora + acumuladoInner;
                    }).innerRadius(function() {
                        return acumuladoInner;
                    }))
                    acumuladoInner += grosorGeneradora;

                    n++;


                })

            });

            rads.transition(500).delay(function(d, i) {
                    return (datosJson.length - i) * 25
                })
                .attr('opacity', function(d, i) {
                    return opacityScale(i);
                })
                .attr('transform', 'translate(' + centerX + ',' + centerY + ')');

            //EXIT
            rads.exit().remove()
                .each(function() {
                    console.log('Bye! exit ', this);
                });


            var energias,
                id;

            //console.log('datosJson', datosJson)
            var dLast = datosJson[datosJson.length - 1];

            // CALCULAMOS LA SUMA DE LAS DIFERENTES ENERGÍAS PROVEEDORAS
            var generadoras = [dLast.eol, dLast.hid, dLast.aut, dLast.gf, dLast.nuc, dLast.car, dLast.cc];
            // CALCULAMOS LOS PORCENTAJES PARCIALES
            var porcentajesDemanda = calcArrayPercents(generadoras);
            //DEMANDA REAL, ES DECIR POR MEDIO GENERATIVO SUMANDO TODO (PROTOTIPO de ARRAY)
            var demandaHora = generadoras.sum();


            //ACTUALIZO HTML


            var energias = d3.select('#energias').selectAll(".energia")
                .data(tablaIdsOrdenados);

            //console.log(energias,'energias')

            energias.each(function(d, i) {

                var datos = tablaIdsInfo[d];

                var that = d3.select(this),
                    id = d //that.datum()//.id
                that.select('.energia__titulo')
                    .text(datos.nombre) //.text(that.datum().nombre)
                    .style('color', datos.color);
                that.selectAll('.energia__subtitulo')
                    .data(['Aportación actual', 'Promedio 24h', 'Emisiones Co2'])
                    .each(function(d) {
                        d3.select(this)
                            .text(function() {
                                return d;
                            })
                    });

                that.select('.j-porcentaje-' + id)
                    .text(function() {
                        return ES.numberFormat(",.2f")(rd3(demandaHora, +dLast[id])) + "%";
                    });
                that.select('.j-valor-' + id).transition()
                    .text(function() {
                        return ES.numberFormat(",.")(dLast[id]) + "MW";
                    });
                that.select('.j-porcentaje-media-' + id)
                    .text(function() {
                        return '--';
                    });
                that.select('.j-co2-' + id)
                    .text(function() {
                        return ES.numberFormat(",.2f")(+dLast[id] * tablaEmisiones[id]) + 'T/h';
                    });

                //document.styleSheets[0].addRule( '#id_'+ id +':before','content: "'+datos.id+'"; color:'+datos.color+';');
                document.styleSheets[0].addRule('#id_' + id + ':before', 'content: "' + datos.icon + '"; color:' + datos.color + ';');


                that.style('opacity', .5)
                    .transition().delay(i * 100)
                    .style('opacity', 1)


            })

            ;


            //console.log ('calls', calls)

            if (calls < 4) {
                calls += 1
            } else {
                calls = 1
            };


        })

    }



    // getData("datos/last24h." + calls + ".json");
    var calls = 1;

    /*d3.select('#updateBtn')
        .on('click', function() {

            getData("datos/last24h." + calls + ".json");

        })*/

    //getData("datos/last24h." + calls + ".json");
    // setInterval( function () { getData( "datos/last24h." + calls + ".json" ); }, 10000);

    setInterval(getData, 1000 * 30, "https://energia-ngpt.rhcloud.com/data/last24h");
    getData("https://energia-ngpt.rhcloud.com/data/last24h");


})()