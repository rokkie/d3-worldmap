import table from './table';

const TXT_HEADER = 'Top Destinations';

/**
 *
 * @param   {Array} data
 * @returns {*}
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
 *
 * @param {d3.selection}  container
 * @param {Array}         data
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
