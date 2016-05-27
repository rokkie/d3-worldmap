import * as worldmap from './worldmap';
import * as controls from './controls';
import * as topdst from './topdst';
import {isObject} from './utils';

const URL_MAPDATA        = '/data/world-map.json';
const URL_TRANSFERS      = 'http://localhost:9090/transfers';
const ERR_MALFORMED_DATA = 'Data is malformed. Expected array, got';
const AUTOPLAY           = false;

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

      if (isObject(data) &&
        -1 !== Object.keys(data).indexOf('displayName') &&
        -1 !== Object.keys(data).indexOf('message')) {
        reject(data.message);
      }

      if (!Array.isArray(data)) {
        let actual = typeof data,
            e      = new TypeError(`${ERR_MALFORMED_DATA} ${actual}`);
        reject(e);
      }

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
    topdst.init(wrap, traffic);
  }, (err) => {
    // error in console
    console.error(err);
  }).then(() => {
    // remove the loading animation
    d3.select('#loading-anim').remove();
  });
}
