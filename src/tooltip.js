var tip;

function get () {
  if (!tip) {
    tip = d3.select('body').append('div').classed('tooltip', true).style('opacity', 0);
  }
  return tip;
}

/**
 *
 * tooltipRow({
 *  label: 'Foo',
 *  value: 'bar',
 *  fmtFn: x => x
 * });
 *
 * @param   {Object}  row
 * @returns {String}
 */
function createRow (row) {
  return `
  <div class="row">
    <div class="dt">${row.label}</div>
    <div class="dd">${row.fmtFn ? row.fmtFn(row.value) : row.value}</div>
  </div>`;
}

/**
 *
 * tooltip({
 *  header: 'FooBar',
 *  rows  : [{
 *    label: 'Foo',
 *    value: 'bar',
 *    fmtFn: x => x
 *  }]
 * });
 *
 * @param   {Object}  data
 * @returns {String}
 */
function create (data) {
  return `
    <h3>${data.header}</h3>
    <div class="container">${data.rows.map(createRow).join('')}</div>`;
}

/**
 *
 * @param {Object}  data
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
 *
 */
export function hide () {
  get()
    .transition()
    .duration(500)
    .style('opacity', 0);
}
