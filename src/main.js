document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var width  = 960,
      height = 600,
      svg, def, g, projection, path, zoom;

  svg = d3.select('body').append('svg')
    .attr('id', 'worldmap')
    .attr('width', width)
    .attr('height', height);
  
  def = svg.append('defs');

  def.append('marker')
    .attr('id', 'arrow-head')
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('refX', 0)
    .attr('refY', 2)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,0 L0,4 L4,2 L0,0')
    .style({fill: '#000000'});

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
    d3.json('http://localhost:9090/transfers', function (err, data) {
      if (err) { reject(err); }
      resolve(data);
    });
  });

  Promise.all([pWorldMap, pTraffic]).then(function (data) {
    var countries   = topojson.feature(data[0], data[0].objects.countries),
        max         = d3.max(data[1], function (d) { return parseInt(d.nbytes_size, 10); }),
        scale       = d3.scale.linear().domain([0, max]).range(['green', 'red']),
        loadingAnim = d3.select('svg#loading-anim'),
        tooltipLoc  = d3.select('body').append('div') .attr('class', 'tooltip') .style('opacity', 0),
        tooltipTra  = d3.select('body').append('div') .attr('class', 'tooltip') .style('opacity', 0),
        geoFn       = function (dir, or) {
          var prop = 'geo' + dir[0].toUpperCase() + dir.slice(1),
              idx  = ['lon', 'lat'].indexOf(or);
          return function (d) {
            return projection([d[prop].longitude, d[prop].latitude])[idx];
          };
        },
        dateFormat = function (d) {
          return d.toLocaleTimeString(navigator.language || 'en-US', {
            year        : 'numeric',
            month       : 'short',
            day         : '2-digit',
            hour        : '2-digit',
            minute      : '2-digit',
            second      : '2-digit',
            weekday     : 'short',
            timeZone    : 'UTC',
            timeZoneName: 'short'
          });
        },
        elapsed = function (start, end) {
          var elapsed  = end - start,
              millis   = (elapsed % 1000),
              seconds  = Math.floor(elapsed / 1000),
              minutes  = Math.floor(elapsed / 1000 / 60),
              hours    = Math.floor(elapsed / 1000 / 60 / 60);

          return `Operation took: ${millis} milliseconds, ${seconds} seconds, ${minutes} minutes, ${hours} hours`;
        },
        humanFileSize = function (bytes) {
          var i = Math.floor(Math.log(bytes) / Math.log(1024));
          return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'][i];
        },
        speed = function (bytes, duration) {
          var bps  = bytes / (duration / 1000),
              size = humanFileSize(bps);

          return `${size} / s`;
        },
        tooltipLocHtml = function (geo) {
          return [
            '<h3>', geo.ip_address, '</h3>',
            '<div class="container">',
              '<div class="row">',
                '<div class="dt">Hostname</div>',
                '<div class="dd">', geo.hostname, '</div>',
              '</div>',
              '<div class="row">',
                '<div class="dt">Organization</div>',
                '<div class="dd">', geo.organization, '</div>',
              '</div>',
              '<div class="row">',
                '<div class="dt">Region</div>',
                '<div class="dd">', geo.region, '</div>',
              '</div>',
            '</div>'
          ].join('');
        },
        tooltipTraHtml = function (d) {
          return [
            '<div class="container">',
              '<div class="row">',
                '<div class="dt">DateTime Start</div>',
                '<div class="dd">', dateFormat(new Date(Date.parse(d.start_timestamp))), '</div>',
              '</div>',
              '<div class="row">',
                '<div class="dt">DateTime End</div>',
                '<div class="dd">', dateFormat(new Date(Date.parse(d.end_timestamp))), '</div>',
              '</div>',
              '<div class="row">',
                '<div class="dt">Duration</div>',
                '<div class="dd">', elapsed(Date.parse(d.start_timestamp), Date.parse(d.end_timestamp)), '</div>',
              '</div>',
              '<div class="row">',
                '<div class="dt">Size</div>',
                '<div class="dd">', humanFileSize(d.nbytes_size), '</div>',
              '</div>',
              '<div class="row">',
                '<div class="dt">Avg. Speed</div>',
                '<div class="dd">', speed(d.nbytes_size, Date.parse(d.end_timestamp) - Date.parse(d.start_timestamp)), '</div>',
              '</div>',
            '</div>'
          ].join('');
        };

    g.append('path')
      .datum(countries)
      .attr('id', 'worldmap')
      .attr('d', path);

    g.selectAll()
        .data(data[1])
      .enter()
        .append('path')
        .datum(function (d) {
          d.type = 'LineString';
          d.coordinates = [
            [d.geoSrc.longitude, d.geoSrc.latitude],
            [d.geoDst.longitude, d.geoDst.latitude]
          ];

          return d;
        })
        .classed('route', true)
        .attr('d', path)
        .attr('style', function (d) { return 'stroke: ' + scale(d.nbytes_size) + '; marker-end: url(#arrow-head)'; })
        .on('mouseenter', function (d) {
          tooltipTra.transition()
            .duration(200)
            .style('opacity', 0.9);
          tooltipTra.html(tooltipTraHtml(d))
            .style('left', (d3.event.pageX) + 'px')
            .style('top',  (d3.event.pageY) + 'px');
        })
        .on('mouseleave', function (d) {
          tooltipTra.transition()
            .duration(500)
            .style('opacity', 0);
        });

    // g.selectAll('dot')
    //     .data(data[1])
    //   .enter()
    //     .append('circle')
    //     .attr('r', 3)
    //     .attr('cx', geoFn('src', 'lon'))
    //     .attr('cy', geoFn('src', 'lat'))
    //     .on('mouseenter', function (d) {
    //       tooltipLoc.transition()
    //         .duration(200)
    //         .style('opacity', 0.9);
    //       tooltipLoc.html(tooltipLocHtml(d.geoDst))
    //         .style('left', (d3.event.pageX) + 'px')
    //         .style('top',  (d3.event.pageY) + 'px');
    //     })
    //     .on('mouseleave', function (d) {
    //       tooltipLoc.transition()
    //         .duration(500)
    //         .style('opacity', 0);
    //     });

    // g.selectAll('dot')
    //     .data(data[1])
    //   .enter()
    //     .append('circle')
    //     .attr('r', 3)
    //     .attr('cx', geoFn('dst', 'lon'))
    //     .attr('cy', geoFn('dst', 'lat'))
    //     .on('mouseenter', function (d) {
    //       tooltipLoc.transition()
    //         .duration(200)
    //         .style('opacity', 0.9);
    //       tooltipLoc.html(tooltipLocHtml(d.geoDst))
    //         .style('left', (d3.event.pageX) + 'px')
    //         .style('top',  (d3.event.pageY) + 'px');
    //     })
    //     .on('mouseleave', function (d) {
    //       tooltipLoc.transition()
    //         .duration(500)
    //         .style('opacity', 0);
    //     });

    loadingAnim.style('display', 'none');
  });
});
