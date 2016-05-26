import d3 from 'd3';
import topojson from 'topojson';
import * as nav from './navigation';
import * as tooltip from './tooltip';
import * as utils from './utils';

export const PROJECTION_MERCATOR     = 'mercator';
export const PROJECTION_ORTHOGRAPHIC = 'orthographic';

let g, projection, path, currentProjection;

/**
 * Calculate point to draw arrow
 *
 * Given an SVG path, calculates the points attribute
 * value necessary to draw an arrow on the end of the
 * path in the direction where the path is pointing.
 *
 * @param   {SVGPathElement}  p Path to draw an arrow on
 * @returns {String}            Value suitable for 'points' attribute
 */
function arrowPoints(p) {
  let arrowSize   = 4,
      totalLength = p.getTotalLength(),
      startPoint  = p.getPointAtLength(totalLength - arrowSize),
      endPoint    = p.getPointAtLength(totalLength),
      angle       = utils.angleBetweenPoints(startPoint, endPoint),
      p1          = utils.pointOnCircle(endPoint, angle, 0, arrowSize),
      p2          = utils.pointOnCircle(endPoint, angle, 135, arrowSize),
      p3          = utils.pointOnCircle(endPoint, angle, -135, arrowSize);

  return `${p1} ${p2} ${p3}`;
}

/**
 * Function factory for extracting coordinates
 *
 * Creates a function that extracts the specified coordinates
 * from a datum. Used as a helper to prevent clutter.
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
 * Create object for transfer tooltip
 *
 * Create an object that can be passed to tooltip.show
 * Used as a helper to prevent clutter.
 *
 * @param   {Object}  d Datum
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
 * Create object for location tooltip
 *
 * Create an object that can be passed to tooltip.show
 * Used as a helper to prevent clutter.

 * @param   {Object}  geo Geo data
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
 * Redraw countries
 *
 * When the projection changed, the path function is
 * different and this function should be called to
 * redraw the map.
 * Also the arrows and dots marking the source and
 * destinations should be updated.
 */
function refresh() {
  if (!g) { return; }

  // redraw map using updated path function
  g.selectAll('path').attr('d', path);

  // redraw the arrows
  g.selectAll('g.route-group polygon')
    .attr('points', function (d) {
      return arrowPoints(this.previousSibling);
    });

  // redraw the dots
  g.selectAll('g.route-group circle')
    .attr('cx', geoFn('src', 'lon'))
    .attr('cy', geoFn('src', 'lat'));
}

/**
 * Zoom handler
 */
function onZoom() {
  if (d3.event.sourceEvent.ctrlKey) { return; }

  let translate = d3.event.translate.join(','),
      scale     = d3.event.scale;

  g.attr('transform', `translate(${translate}) scale(${scale})`);

  refresh();
}

/**
 * Factory function for drag handler
 *
 * Creates a function
 *
 * @param   {d3.selection}  container
 * @returns {Function}
 */
function onDrag(container) {
  let width  = container.property('clientWidth'),
      height = container.property('clientHeight'),
      λ      = d3.scale.linear().domain([0, width]).range([-180, 180]),
      φ      = d3.scale.linear().domain([0, height]) .range([90, -90]);

  return () => {
    if (PROJECTION_ORTHOGRAPHIC !== currentProjection || !d3.event.sourceEvent.ctrlKey) { return; }

    projection.rotate([λ(d3.event.x), φ(d3.event.y)]);

    refresh();
  };
}

/**
 * Create a mercator projection
 *
 * @returns {d3.geo.projection}
 */
function getMercatorProjection() {
  return d3.geo.mercator()
    .center([0, 25]);
}

/**
 * Create an orthographic projection
 *
 * @returns {d3.geo.projection}
 */
function getOrthographicProjection() {
  return d3.geo.orthographic()
    .scale(280)
    .center([5, 8])
    .clipAngle(90);
}

/**
 * Set the projection
 *
 * @param {String}  projectionName  Name of the projection
 */
export function setProjection(projectionName) {
  if (![PROJECTION_MERCATOR, PROJECTION_ORTHOGRAPHIC].includes(projectionName)) {
    throw RangeError(`Invalid projection ${projectionName}`);
  }

  switch (projectionName) {
    case PROJECTION_ORTHOGRAPHIC:
      projection = getOrthographicProjection();
      break;

    case PROJECTION_MERCATOR:
    default:
      projection = getMercatorProjection();
      break;
  }

  path = d3.geo.path()
    .projection(projection);

  currentProjection = projectionName;

  refresh();
}

/**
 * Update the map
 *
 * Binds data to an svg group using the PID property as key.
 *
 * For each datum, add a path, a circle and a polygon.
 * The path is the 'route' of the transfer. Shows a tooltip with transfer details on mouseover.
 * The circle is the source of the transfer. Show a tooltip with geo details on mouseover.
 * The polygon (arrow) is the destination of the transfer. Show a tooltip with geo details on mouseover.
 *
 * Remove groups with no corresponding data.
 *
 * @param {Array}     data    Domain data
 * @param {Function}  scaleFn Function to style the stroke based on the byte count
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
    });

  // draw polygon (triangle) on the 'to' location
  enter.append('polygon')
    .attr('points', function (d) {
      return arrowPoints(this.previousSibling);
    })
    .on('mouseleave', tooltip.hide)
    .on('mouseenter', (d) => {
      let data = tooltipDataLocation(d.geoDst);
      tooltip.show(data);
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

  // remove the entire group on exit
  rg.exit().remove();
}

/**
 * Draw map
 *
 * Draws a map into the specified container using TopoJSON.
 *
 * @param {d3.selection}  container Element to contain the map
 * @param {Array}         data      TopoJSON
 */
export function init(container, data) {
  let countries = topojson.feature(data, data.objects.countries),
      row, svg, zoom, drag;

  // create div for flexing
  row = container.insert('div');

  // initialize navigation
  nav.init(row);

  // set the map projection
  setProjection(PROJECTION_MERCATOR);

  // insert svg element into the container
  svg = row.insert('svg')
    .attr('id', 'worldmap');

  // append a group to the svg element
  g = svg.append('g');

  // draw countries as path
  g.append('path')
    .datum(countries)
    .attr('d', path);

  // create zoom handler
  zoom = d3.behavior.zoom()
    .on('zoom', onZoom);

  // create drag handler
  drag = d3.behavior.drag()
    .on('drag', onDrag(container));

  // attach zoom and drag handler to svg
  svg
    .call(zoom)
    .call(drag);

  // set/unset helper classes to switch cursor
  svg
    .on('mousedown', function () {
      d3.select(this).classed('mousedown', true);
    })
    .on('mouseup', function () {
      d3.select(this).classed('mousedown', false);
    });
}
