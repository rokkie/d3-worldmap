import {PROJECTION_MERCATOR, PROJECTION_ORTHOGRAPHIC} from './worldmap';

export default class Navigation {
  /**
   * Constructor
   *
   * @param {d3.selection} container  Where to put the navigation in
   * @param {Worldmap}     map        The map
   */
  constructor (container, map) {
    let nav = container.insert('nav');

    // button for mercator projection
    nav
      .append('span')
      .classed('btn icon-map2', true)
      .attr('data-projection', 'mercator')
      .on('click', () => { map.projectionName = PROJECTION_MERCATOR; });

    // button for orthographic projection
    nav
      .append('span')
      .classed('btn icon-earth', true)
      .attr('data-projection', 'orthographic')
      .on('click', () => { map.projectionName = PROJECTION_ORTHOGRAPHIC; });
  }
}
