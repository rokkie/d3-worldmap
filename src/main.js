import d3 from 'd3';
import Worldmap from './worldmap';
import Controls from './controls';
import TopDst from './topdst';
import Data from './data';

/**
 * Application entry
 */
export default function main () {
  // fetch data
  let pWorldMap = Data.fetchMap(),
      pTraffic  = Data.fetchTraffic();

  // when they are both loaded
  Promise.all([pWorldMap, pTraffic]).then((data) => {
    let wrap = d3.select('#wrap'),
        map, ctrl, top;

    // create the map and controls
    map  = new Worldmap(wrap, data[0]);
    ctrl = new Controls(wrap, map, data[1]);
    top  = new TopDst(wrap, data[1]);

    // fetch traffic again on date change
    ctrl.controls.on('datechange', () => {
      let detail = d3.event.detail;

      Data.fetchTraffic({
        dateIn : detail.dateIn.getTime(),
        dateOut: detail.dateOut.getTime()
      }).then((data) => {
        ctrl.data = data;
        top.data  = data;
      });
    });

  }, (err) => {
    // error in console
    console.error(err);
  }).then(() => {
    // remove the loading animation
    d3.select('#loading-anim').remove();
  });
}
