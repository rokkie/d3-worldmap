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

  var pWorldMap = new Promise(function (resolve, reject) {
    d3.json('var/world-map.json', function (err, data) {
      if (err) { reject(err); }
      resolve(data);
    });
  });

  var pTraffic = new Promise(function (resolve, reject) {
    d3.csv('var/traffic.csv', function (err, data) {
      if (err) { reject(err); }
      resolve(data);
    });
  });

  Promise.all([pWorldMap, pTraffic]).then(function (data) {
    var countries = topojson.feature(data[0], data[0].objects.countries);

    g.append('path')
      .datum(countries)
      .attr('d', path);

    g.selectAll('line')
      .data(data[1])
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
