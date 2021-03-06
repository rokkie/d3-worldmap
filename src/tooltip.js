import d3 from 'd3';

export default class Tooltip {

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
  static create (data) {
    return `
      <h3>${data.header}</h3>
      <div class="container">${data.rows.map(Tooltip.createRow).join('')}</div>`;
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
  static createRow (row) {
    return `
      <div class="row">
        <div class="dt">${row.label}</div>
        <div class="dd">${row.value}</div>
      </div>`;
  }

  /**
   * Constructor
   */
  constructor() {
    this._tip = undefined;
  }

  /**
   * Show tooltip
   *
   * @param {Object}  data  Object with a header and rows
   */
  show (data) {
    let html = Tooltip.create(data);

    this.tip
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
  hide () {
    this.tip
      .transition()
      .duration(500)
      .style('opacity', 0);
  }

  /**
   * Get tooltip
   *
   * Gets tooltip. Creates it if it does not exists yet.
   * Reuses that afterwards.
   *
   * @returns {*} Tooltip
   */
  get tip () {
    if (!this._tip) {
      this._tip = d3.select('body')
        .append('div')
        .classed('tooltip', true)
        .style('opacity', 0);
    }

    return this._tip;
  }
}

