import d3 from 'd3';
import topojson from 'topojson';
import * as tooltip from './tooltip';
import * as utils from './utils';

const MAP_WIDTH  = 960;
const MAP_HEIGHT = 600;

let g, projection, path;

/**
 *
 * @param   {String}  direction   src|dst
 * @param   {String}  orientation lon|lat
 * @returns {Function}
 */
function geoFn (direction, orientation) {
  let prop = 'geo' + direction[0].toUpperCase() + direction.slice(1),
      idx  = ['lon', 'lat'].indexOf(orientation);

  return function (d) {
    return projection([d[prop].longitude, d[prop].latitude])[idx];
  };
}

/**
 *
 * @param   {Object}  d
 * @returns {{header: string, rows: *[]}}
 */
function tooltipDataTransfer(d) {
  let tsStart = Date.parse(d.start_timestamp),
      tsEnd   = Date.parse(d.end_timestamp),
      dtStart = new Date(tsStart),
      dtEnd   = new Date(tsEnd);

  return {
    header: 'Transfer',
    rows  : [{
      label: 'DateTime Start',
      value: utils.dateFormat(dtStart)
    }, {
      label: 'DateTime End',
      value: utils.dateFormat(dtEnd)
    }, {
      label: 'Duration',
      value: utils.elapsed(tsStart, tsEnd)
    }, {
      label: 'Size',
      value: utils.humanFileSize(d.nbytes_size)
    }, {
      label: 'Avg. Speed',
      value: utils.speed(d.nbytes_size, tsEnd - tsStart)
    }]
  };
}

/**
 *
 * @param   {Object}  geo
 * @returns {{header: *, rows: *[]}}
 */
function tooltipDataLocation(geo) {
  return {
    header: geo.ip_address,
    rows  : [{
      label: 'Hostname',
      value: geo.hostname
    }, {
      label: 'Organization',
      value: geo.organization
    }, {
      label: 'Region',
      value: geo.region
    }]
  };
}

/**
 *
 * @param {Array}     data
 * @param {Function}  scaleFn
 */
export function update(data, scaleFn) {
  let rg, enter;

  // bind data to selection
  rg = g.selectAll('g.route-group')
    .data(data, (d) => { return d.PID; });

  // create a group for each route that so it can be removed as a whole
  enter = rg.enter().append('g')
    .classed('route-group', true);

  // append the path to the group
  enter.append('path')
    .classed('route', true)
    .datum((d) => {
      d.type = 'LineString';
      d.coordinates = [
        [d.geoSrc.longitude, d.geoSrc.latitude],
        [d.geoDst.longitude, d.geoDst.latitude]
      ];

      return d;
    })
    .attr('d', path)
    .attr('style', (d) => { return `stroke: ${scaleFn(d.nbytes_size)};`; })
    .on('mouseleave', tooltip.hide)
    .on('mouseenter', (d) => {
      let data = tooltipDataTransfer(d);
      tooltip.show(data);
    })

    // each because we need a reference to the path
    .each(function (d) {
      d3.select(this.parentElement)
        .append('polygon')
        .attr('points', function (p, d) {
          let arrowSize   = 4,
              totalLength = p.getTotalLength(),
              startPoint  = p.getPointAtLength(totalLength - arrowSize),
              endPoint    = p.getPointAtLength(totalLength),
              angle       = utils.angleBetweenPoints(startPoint, endPoint),
              p1          = utils.pointOnCircle(endPoint, angle, 0, arrowSize),
              p2          = utils.pointOnCircle(endPoint, angle, 135, arrowSize),
              p3          = utils.pointOnCircle(endPoint, angle, -135, arrowSize);

          return `${p1} ${p2} ${p3}`;
        }.bind(undefined, this))
        .on('mouseleave', tooltip.hide)
        .on('mouseenter', () => {
          let data = tooltipDataLocation(d.geoDst);
          tooltip.show(data);
        });
    });

  // draw a dot on the 'from' location
  enter.append('circle')
    .attr('r', 3)
    .attr('cx', geoFn('src', 'lon'))
    .attr('cy', geoFn('src', 'lat'))
    .on('mouseleave', tooltip.hide)
    .on('mouseenter', (d) => {
      let data = tooltipDataLocation(d.geoSrc);
      tooltip.show(data);
    });

  rg.exit().remove();
}

/**
 *
 * @param {d3.selection}  container D3 single element selection
 * @param {Array}         data      TopoJSON
 */
export function draw(container, data) {
  let countries = topojson.feature(data, data.objects.countries),
      svg, zoom;

  // create a map projection
  projection = d3.geo.mercator()
    .center([0, 25]);

  // create path
  path = d3.geo.path()
    .projection(projection);

  // create zoom handler
  zoom = d3.behavior.zoom()
    .on('zoom', () => {
      let tr    = d3.event.translate.join(','),
          scale = d3.event.scale;

      g.attr('transform', `translate(${tr}) scale(${scale})`);
      g.selectAll('path')
        .attr('d', path);
    });

  // insert svg element into the container
  svg = container.insert('svg')
    .attr('id', 'worldmap')
    .attr('width', MAP_WIDTH)
    .attr('height', MAP_HEIGHT)
    .call(zoom);  // attach zoom handler to svg

  // append a group to the svg element
  g = svg.append('g');

  // draw countries as path
  g.append('path')
    .datum(countries)
    .attr('id', 'worldmap')
    .attr('d', path);
}
