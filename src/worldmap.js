import d3 from 'd3';
import topojson from 'topojson';
import Tooltip from './tooltip';
import Navigation from './navigation';
import * as utils from './utils';

export const PROJECTION_MERCATOR     = 'mercator';
export const PROJECTION_ORTHOGRAPHIC = 'orthographic';

export default class Worldmap {

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
  static arrowPoints(p) {
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
   * Create object for transfer tooltip
   *
   * Create an object that can be passed to tooltip.show
   * Used as a helper to prevent clutter.
   *
   * @param   {Object}  d Datum
   * @returns {{header: string, rows: *[]}}
   */
  static tooltipDataTransfer(d) {
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
  static tooltipDataLocation(geo) {
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
   * Create a mercator projection
   *
   * @returns {d3.geo.projection}
   */
  static createMercatorProjection () {
    return d3.geo.mercator()
      .center([0, 25]);
  }

  /**
   * Create an orthographic projection
   *
   * @returns {d3.geo.projection}
   */
  static createOrthographicProjection() {
    return d3.geo.orthographic ()
      .scale(280)
      .center([5, 8])
      .clipAngle(90);
  }

  /**
   * Constructor
   *
   * @param {d3.selection}  container Element to contain the map
   * @param {Array}         data      TopoJSON
   */
  constructor (container, data) {
    // private
    this._ct             = container;
    this._tooltip        = undefined;
    this._path           = undefined;
    this._projection     = undefined;
    this._projectionName = undefined;
    this._projectionMap  = {
      mercator    : Worldmap.createMercatorProjection,
      orthographic: Worldmap.createOrthographicProjection
    };

    let countries = topojson.feature(data, data.objects.countries),
        row, nav, svg, zoom, drag;

    // create div for flexing
    row = this.container.insert('div');
    nav = new Navigation(row, this);

    // set the map projection
    this.projectionName = PROJECTION_MERCATOR;

    // insert svg element into the container
    svg = row.insert('svg')
      .attr('id', 'worldmap');

    // append a group to the svg element
    this._group = svg.append('g');

    // draw countries as path
    this.group.append('path')
      .datum(countries)
      .attr('d', this.path);

    // create zoom handler
    zoom = d3.behavior.zoom()
      .on('zoom', this.onZoom.bind(this));

    // create drag handler
    drag = d3.behavior.drag()
      .on('drag', this.onDrag(this.container));

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
  update (data, scaleFn) {
    let rg, enter;

    // bind data to selection
    rg = this.group.selectAll('g.route-group')
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
      .attr('d', this.path)
      .attr('style', (d) => { return `stroke: ${scaleFn(d.nbytes_size)};`; })
      .on('mouseleave', this.tooltip.hide.bind(this.tooltip))
      .on('mouseenter', (d) => {
        let data = Worldmap.tooltipDataTransfer(d);
        this.tooltip.show(data);
      });

    // draw polygon (triangle) on the 'to' location
    enter.append('polygon')
      .attr('points', function () {
        return Worldmap.arrowPoints(this.previousSibling);
      })
      .on('mouseleave', this.tooltip.hide.bind(this.tooltip))
      .on('mouseenter', (d) => {
        let data = Worldmap.tooltipDataLocation(d.geoDst);
        this.tooltip.show(data);
      });

    // draw a dot on the 'from' location
    enter.append('circle')
      .attr('r', 3)
      .attr('cx', this.geoFn('src', 'lon'))
      .attr('cy', this.geoFn('src', 'lat'))
      .on('mouseleave', this.tooltip.hide)
      .on('mouseenter', (d) => {
        let data = Worldmap.tooltipDataLocation(d.geoSrc);
        this.tooltip.show(data);
      });

    // remove the entire group on exit
    rg.exit().remove();
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
  refresh() {
    if (!this.group) { return; }

    // redraw map using updated path function
    this.group.selectAll('path').attr('d', this.path);

    // redraw the arrows
    this.group.selectAll('g.route-group polygon')
      .attr('points', function () {
        return Worldmap.arrowPoints(this.previousSibling);
      });

    // redraw the dots
    this.group.selectAll('g.route-group circle')
      .attr('cx', this.geoFn('src', 'lon'))
      .attr('cy', this.geoFn('src', 'lat'));
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
  geoFn (direction, orientation) {
    let prop = 'geo' + direction[0].toUpperCase() + direction.slice(1),
        idx  = ['lon', 'lat'].indexOf(orientation);

    return (d) => {
      return this.projection([d[prop].longitude, d[prop].latitude])[idx];
    };
  }

  /**
   * Zoom handler
   */
  onZoom () {
    if (d3.event.sourceEvent.ctrlKey) { return; }

    let translate = d3.event.translate.join(','),
        scale     = d3.event.scale;

    this.group.attr('transform', `translate(${translate}) scale(${scale})`);
    this.refresh();
  }

  /**
   * Factory function for drag handler
   *
   * Creates a function
   *
   * @param   {d3.selection}  container
   * @returns {Function}
   */
  onDrag () {
    let width  = this.container.property('clientWidth'),
        height = this.container.property('clientHeight'),
        λ      = d3.scale.linear().domain([0, width]).range([-180, 180]),
        φ      = d3.scale.linear().domain([0, height]) .range([90, -90]);

    return () => {
      if (PROJECTION_ORTHOGRAPHIC !== this.projectionName || !d3.event.sourceEvent.ctrlKey) { return; }

      this.projection.rotate([λ(d3.event.x), φ(d3.event.y)]);
      this.refresh();
    };
  }

  /**
   * Check if the projection is valid
   *
   * @param   {String}  name
   * @returns {boolean}
   */
  isvalidProjection (name) {
    return Object.keys(this._projectionMap).includes(name);
  }

  /**
   * Get the container
   *
   * @returns {d3.selection}
   */
  get container () {
    return this._ct;
  }

  /**
   * Get the tooltip
   *
   * @returns {Tooltip}
   */
  get tooltip () {
    if (!this._tooltip) {
      this._tooltip = new Tooltip();
    }

    return this._tooltip;
  }

  /**
   * Get the main SVG group
   *
   * @returns {SVGElement}
   */
  get group () {
    return this._group;
  }

  /**
   * Get the SVG path
   *
   * @returns {SVGPathElement}
   */
  get path () {
    return this._path;
  }

  /**
   * Get projection name
   *
   * @returns {String}
   */
  get projectionName () {
    return this._projectionName;
  }

  /**
   * Set projection name
   *
   * @param {String}  name
   */
  set projectionName (name) {
    if (!this.isvalidProjection(name)) {
      throw RangeError(`Invalid projection ${name}`);
    }

    this._projectionName = name;
    this._projection     = this._projectionMap[name]();
    this._path           = d3.geo.path().projection(this._projection);

    this.refresh();
  }

  /**
   * Get the map projection
   *
   * @returns {Function}
   */
  get projection () {
    return this._projection;
  }
}
