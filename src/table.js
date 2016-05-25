import d3 from 'd3';

/**
 *
 * @param {d3.selection}  container
 * @param {Array}         data
 */
export default function (container, data) {
  let tbl   = container.append('table'),
      thead = tbl.insert('thead'),
      tbody = tbl.insert('tbody'),
      tr;

  // header
  thead.insert('tr').selectAll('th')
    .data(d3.keys(data[0]))
    .enter().append('th')
    .text((d) => { return d; });

  // rows
  tr = tbody.selectAll('tr')
    .data(data)
    .enter().append('tr');

  // cells
  tr.selectAll('td')
    .data((d) => { return d3.values(d); })
    .enter().append('td')
    .text((d) => { return d; });
}
