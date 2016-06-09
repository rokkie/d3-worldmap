import Worldmap from './worldmap';
import Controls from './controls';
import topdst from './topdst';
import * as data from './data';

/**
 * Application entry
 */
export default function main () {
  // fetch data
  let pWorldMap = data.fetchMapData(),
      pTraffic  = data.fetchTrafficData();

  // when they are both loaded
  Promise.all([pWorldMap, pTraffic]).then((data) => {
    let mapdata = data[0],
        traffic = data[1],
        wrap    = d3.select('#wrap'),
        map, ctrl;

    // create the map and controls
    map  = new Worldmap(wrap, mapdata);
    ctrl = new Controls(wrap, map, traffic);

    // create table with top destinations
    topdst(wrap, traffic);


  }, (err) => {
    // error in console
    console.error(err);
  }).then(() => {
    // remove the loading animation
    d3.select('#loading-anim').remove();
  });
}
