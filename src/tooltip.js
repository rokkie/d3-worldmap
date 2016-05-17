import d3 from 'd3';

let tip;

/**
 * Get tooltip
 *
 * Gets tooltip. Creates it if it does not exists yet.
 * Reuses that afterwards.
 *
 * @returns {*} Tooltip
 */
function get () {
  if (!tip) {
    tip = d3.select('body')
      .append('div')
      .classed('tooltip', true)
      .style('opacity', 0);
  }

  return tip;
}

/**
 * Create a tooltip row
 *
 * createRow({
 *  label: 'Foo',
 *  value: 'bar'
 * });
 *
 * @param   {Object}  row Object with a label and value
 * @returns {String}      HTML for a row
 */
function createRow (row) {
  return `
  <div class="row">
    <div class="dt">${row.label}</div>
    <div class="dd">${row.fmtFn ? row.fmtFn(row.value) : row.value}</div>
  </div>`;
}

/**
 * Create a tooltip
 *
 * create({
 *  header: 'FooBar',
 *  rows  : [{
 *    label: 'Foo',
 *    value: 'bar'
 *  }]
 * });
 *
 * @param   {Object}  data  Object with a header and rows
 * @returns {String}        HTML for a tooltip
 */
function create (data) {
  return `
    <h3>${data.header}</h3>
    <div class="container">${data.rows.map(createRow).join('')}</div>`;
}

/**
 * Show tooltip
 *
 * @param {Object}  data  Object with a header and rows
 */
export function show (data) {
  let html = create(data);

  get()
    .html(html)
    .style('left', (d3.event.pageX) + 'px')
    .style('top',  (d3.event.pageY) + 'px')
    .transition()
    .duration(200)
    .style('opacity', 0.9);
}

/**
 * Hide tooltip
 */
export function hide () {
  get()
    .transition()
    .duration(500)
    .style('opacity', 0);
}
