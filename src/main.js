import * as worldmap from './worldmap';
import * as controls from './controls';

const URL_MAPDATA   = '/data/world-map.json';
const URL_TRANSFERS = 'http://localhost:9090/transfers';
const AUTOPLAY      = false;

/**
 * Application entry
 */
export default function main () {
  // fetch map data
  let pWorldMap = new Promise((resolve, reject) => {
    d3.json(URL_MAPDATA, (err, data) => {
      if (err) { reject(err); }
      resolve(data);
    });
  });

  // fetch traffic data
  let pTraffic = new Promise((resolve, reject) => {
    d3.json(URL_TRANSFERS, (err, data) => {
      if (err) { reject(err); }
      resolve(data);
    });
  });

  // when they are both loaded
  Promise.all([pWorldMap, pTraffic]).then((data) => {
    let mapdata = data[0],
        traffic = data[1],
        wrap    = d3.select('#wrap');

    // init the map and initialize the controls
    worldmap.init(wrap, mapdata);
    controls.init(wrap, traffic, AUTOPLAY);

    // remove the loading animation
    d3.select('#loading-anim').remove();
  });
}
