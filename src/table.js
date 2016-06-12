import d3 from 'd3';

export default class Table {
  /**
   * Constructor
   *
   * @param {d3.selection}  container
   * @param {Array}         [data]
   */
  constructor (container, data = null) {
    this._tbl   = container.append('table');
    this._thead = this.tbl.insert('thead').insert('tr');
    this._tbody = this.tbl.insert('tbody');
    this._data  = undefined;

    if (data) {
      this.data = data;
    }
  }

  /**
   *
   * @returns {d3.selection}
   */
  get tbl () {
    return this._tbl;
  }

  /**
   *
   * @returns {d3.selection}
   */
  get thead () {
    return this._thead;
  }

  /**
   *
   * @returns {d3.selection}
   */
  get tbody () {
    return this._tbody;
  }

  /**
   *
   * @returns {Array}
   */
  get data () {
    return this._data;
  }

  /**
   *
   * @param {Array} data
   */
  set data(data) {
    let th, tr, td;

    // header
    th = this.thead.selectAll('th')
      .data(d3.keys(data[0]));
    th.enter().append('th')
      .text((d) => { return d; });
    th.exit().remove();

    // rows
    tr = this.tbody.selectAll('tr')
      .data(data);
    tr.enter().append('tr');
    tr.exit().remove();

    // cells
    td = tr.selectAll('td')
      .data((d) => { return d3.values(d); });
    td.enter().append('td')
      .text((d) => { return d; });
    td.exit().remove();
  }
}
