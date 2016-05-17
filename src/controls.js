import d3 from 'd3';
import * as worldmap from './worldmap';
import * as utils from './utils';

const TICK_INTERVAL = 20;
const TICK_STEP     = 100;
const STATE_PLAYING = 'playing';
const STATE_PAUSED  = 'paused';
const MODE_LOOPING  = 'looping';
const MODE_ENDING   = 'ending';

let interval, state, mode;

/**
 *
 * @param {d3.selection}  container
 */
function tick (container) {
  let el  = container.select('input[type="range"]'),
      val = parseInt(el.property('value'), 10),
      max = parseInt(el.property('max'), 10),
      min, newVal;

  if (max <= val) {
    if (MODE_LOOPING === mode) {
      min = parseInt(el.property('min'), 10);
      el.property('value', min);
    } else {
      pause();
    }
  } else {
    newVal = val + TICK_STEP;
    el.property('value', d3.min([newVal, max]));
  }

  el.node().dispatchEvent(new Event('change', {
    bubbles   : true,
    cancelable: false
  }));
}

/**
 *
 * @param   {d3.selection}  container
 * @param   {Array}         data
 * @returns {Function}
 */
function onChange (container, data) {
  let maxBytes = d3.max(data, (d) => { return parseInt(d.nbytes_size, 10); }),
      scaleFn  = d3.scale.linear().domain([0, maxBytes]).range(['green', 'red']);

  return function () {
    let timestamp = parseInt(d3.event.target.value, 10),
        updata;

    // update view with new date/time
    container.select('span.datetime').text(utils.dateFormat(new Date(timestamp)));

    // filter the dataset based on the datetime
    updata = data.filter((d) => {
      return (
        timestamp >= Date.parse(d.start_timestamp) &&
        timestamp <= Date.parse(d.end_timestamp)
      );
    });

    // update map with new data
    worldmap.update(updata, scaleFn);
  };
}

/**
 *
 */
function pause () {
  clearInterval(interval);
  state = STATE_PAUSED;
}

/**
 *
 * @param {d3.selection}  container
 */
function play (container) {
  if (STATE_PLAYING === state) { return; }

  interval = setInterval(tick.bind(undefined, container), TICK_INTERVAL);
  state    = STATE_PLAYING;
}

/**
 *
 */
function loop () {
  mode = (MODE_LOOPING === mode) ? MODE_ENDING : MODE_LOOPING;
}

/**
 *
 * @param {d3.selection}  container
 * @param {Array}         data
 * @param {Boolean}       autoplay  [optional] Default to true
 */
export function init (container, data, autoplay = true) {
  let minDate = d3.min(data, (d) => { return Date.parse(d.start_timestamp); }),
      maxDate = d3.max(data, (d) => { return Date.parse(d.end_timestamp); }),
      controls;

  // create a range input for the track
  controls = container
    .append('div')
    .classed('controls', true);

  controls
    .append('span')
    .classed('btn icon-play3', true)
    .on('click', play.bind(undefined, controls));

  controls
    .append('span')
    .classed('btn icon-pause2', true)
    .on('click', pause);

  controls
    .append('span')
    .classed('btn icon-loop2', true)
    .on('click', loop);

  controls
    .append('input')
    .attr('type', 'range')
    .attr('min', minDate)
    .attr('max', maxDate)
    .attr('value', minDate)
    .on('change', onChange(controls, data));

  // span to container current date/time
  controls
    .append('span')
    .classed('datetime', true);

  // set initial state and mode
  state = STATE_PAUSED;
  mode  = MODE_ENDING;

  // autoplay
  if (autoplay) { play(controls); }
}
