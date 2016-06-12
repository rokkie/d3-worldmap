import Table from './table';

const TXT_HEADER = 'Top Destinations';

export default class TopDst {

  /**
   * Count occurrences of destination
   *
   * @param   {Array}   data  Data to count destinations of
   * @returns {Object}        Data augmented with 'count'
   */
  static countDestinations(data) {
    return data.reduce((acc, cur) => {
      let dst = cur.geoDst,
          ext = acc.find((el) => {
            return (
              dst.ip_address === el.ip_address ||
              (dst.longitude === el.longitude && dst.latitude === el.latitude)
            );
          });

      if (undefined === ext) {
        dst.count = 1;
        acc.push(dst);
      } else {
        ext.count++;
      }

      return acc;
    }, []);
  }

  /**
   * Constructor
   *
   * @param {d3.selection}  container
   * @param {Array}         [data]
   */
  constructor (container, data = null) {
    this._data = undefined;

    this._grid = container
      .append('div')
      .classed('datagrid', true);

    this._table = new Table(this.grid);

    container.insert('h3', '.datagrid').text(TXT_HEADER);

    if (data) {
      this.data = data;
    }
  }

  /**
   * Get the grid
   *
   * @returns {d3.selection}
   */
  get grid () {
    return this._grid;
  }

  /**
   * Get the table
   *
   * @returns {Table}
   */
  get table () {
    return this._table;
  }

  /**
   * Get the data
   *
   * @returns {Array}
   */
  get data () {
    return this._data;
  }

  /**
   * Set the data
   *
   * @param {Array}  data
   */
  set data (data) {
    this.table.data = TopDst.countDestinations(data)
      .sort((a, b) => { return a.count < b.count; })
      .slice(0, 5);
  }
}
