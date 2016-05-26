import {PROJECTION_MERCATOR, PROJECTION_ORTHOGRAPHIC, setProjection} from './worldmap';

/**
 * Initialize navigation
 *
 * @param {d3.selection}  container Where to put the navigation
 */
export function init(container) {
  let nav = container.insert('nav');

  // button for mercator projection
  nav
    .append('span')
    .classed('btn icon-map2', true)
    .attr('data-projection', 'mercator')
    .on('click', setProjection.bind(null, PROJECTION_MERCATOR));

  // button for orthographic projection
  nav
    .append('span')
    .classed('btn icon-earth', true)
    .attr('data-projection', 'orthographic')
    .on('click', setProjection.bind(null, PROJECTION_ORTHOGRAPHIC));
}
