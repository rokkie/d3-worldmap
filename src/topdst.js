import table from './table';

const TXT_HEADER = 'Top Destinations';

/**
 * Count occurrences of destination
 *
 * @param   {Array}   data  Data to count destinations of
 * @returns {Object}        Data augmented with 'count'
 */
function countDestinations(data) {
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
 * Initialize table with top destination
 *
 * @param {d3.selection}  container Where to put the table in
 * @param {Array}         data      Raw data
 */
export function init(container, data) {
  let div = container.append('div').classed('datagrid', true),
      dst = countDestinations(data)
            .sort((a, b) => { return a.count < b.count; })
            .slice(0, 5);
  // header
  container.insert('h3', '.datagrid').text(TXT_HEADER);

  // draw table
  table(div, dst);
}
