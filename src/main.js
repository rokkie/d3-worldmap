document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var width  = 960,
      height = 600,
      svg, g, projection, path, zoom;

  svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

  g = svg.append('g');

  projection = d3.geo.mercator()
    .center([0, 25])
    .scale(150);

  path = d3.geo.path()
    .projection(projection);

  zoom = d3.behavior.zoom()
    .on('zoom', function () {
      var tr    = d3.event.translate.join(','),
          scale = d3.event.scale;

      g.attr('transform', 'translate(' + tr + ') scale(' + scale + ')');
      g.selectAll('path')
        .attr('d', path);
    });
  svg.call(zoom);

  d3.json('var/world-map.json', function (error, data) {
    if (error) { throw error; }

    var countries = topojson.feature(data, data.objects.countries);

    g.append('path')
      .datum(countries)
      .attr('d', path);
  });

  d3.csv('var/traffic.csv', function (error, data) {
    if (error) { throw error; }

    g.selectAll('line')
      .data(data)
      .enter()
      .append('line')
      .attr('x1', function (d) {
        return projection([d.from_lon, d.from_lat])[0];
      })
      .attr('y1', function (d) {
        return projection([d.from_lon, d.from_lat])[1];
      })
      .attr('x2', function (d) {
        return projection([d.to_lon, d.to_lat])[0];
      })
      .attr('y2', function (d) {
        return projection([d.to_lon, d.to_lat])[1];
      })
      .attr('style', function (d) {
        return 'stroke: rgb(255,0,0); stroke-width: ' + d.bytes_count / 100000;
      });
  });
});
