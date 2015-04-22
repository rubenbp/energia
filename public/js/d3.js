    /*var paragraphs = document.getElementsByTagName("p");
    for (var i = 0; i < paragraphs.length; i++) {
      var paragraph = paragraphs.item(i);
      paragraph.style.setProperty("color", "white", null);
    }*/



     // var body = d3.select("body");
     // var div = body.append("div");
     // div.html("Hello, world!");

     // var p = d3.select("body").selectAll("p")
     //   .data([4, 8, 15, 16, 23, 42])
     //   .text(String);


     // var section = d3.selectAll("section");

     // section.append("div")
     //     .html("First!");

     // section.append("div")
     //     .html("Second.");


    function rd3(maxi, dato, medida) {

        var mx = Number(maxi);
        // la variable medida es la que marca. 180 es un hemiciclo, 360 es un circulo completo
        var med = (medida) ? medida : 100;
        var resultado = (dato * med) / mx;

        return resultado;

    }

    function sumaArray(array) {
        var suma_temp = 0;
        for (i = 0; i < array.length; i++) {
            if (!isNaN(array[i])) {
                suma_temp += array[i];
            }
        }
        return suma_temp;
    }

    var data = [10, 8, 15, 16, 23, 75];
    var wi = 500;

     //console.log (sumaArray(data));
     //console.log("wi: " + wi);

    var x = d3.scale.linear()
        .domain([0, d3.max(data)])
        .range([0, wi]);

    function test (){
      console.log("test");

      d3.select(".chart")
          .selectAll("div")
          .data(data)
          .enter().append("div")
          .style("width", function(d) {return x(d) + "px";   })
          .text(function(d) {
              return d + " : " + (Math.floor(rd3(sumaArray(data), d)) + "%");
          });
     //.style("opacity", function(d) { return Math.floor ( rd3 (d3.max(data), d ))*.01 + .10})
   }

    //window.setTimeout(function (){d3.data =[50,15,16,23,50,8];test(); }, 5)

test()

